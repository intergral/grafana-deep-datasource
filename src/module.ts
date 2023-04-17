import { DataSourcePlugin } from '@grafana/data';
import { DeepDataSource } from './DeepDataSource';
import { ConfigEditor } from './components/ConfigEditor';
import { QueryEditor } from './components/QueryEditor';
import { DeepQuery, MyDataSourceOptions } from './types';

export const plugin = new DataSourcePlugin<DeepDataSource, DeepQuery, MyDataSourceOptions>(DeepDataSource)
  .setConfigEditor(ConfigEditor)
  .setQueryEditor(QueryEditor);
