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
