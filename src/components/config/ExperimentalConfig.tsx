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
import { updateDatasourcePluginJsonDataOption } from '@grafana/data';

export function ExperimentalSettings({ onOptionsChange, options }: Props) {
  return (
    <>
      <div>
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
      </div>
    </>
  );
}
