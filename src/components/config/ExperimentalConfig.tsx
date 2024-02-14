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
import { InlineField, InlineFieldRow, InlineSwitch } from '@grafana/ui';
import React from 'react';
import { Props } from '../ConfigEditor';
import { DataSourceInstanceSettings, updateDatasourcePluginJsonDataOption } from '@grafana/data';
import { ConfigSection } from '@grafana/experimental';
import { DataSourcePicker } from '@grafana/runtime';

export function ExperimentalSettings({ onOptionsChange, options }: Props) {
  return (
    <>
      <ConfigSection title={'Experimental Settings'}>
        <InlineFieldRow>
          <InlineField tooltip="deepQL" label="Enable the deepQL search." labelWidth={26}>
            <InlineSwitch
              id={'deepql'}
              value={options.jsonData.experimental?.deepql ?? false}
              onChange={(event: React.SyntheticEvent<HTMLInputElement>) =>
                updateDatasourcePluginJsonDataOption({ onOptionsChange, options }, 'experimental', {
                  ...options.jsonData.experimental,
                  deepql: event.currentTarget.checked,
                })
              }
            />
          </InlineField>
        </InlineFieldRow>
        <InlineFieldRow>
          <InlineField tooltip="The Trace source for deep to check." label="Data source" labelWidth={26}>
            <DataSourcePicker
              inputId="deep-to-trace"
              filter={(ds) => ds.type === 'tempo'}
              current={options.jsonData.experimental?.tempo?.datasource}
              noDefault={true}
              width={40}
              onChange={(ds: DataSourceInstanceSettings) =>
                updateDatasourcePluginJsonDataOption({ onOptionsChange, options }, 'experimental', {
                  ...options.jsonData.experimental,
                  tempo: {
                    ...options.jsonData.experimental.tempo,
                    datasource: ds.uid,
                  },
                })
              }
            />
          </InlineField>
        </InlineFieldRow>
      </ConfigSection>
    </>
  );
}
