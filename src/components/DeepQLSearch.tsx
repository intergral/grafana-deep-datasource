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
