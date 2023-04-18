import React from 'react';
import { DataSourceHttpSettings } from '@grafana/ui';
import { DataSourcePluginOptionsEditorProps } from '@grafana/data';
import { MyDataSourceOptions } from '../types';

interface Props extends DataSourcePluginOptionsEditorProps<MyDataSourceOptions> {}

export function ConfigEditor({ onOptionsChange, options }: Props) {
  return (
    <div className="gf-form-group">
      <DataSourceHttpSettings
        defaultUrl="http://deep"
        dataSourceConfig={options}
        showAccessOptions={false}
        onChange={onOptionsChange}
      />
    </div>
  );
}
