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
import { InlineField, InlineFieldRow, InlineLabel, Input } from '@grafana/ui';
import { DEFAULT_LIMIT } from '../../deepql/DeepDataSource';
import React, { useState } from 'react';

export const TracepointList = ({ query, onChange, onRunQuery }: Props) => {
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
                setInputErrors({ ...inputErrors, limit: true });
              } else {
                setInputErrors({ ...inputErrors, limit: false });
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
  );
};
