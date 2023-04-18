/*
 *    Copyright 2023 Intergral GmbH
 *
 *    Licensed under the Apache License, Version 2.0 (the "License");
 *    you may not use this file except in compliance with the License.
 *    You may obtain a copy of the License at
 *
 *        http://www.apache.org/licenses/LICENSE-2.0
 *
 *    Unless required by applicable law or agreed to in writing, software
 *    distributed under the License is distributed on an "AS IS" BASIS,
 *    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *    See the License for the specific language governing permissions and
 *    limitations under the License.
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
		res := d.query(ctx, req.PluginContext, q)

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

func (d *DeepDatasource) query(_ context.Context, pCtx backend.PluginContext, query backend.DataQuery) backend.DataResponse {

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
			PreferredVisualization: "snapshot",
		},
	}

	hexString := SnapshotIDToHexString(snap.ID)
	tpJson, _ := json.Marshal(snap.Tracepoint)
	lookupJson, _ := json.Marshal(snap.VarLookup)
	framesJson, _ := json.Marshal(snap.Frames)
	watchesJson, _ := json.Marshal(snap.Watches)
	attributesJson, _ := json.Marshal(snap.Attributes)
	resourceJson, _ := json.Marshal(snap.Resource)

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

	defer response.Body.Close()
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
