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
