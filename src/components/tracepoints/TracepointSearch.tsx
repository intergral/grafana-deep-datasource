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

import React from "react"
import {InlineField, RadioButtonGroup} from "@grafana/ui";
import {Props} from "../QueryEditor";
import {DeepTracepointQueryType} from "../../types";
import {config, reportInteraction} from "@grafana/runtime";
import {SelectableValue} from "@grafana/data";
import {TracepointList} from "./TracepointList";
import {TracepointDelete} from "./TracepointDelete";
import {TracepointCreate} from "./TracepointCreate";


export const TracepointSearch = ({datasource, query, onChange, onRunQuery, app}: Props) => {
    let queryTypeOptions: Array<SelectableValue<DeepTracepointQueryType>> = [
        {value: 'list', label: 'List Tracepoints'},
        {value: 'create', label: 'Create Tracepoint'},
        {value: 'delete', label: 'Delete Tracepoint'},
    ];


    if (!query.tpQueryType) {
        query.tpQueryType = 'list';
    }

    return (
        <>
            <InlineField label="Tracepoint Action">
                <RadioButtonGroup<DeepTracepointQueryType>
                    options={queryTypeOptions}
                    value={query.tpQueryType}
                    onChange={(v) => {
                        reportInteraction('grafana_snapshot_query_type_changed', {
                            datasourceType: 'deep',
                            app: app ?? '',
                            grafana_version: config.buildInfo.version,
                            newTpQueryType: v,
                            previousTpQueryType: query.tpQueryType ?? '',
                        });

                        onChange({
                            ...query,
                            tpQueryType: v,
                        });
                    }}
                    size="md"
                />
            </InlineField>
            {query.tpQueryType === "list" && (
                <TracepointList
                    query={query}
                    onChange={onChange}
                    onRunQuery={onRunQuery}
                    datasource={datasource}/>
            )}
            {query.tpQueryType === 'delete' && (
                <TracepointDelete datasource={datasource} query={query} onRunQuery={onRunQuery} onChange={onChange}/>
            )}
            {query.tpQueryType === 'create' && (
                <TracepointCreate datasource={datasource} query={query} onRunQuery={onRunQuery} onChange={onChange}/>
            )}
        </>
    )
}
