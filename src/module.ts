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

import { DataSourcePlugin } from '@grafana/data';
import { DeepDataSource } from './deepql/DeepDataSource';
import { ConfigEditor } from './components/ConfigEditor';
import { QueryEditor } from './components/QueryEditor';
import { DeepQuery, DeepDatasourceOptions } from './types';

export const plugin = new DataSourcePlugin<DeepDataSource, DeepQuery, DeepDatasourceOptions>(DeepDataSource)
  .setConfigEditor(ConfigEditor)
  .setQueryEditor(QueryEditor);
