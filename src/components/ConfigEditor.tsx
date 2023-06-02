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

import React from 'react';
import { DataSourceHttpSettings } from '@grafana/ui';
import { DataSourcePluginOptionsEditorProps } from '@grafana/data';
import { DeepDatasourceOptions } from '../types';
import { ExperimentalSettings } from './config/ExperimentalConfig';

export interface Props extends DataSourcePluginOptionsEditorProps<DeepDatasourceOptions> {}

export function ConfigEditor({ onOptionsChange, options }: Props) {
  return (
    <>
      <div className="gf-form-group">
        <DataSourceHttpSettings
          defaultUrl="http://deep"
          dataSourceConfig={options}
          showAccessOptions={false}
          onChange={onOptionsChange}
        />
      </div>
      <div className="gf-form-group">
        <ExperimentalSettings options={options} onOptionsChange={onOptionsChange} />
      </div>
    </>
  );
}
