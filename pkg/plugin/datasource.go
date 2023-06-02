/*
 * Copyright (C) 2023  Intergral GmbH
 *
 *     This program is free software: you can redistribute it and/or modify
 *     it under the terms of the GNU Affero General Public License as published by
 *     the Free Software Foundation, either version 3 of the License, or
 *     (at your option) any later version.
 *
 *     This program is distributed in the hope that it will be useful,
 *     but WITHOUT ANY WARRANTY; without even the implied warranty of
 *     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *     GNU Affero General Public License for more details.
 *
 *     You should have received a copy of the GNU Affero General Public License
 *     along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

package plugin

import (
	"context"
	"encoding/hex"
	"encoding/json"
	"fmt"
	kitlog "github.com/go-kit/log"
	"github.com/golang/protobuf/proto"
	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/backend/httpclient"
	"github.com/grafana/grafana-plugin-sdk-go/backend/instancemgmt"
	"github.com/grafana/grafana-plugin-sdk-go/data"
	"github.com/intergral/go-deep-proto/common/v1"
	deep_pp "github.com/intergral/go-deep-proto/poll/v1"
	deep_tp "github.com/intergral/go-deep-proto/tracepoint/v1"
	"io"
	"net/http"
	"os"
	"strings"
)

// Make sure DeepDatasource implements required interfaces. This is important to do
// since otherwise we will only get a not implemented error response from plugin in
// runtime. In this example datasource instance implements backend.QueryDataHandler,
// backend.CheckHealthHandler interfaces. Plugin should not implement all these
// interfaces- only those which are required for a particular task.
var (
	_ backend.QueryDataHandler      = (*DeepDatasource)(nil)
	_ backend.CheckHealthHandler    = (*DeepDatasource)(nil)
	_ instancemgmt.InstanceDisposer = (*DeepDatasource)(nil)
)

// NewDeepDatasource creates a new datasource instance.
func NewDeepDatasource(settings backend.DataSourceInstanceSettings) (instancemgmt.Instance, error) {
	client, err := buildHttpClient(settings)
	if err != nil {
		return nil, err
	}
	writer := kitlog.NewSyncWriter(os.Stderr)
	return &DeepDatasource{
		client: client,
		log:    kitlog.NewLogfmtLogger(writer),
	}, nil
}

func buildHttpClient(settings backend.DataSourceInstanceSettings) (*http.Client, error) {
	mw, err := getMiddlewares(settings)
	if err != nil {
		return nil, err
	}
	return httpclient.New(mw)
}

func getMiddlewares(settings backend.DataSourceInstanceSettings) (httpclient.Options, error) {
	return settings.HTTPClientOptions()
}

// DeepDatasource is an example datasource which can respond to data queries, reports
// its health and has streaming skills.
type DeepDatasource struct {
	client *http.Client
	log    kitlog.Logger
}

// Dispose here tells plugin SDK that plugin wants to clean up resources when a new instance
// created. As soon as datasource settings change detected by SDK old datasource instance will
// be disposed and a new one will be created using NewSampleDatasource factory function.
func (d *DeepDatasource) Dispose() {
	// Clean up datasource instance resources.
}

// QueryData handles multiple queries and returns multiple responses.
// req contains the queries []DataQuery (where each query contains RefID as a unique identifier).
// The QueryDataResponse contains a map of RefID to the response for each query, and each response
// contains Frames ([]*Frame).
func (d *DeepDatasource) QueryData(ctx context.Context, req *backend.QueryDataRequest) (*backend.QueryDataResponse, error) {
	// create response struct
	response := backend.NewQueryDataResponse()

	// loop over queries and execute them individually.
	for _, q := range req.Queries {
		var res backend.DataResponse
		switch q.QueryType {
		case "deepql":
		case "byid":
			res = d.queryByID(ctx, req.PluginContext, q)
		case "tracepoint":
			res = d.queryTracepoint(ctx, req.PluginContext, q)
		}

		// save the response in a hashmap
		// based on with RefID as identifier
		response.Responses[q.RefID] = res
	}

	return response, nil
}

type queryModel struct {
	Search      string `json:"search"`
	ServiceName string `json:"serviceName"`
	Limit       uint   `json:"limit"`
	Query       string `json:"query"`
}

func (d *DeepDatasource) queryTracepoint(_ context.Context, pCtx backend.PluginContext, query backend.DataQuery) backend.DataResponse {

	url := fmt.Sprintf("%v/tracepoints/api/tracepoints", pCtx.DataSourceInstanceSettings.URL)

	request, err := http.NewRequest(http.MethodGet, url, nil)
	if err != nil {
		return backend.ErrDataResponse(backend.StatusBadRequest, fmt.Sprintf("cannot build request: %v", err.Error()))
	}
	request.Header.Set("Accept", "application/protobuf")

	response, err := d.client.Do(request)
	if err != nil {
		return backend.ErrDataResponse(backend.StatusBadRequest, fmt.Sprintf("request failed: %v", err.Error()))
	}
	defer func(Body io.ReadCloser) {
		err := Body.Close()
		if err != nil {
			_ = d.log.Log("msg", "failed to close response body", "err", err)
		}
	}(response.Body)

	all, err := io.ReadAll(response.Body)
	if err != nil {
		return backend.ErrDataResponse(backend.StatusBadRequest, fmt.Sprintf("read failed: %v", err.Error()))
	}

	var pollResponse deep_pp.PollResponse
	err = proto.Unmarshal(all, &pollResponse)
	if err != nil {
		return backend.ErrDataResponse(backend.StatusBadRequest, fmt.Sprintf("response failed: %v", err.Error()))
	}

	frame, err := pollResponseToFrame(&pollResponse)
	if err != nil {
		return backend.ErrDataResponse(backend.StatusBadRequest, fmt.Sprintf("convertion failed: %v", err.Error()))
	}

	frame.RefID = query.RefID
	return backend.DataResponse{
		Frames: []*data.Frame{frame},
	}
}

func (d *DeepDatasource) queryByID(_ context.Context, pCtx backend.PluginContext, query backend.DataQuery) backend.DataResponse {

	// Unmarshal the JSON into our queryModel.
	var qm queryModel

	err := json.Unmarshal(query.JSON, &qm)
	if err != nil {
		return backend.ErrDataResponse(backend.StatusBadRequest, fmt.Sprintf("json unmarshal: %v", err.Error()))
	}

	url := fmt.Sprintf("%v/api/snapshots/%v", pCtx.DataSourceInstanceSettings.URL, qm.Query)

	request, err := http.NewRequest(http.MethodGet, url, nil)
	if err != nil {
		return backend.ErrDataResponse(backend.StatusBadRequest, fmt.Sprintf("cannot build request: %v", err.Error()))
	}
	request.Header.Set("Accept", "application/protobuf")

	response, err := d.client.Do(request)
	if err != nil {
		return backend.ErrDataResponse(backend.StatusBadRequest, fmt.Sprintf("request failed: %v", err.Error()))
	}
	defer func(Body io.ReadCloser) {
		err := Body.Close()
		if err != nil {
			_ = d.log.Log("msg", "failed to close response body", "err", err)
		}
	}(response.Body)

	all, err := io.ReadAll(response.Body)
	if err != nil {
		return backend.ErrDataResponse(backend.StatusBadRequest, fmt.Sprintf("read failed: %v", err.Error()))
	}

	var snap deep_tp.Snapshot
	err = proto.Unmarshal(all, &snap)
	if err != nil {
		return backend.ErrDataResponse(backend.StatusBadRequest, fmt.Sprintf("response failed: %v", err.Error()))
	}

	frame, err := snapshotToFrame(&snap)
	if err != nil {
		return backend.ErrDataResponse(backend.StatusBadRequest, fmt.Sprintf("convertion failed: %v", err.Error()))
	}

	frame.RefID = query.RefID
	return backend.DataResponse{
		Frames: []*data.Frame{frame},
	}
}

func pollResponseToFrame(pollResponse *deep_pp.PollResponse) (*data.Frame, error) {
	frame := &data.Frame{
		Name: "Tracepoint",
		Fields: []*data.Field{
			data.NewField("ID", nil, []string{}),
			data.NewField("Path", nil, []string{}),
			data.NewField("Line", nil, []uint32{}),
			data.NewField("Args", nil, []json.RawMessage{}),
			data.NewField("Watches", nil, []json.RawMessage{}),
			data.NewField("Targeting", nil, []json.RawMessage{}),
		},
		Meta: &data.FrameMeta{
			PreferredVisualization: "table",
		},
	}

	for _, tp := range pollResponse.Response {
		tpArgs, _ := json.Marshal(tp.Args)
		tpWatches, _ := json.Marshal(tp.Watches)
		tpTargeting, _ := json.Marshal(keyValuesToMap(tp.Targeting))
		frame.AppendRow(tp.ID, tp.Path, tp.LineNumber, json.RawMessage(tpArgs), json.RawMessage(tpWatches), json.RawMessage(tpTargeting))
	}

	return frame, nil
}

func snapshotToFrame(snap *deep_tp.Snapshot) (*data.Frame, error) {
	frame := &data.Frame{
		Name: "Snapshot",
		Fields: []*data.Field{
			data.NewField("snapshotID", nil, []string{}),
			data.NewField("tracepoint", nil, []json.RawMessage{}),
			data.NewField("varLookup", nil, []json.RawMessage{}),
			data.NewField("tsNanos", nil, []uint64{}),
			data.NewField("Frames", nil, []json.RawMessage{}),
			data.NewField("Watches", nil, []json.RawMessage{}),
			data.NewField("Attributes", nil, []json.RawMessage{}),
			data.NewField("DurationNanos", nil, []uint64{}),
			data.NewField("Resource", nil, []json.RawMessage{}),
		},
		Meta: &data.FrameMeta{
			PreferredVisualization: "plugin",
			Custom: map[string]interface{}{
				"pluginID": "intergral-deep-panel",
				"title":    fmt.Sprintf("Snapshot: %v:%v", snap.Tracepoint.Path, snap.Tracepoint.LineNumber),
			},
		},
	}

	hexString := SnapshotIDToHexString(snap.ID)
	tpJson, _ := json.Marshal(snap.Tracepoint)
	lookupJson, _ := json.Marshal(snap.VarLookup)
	framesJson, _ := json.Marshal(snap.Frames)
	watchesJson, _ := json.Marshal(snap.Watches)
	attributesJson, _ := json.Marshal(keyValuesToMap(snap.Attributes))
	resourceJson, _ := json.Marshal(keyValuesToMap(snap.Resource))

	frame.AppendRow(
		hexString,
		json.RawMessage(tpJson),
		json.RawMessage(lookupJson),
		snap.TsNanos,
		json.RawMessage(framesJson),
		json.RawMessage(watchesJson),
		json.RawMessage(attributesJson),
		snap.DurationNanos,
		json.RawMessage(resourceJson),
	)

	return frame, nil
}

func keyValuesToMap(attributes []*v1.KeyValue) map[string]interface{} {
	var kvMap = make(map[string]interface{}, len(attributes))

	for _, attribute := range attributes {
		key := attribute.Key
		value := anyValueToString(attribute.Value)

		kvMap[key] = value
	}

	return kvMap
}

func anyValueToString(val *v1.AnyValue) interface{} {

	var value interface{}
	switch v := val.Value.(type) {
	case *v1.AnyValue_StringValue:
		value = v.StringValue
	case *v1.AnyValue_IntValue:
		value = v.IntValue
	case *v1.AnyValue_DoubleValue:
		value = v.DoubleValue
	case *v1.AnyValue_BoolValue:
		value = v.BoolValue
	case *v1.AnyValue_BytesValue:
		value = "Unsupported type: bytes"
	case *v1.AnyValue_ArrayValue:
		values := v.ArrayValue.Values
		strArr := make([]interface{}, len(values))
		for i, anyValue := range values {
			toString := anyValueToString(anyValue)
			strArr[i] = toString
		}
		bytes, _ := json.Marshal(strArr)
		value = string(bytes)
	case *v1.AnyValue_KvlistValue:
		kvlistValue := v.KvlistValue
		toMap := keyValuesToMap(kvlistValue.Values)
		val, _ := json.Marshal(toMap)
		value = string(val)
	}

	return value
}

// SnapshotIDToHexString converts a trace ID to its string representation and removes any leading zeros.
func SnapshotIDToHexString(byteID []byte) string {
	id := hex.EncodeToString(byteID)
	// remove leading zeros
	id = strings.TrimLeft(id, "0")
	return id
}

// CheckHealth handles health checks sent from Grafana to the plugin.
// The main use case for these health checks is the test button on the
// datasource configuration page which allows users to verify that
// a datasource is working as expected.
func (d *DeepDatasource) CheckHealth(_ context.Context, req *backend.CheckHealthRequest) (*backend.CheckHealthResult, error) {
	url := fmt.Sprintf("%v/api/echo", req.PluginContext.DataSourceInstanceSettings.URL)

	request, err := http.NewRequest(http.MethodGet, url, nil)

	if err != nil {
		return &backend.CheckHealthResult{
			Status:  backend.HealthStatusError,
			Message: fmt.Sprintf("%v", err),
		}, nil
	}

	response, err := d.client.Do(request)

	if err != nil {
		return &backend.CheckHealthResult{
			Status:  backend.HealthStatusError,
			Message: fmt.Sprintf("%v", err),
		}, nil
	}

	if response.StatusCode != 200 {
		return &backend.CheckHealthResult{
			Status:  backend.HealthStatusError,
			Message: fmt.Sprintf("Status code %v returned", response.StatusCode),
		}, nil
	}

	defer func(Body io.ReadCloser) {
		_ = Body.Close()
	}(response.Body)
	body, err := io.ReadAll(response.Body)
	if err != nil {
		return &backend.CheckHealthResult{
			Status:  backend.HealthStatusError,
			Message: "Could not parse response body",
		}, nil
	}

	responseBody := string(body)
	if responseBody != "echo\n" {
		return &backend.CheckHealthResult{
			Status:  backend.HealthStatusError,
			Message: "Unexpected response from DEEP. Is this a DEEP instance?",
		}, nil
	}

	return &backend.CheckHealthResult{
		Status:  backend.HealthStatusOk,
		Message: "Data source is working",
	}, nil
}
