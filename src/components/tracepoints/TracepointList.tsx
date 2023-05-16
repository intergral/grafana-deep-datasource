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


import {Props} from "../QueryEditor";
import {InlineField, InlineFieldRow, InlineLabel, Input} from "@grafana/ui";
import {DEFAULT_LIMIT} from "../../DeepDataSource";
import React, {useState} from "react";

export const TracepointList = ({query, onChange, onRunQuery}:Props)=> {
    const [inputErrors, setInputErrors] = useState<{ [key: string]: boolean }>({});

    const onKeyDown = (keyEvent: React.KeyboardEvent) => {
        if (keyEvent.key === 'Enter' && (keyEvent.shiftKey || keyEvent.ctrlKey)) {
            onRunQuery();
        }
    };

    return (
        <>
            <InlineLabel>
                Show the current configured tracepoints
                <a rel="noreferrer" target="_blank" href="TODO/">
                    Documentation
                </a>
            </InlineLabel>
            <InlineFieldRow>
                <InlineField
                    label="Limit"
                    invalid={inputErrors.limit}
                    labelWidth={14}
                    grow
                    tooltip="Maximum number of returned results"
                >
                    <Input
                        id="limit"
                        value={query.limit || ''}
                        placeholder={`Default: ${DEFAULT_LIMIT}`}
                        type="number"
                        onChange={(v) => {
                            let limit = v.currentTarget.value ? parseInt(v.currentTarget.value, 10) : undefined;
                            if (limit && (!Number.isInteger(limit) || limit <= 0)) {
                                setInputErrors({...inputErrors, limit: true});
                            } else {
                                setInputErrors({...inputErrors, limit: false});
                            }

                            onChange({
                                ...query,
                                limit: v.currentTarget.value ? parseInt(v.currentTarget.value, 10) : undefined,
                            });
                        }}
                        onKeyDown={onKeyDown}
                    />
                </InlineField>
            </InlineFieldRow>
        </>
    )
}
