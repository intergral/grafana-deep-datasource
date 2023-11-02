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
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
)

func TestQueryByIdNotFound(t *testing.T) {
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(404)
	}))

	settings := &backend.DataSourceInstanceSettings{
		URL: ts.URL,
	}
	ds, err := NewDeepDatasource(*settings)

	resp, err := ds.(*DeepDatasource).QueryData(context.Background(),
		&backend.QueryDataRequest{
			Queries: []backend.DataQuery{
				{
					RefID:     "A",
					QueryType: "byid",
					JSON:      []byte("{\"query\": \"123\"}"),
				},
			},
			PluginContext: backend.PluginContext{
				DataSourceInstanceSettings: settings,
			},
		})
	if err != nil {
		t.Error(err)
	}

	if len(resp.Responses) != 1 {
		t.Fatal("QueryData must return a response")
	}

	if fmt.Sprintf("%s", resp.Responses["A"].Error) != "Cannot find snapshot with id: 123" {
		t.Fatalf("Unexpected error from 404")
	}
}
