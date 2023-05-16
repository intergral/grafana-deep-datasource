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
import {Button, HorizontalGroup, InlineField, InlineFieldRow, InlineLabel, Input} from "@grafana/ui";
import React, {useState} from "react";
import {isValidID} from "../../Utils";
import {firstValueFrom} from "rxjs";

export const TracepointDelete = ({datasource, query, onChange, onRunQuery}: Props) => {
    const [inputErrors, setInputErrors] = useState<{ [key: string]: boolean }>({});
    const [isLoading, setLoading] = useState<boolean>(false);

    const onKeyDown = (keyEvent: React.KeyboardEvent) => {
        if (keyEvent.key === 'Enter' && (keyEvent.shiftKey || keyEvent.ctrlKey)) {
            onRunQuery();
        }
    };

    return (
        <>
            <InlineLabel>
                Enter a tracepoint id to delete the tracepoint
                <a rel="noreferrer" target="_blank" href="TODO/">
                    Documentation
                </a>
            </InlineLabel>
            <InlineFieldRow>
                <InlineField
                    label="Tracepoint ID"
                    invalid={inputErrors.tpid}
                    labelWidth={14}
                    grow
                    tooltip="The ID of the tracepoint to delete"
                >
                    <Input
                        id="tpid"
                        value={query.query || ''}
                        placeholder={`47c5f46d-e1d0-4a67-9941-db8552147e4f`}
                        onChange={(v) => {
                            let value = v.currentTarget.value
                            if (value && isValidID(value)) {
                                setInputErrors({...inputErrors, tpid: true});
                            } else {
                                setInputErrors({...inputErrors, tpid: false});
                            }

                            onChange({
                                ...query,
                                query: value
                            });
                        }}
                        onKeyDown={onKeyDown}
                    />
                </InlineField>
            </InlineFieldRow>
            <HorizontalGroup
                justify={'flex-end'}
            >
                <Button
                    icon={isLoading ? 'fa fa-spinner' : undefined}
                    onClick={async () => {
                        setLoading(true)
                        await firstValueFrom(datasource.handleDeleteTracepoint(query));
                        onRunQuery()
                        onChange({
                            ...query,
                            query: ''
                        })
                        setLoading(false)
                    }}
                >Delete Tracepoint</Button>
            </HorizontalGroup>
        </>
    )
}
