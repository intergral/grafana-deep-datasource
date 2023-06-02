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

import { InlineField, InlineFieldRow, InlineLabel, Input, useStyles2 } from '@grafana/ui';
import React, { useState } from 'react';
import { Props } from './QueryEditor';
import { css } from '@emotion/css';

function getStyles() {
  return {
    container: css`
      min-width: 500px;
    `,
  };
}

export function FindByIDSearch({ datasource, query, onChange, onRunQuery }: Props) {
  const styles = useStyles2(getStyles);
  const [inputErrors, setInputErrors] = useState<{ [key: string]: boolean }>({});

  const hexOnlyRegex = /^[0-9A-Fa-f]*$/;

  return (
    <>
      <div className={styles.container}>
        <InlineLabel>Enter the ID of a snapshot to view the data.</InlineLabel>
        <InlineFieldRow>
          <InlineField label="Find by ID" invalid={inputErrors.byid} grow tooltip="Find a single snapshot by ID">
            <Input
              type={'text'}
              value={query.query}
              onChange={(v) => {
                if (!v.currentTarget.value.trim().match(hexOnlyRegex)) {
                  setInputErrors({ ...inputErrors, byid: true });
                } else {
                  setInputErrors({ ...inputErrors, byid: false });
                }
                onChange({
                  ...query,
                  query: v.currentTarget.value,
                });
              }}
            />
          </InlineField>
        </InlineFieldRow>
      </div>
    </>
  );
}
