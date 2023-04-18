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

import { InlineLabel, useStyles2 } from '@grafana/ui';
import { Props } from './QueryEditor';
import { css } from '@emotion/css';
import { DeepQLEditor } from './DeepQLEditor';
import React from 'react';

export const DeepQLSearch = ({ datasource, query, onChange, onRunQuery }: Props) => {
  const styles = useStyles2(getStyles);

  return (
    <>
      <InlineLabel>
        Build complex queries using DeepQL to select a list of snapshots.{' '}
        <a rel="noreferrer" target="_blank" href="TODO/">
          Documentation
        </a>
      </InlineLabel>
      <DeepQLEditor
        placeholder="Enter a DeepQL query or snapshot ID (run with Shift+Enter)"
        query={query}
        onChange={onChange}
        datasource={datasource}
        onRunQuery={onRunQuery}
        readOnly={false}
      />
      <div className={styles.optionsContainer}></div>
    </>
  );
};

const getStyles = () => ({
  optionsContainer: css`
    margin-top: 10px;
  `,
});
