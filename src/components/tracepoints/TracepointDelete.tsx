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

import { Props } from '../QueryEditor';
import { Button, HorizontalGroup, InlineField, InlineFieldRow, InlineLabel, Input } from '@grafana/ui';
import React, { useState } from 'react';
import { isValidTracepointID } from '../../Utils';
import { firstValueFrom } from 'rxjs';

export const TracepointDelete = ({ datasource, query, onChange, onRunQuery }: Props) => {
  const [inputErrors, setInputErrors] = useState<{ [key: string]: boolean }>({
    tpid: !isValidTracepointID(query.query),
  });
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
          labelWidth={20}
          grow
          tooltip="The ID of the tracepoint to delete"
        >
          <Input
            id="tpid"
            value={query.query || ''}
            placeholder={`47c5f46d-e1d0-4a67-9941-db8552147e4f`}
            onChange={(v) => {
              let value = v.currentTarget.value;
              if (value && isValidTracepointID(value)) {
                setInputErrors({ ...inputErrors, tpid: false });
              } else {
                setInputErrors({ ...inputErrors, tpid: true });
              }

              onChange({
                ...query,
                query: value,
              });
            }}
            onKeyDown={onKeyDown}
          />
        </InlineField>
      </InlineFieldRow>
      <HorizontalGroup justify={'flex-end'}>
        <Button
          disabled={inputErrors.tpid}
          icon={isLoading ? 'fa fa-spinner' : undefined}
          onClick={async () => {
            setLoading(true);
            await firstValueFrom(datasource.handleDeleteTracepoint(query));
            onRunQuery();
            onChange({
              ...query,
              query: '',
            });
            setLoading(false);
          }}
        >
          Delete Tracepoint
        </Button>
      </HorizontalGroup>
    </>
  );
};
