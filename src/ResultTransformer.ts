import {MyDataSourceOptions, Snapshot, SnapshotSearchMetadata, SnapshotTableData} from "./types";
import {DataFrame, DataSourceInstanceSettings, dateTimeFormat, FieldType, MutableDataFrame} from "@grafana/data";

export function createTableFrameFromTraceQlQuery(
    data: SnapshotSearchMetadata[],
    instanceSettings: DataSourceInstanceSettings
): DataFrame[] {
    const frame = new MutableDataFrame({
        fields: [
            {
                name: 'traceID',
                type: FieldType.string,
                config: {
                    unit: 'string',
                    displayNameFromDS: 'Trace ID',
                    custom: {
                        width: 200,
                    },
                    links: [
                        {
                            title: 'Trace: ${__value.raw}',
                            url: '',
                            internal: {
                                datasourceUid: instanceSettings.uid,
                                datasourceName: instanceSettings.name,
                                query: {
                                    query: '${__value.raw}',
                                    queryType: 'traceql',
                                },
                            },
                        },
                    ],
                },
            },
            {
                name: 'startTime',
                type: FieldType.string,
                config: {
                    displayNameFromDS: 'Start time',
                    custom: {
                        width: 200,
                    },
                },
            },
            {name: 'traceName', type: FieldType.string, config: {displayNameFromDS: 'Name'}},
            {
                name: 'traceDuration',
                type: FieldType.number,
                config: {
                    displayNameFromDS: 'Duration',
                    unit: 'ms',
                    custom: {
                        width: 120,
                    },
                },
            },
        ],
        meta: {
            preferredVisualisationType: 'table',
        },
    });

    if (!data?.length) {
        return [frame];
    }

    const subDataFrames: DataFrame[] = [];
    const tableRows = data
        // Show the most recent traces
        .sort((a, b) => parseInt(b?.startTimeUnixNano!, 10) / 1000000 - parseInt(a?.startTimeUnixNano!, 10) / 1000000)
        .reduce((rows: SnapshotTableData[], trace, currentIndex) => {
            const traceData: SnapshotTableData = transformToTraceData(trace);
            rows.push(traceData);
            // subDataFrames.push(traceSubFrame(trace, instanceSettings, currentIndex));
            return rows;
        }, []);

    for (const row of tableRows) {
        frame.add(row);
    }

    return [frame, ...subDataFrames];
}

export function createTableFrameFromSearch(data: SnapshotSearchMetadata[], instanceSettings: DataSourceInstanceSettings<MyDataSourceOptions>) {
    const frame = new MutableDataFrame({
        fields: [
            {
                name: 'snapshotID',
                type: FieldType.string,
                config: {
                    unit: 'string',
                    displayNameFromDS: 'Snapshot ID',
                    links: [
                        {
                            title: 'Trace: ${__value.raw}',
                            url: '',
                            internal: {
                                datasourceUid: instanceSettings.uid,
                                datasourceName: instanceSettings.name,
                                query: {
                                    query: '${__value.raw}',
                                    queryType: 'deepql',
                                },
                            },
                        },
                    ],
                },
            },
            {name: 'traceName', type: FieldType.string, config: {displayNameFromDS: 'Snapshot Location'}},
            {name: 'startTime', type: FieldType.string, config: {displayNameFromDS: 'Start time'}},
            {name: 'duration', type: FieldType.number, config: {displayNameFromDS: 'Duration', unit: 'ns'}},
        ],
        meta: {
            preferredVisualisationType: 'table',
        },
    });
    if (!data?.length) {
        return frame;
    }
    // Show the most recent traces
    const traceData = data
        .sort((a, b) => parseInt(b?.startTimeUnixNano!, 10) / 1000000 - parseInt(a?.startTimeUnixNano!, 10) / 1000000)
        .map(transformToTraceData);

    for (const trace of traceData) {
        frame.add(trace);
    }

    return frame;
}

function transformToTraceData(data: SnapshotSearchMetadata): SnapshotTableData {
    let traceName = '';
    if (data.serviceName) {
        traceName += data.serviceName + ' ';
    }
    if (data.filePath) {
        traceName += data.filePath;
    }
    if (data.lineNo) {
        traceName += ':' + data.lineNo;
    }

    const traceStartTime = parseInt(data.startTimeUnixNano!, 10) / 1000000;

    let startTime = !isNaN(traceStartTime) ? dateTimeFormat(traceStartTime) : '';

    return {
        snapshotID: data.snapshotID,
        startTime,
        duration: data.durationNano?.toString(),
        traceName,
    };
}

export function createSingleResponse(data: Snapshot, instanceSettings: DataSourceInstanceSettings<MyDataSourceOptions>) {
    const frame = new MutableDataFrame({
        fields: [
            {
                name: 'snapshotID',
                type: FieldType.string,
                config: {
                    unit: 'string',
                    displayNameFromDS: 'Snapshot ID',
                    links: [
                        {
                            title: 'Trace: ${__value.raw}',
                            url: '',
                            internal: {
                                datasourceUid: instanceSettings.uid,
                                datasourceName: instanceSettings.name,
                                query: {
                                    query: '${__value.raw}',
                                    queryType: 'deepql',
                                },
                            },
                        },
                    ],
                },
            },
            {name: 'traceName', type: FieldType.string, config: {displayNameFromDS: 'Snapshot Location'}},
            {name: 'startTime', type: FieldType.string, config: {displayNameFromDS: 'Start time'}},
            {name: 'duration', type: FieldType.number, config: {displayNameFromDS: 'Duration', unit: 'ns'}},
        ],
        meta: {
            json: true
        },
    });

    frame.add({
        snapshotID: data.ID
    })

    return frame;
}

