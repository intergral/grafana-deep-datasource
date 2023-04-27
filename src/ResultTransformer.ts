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

import { DeepDatasourceOptions, SnapshotSearchMetadata, SnapshotTableData } from './types';
import {
  DataFrame,
  DataQueryResponse,
  DataSourceInstanceSettings,
  dateTimeFormat,
  FieldType,
  MutableDataFrame,
} from '@grafana/data';

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
      { name: 'traceName', type: FieldType.string, config: { displayNameFromDS: 'Name' } },
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

export function createTableFrameFromSearch(
  data: SnapshotSearchMetadata[],
  instanceSettings: DataSourceInstanceSettings<DeepDatasourceOptions>
) {
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
              title: 'Snapshot: ${__value.raw}',
              url: '',
              internal: {
                datasourceUid: instanceSettings.uid,
                datasourceName: instanceSettings.name,
                query: {
                  query: '${__value.raw}',
                  queryType: 'byid',
                },
              },
            },
          ],
        },
      },
      { name: 'location', type: FieldType.string, config: { displayNameFromDS: 'Snapshot Location' } },
      { name: 'startTime', type: FieldType.string, config: { displayNameFromDS: 'Start time' } },
      { name: 'duration', type: FieldType.number, config: { displayNameFromDS: 'Duration', unit: 'ns' } },
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
  let location = '';
  if (data.serviceName) {
    location += data.serviceName + ' ';
  }
  if (data.filePath) {
    location += data.filePath;
  }
  if (data.lineNo) {
    location += ':' + data.lineNo;
  }

  const traceStartTime = parseInt(data.startTimeUnixNano!, 10) / 1000000;

  let startTime = !isNaN(traceStartTime) ? dateTimeFormat(traceStartTime) : '';

  return {
    snapshotID: data.snapshotID,
    startTime,
    duration: data.durationNano?.toString(),
    location,
  };
}

export function transformSnapshot(response: DataQueryResponse): DataQueryResponse {
  return response;
}
