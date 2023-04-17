import {CoreApp, DataSourceInstanceSettings} from '@grafana/data';
import {DataSourceWithBackend} from '@grafana/runtime';

import {DEFAULT_QUERY, MyDataSourceOptions, MyQuery} from './types';

export class DataSource extends DataSourceWithBackend<MyQuery, MyDataSourceOptions> {
    constructor(instanceSettings: DataSourceInstanceSettings<MyDataSourceOptions>) {
        super(instanceSettings);
    }

    getDefaultQuery(_: CoreApp): Partial<MyQuery> {
        return DEFAULT_QUERY
    }


    // async testDatasource(): Promise<any> {
    //     const options: BackendSrvRequest = {
    //         headers: {},
    //         method: 'GET',
    //         url: `${this.instanceSettings.url}/api/echo`,
    //     };
    //     console.log(this.instanceSettings)
    //     const response = await lastValueFrom(getBackendSrv().fetch(options));
    //
    //     if (response?.ok) {
    //         return {status: 'success', message: 'Data source is working'};
    //     }
    // }
}
