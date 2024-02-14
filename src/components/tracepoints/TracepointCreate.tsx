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

import { Props } from '../QueryEditor';
import {
  Button,
  HorizontalGroup,
  InlineField,
  InlineFieldRow,
  InlineLabel,
  Input,
  Select,
  useStyles2,
} from '@grafana/ui';
import React, { useEffect, useState } from 'react';
import { firstValueFrom } from 'rxjs';
import { TagsField } from '../TagsField/TagsField';
import { DEFAULT_FIRE_COUNT } from '../../types';
import { css } from '@emotion/css';
import { AccessoryButton } from '@grafana/experimental';
import { v4 as uuidv4 } from 'uuid';
import { GrafanaTheme2 } from '@grafana/data';

const getStyles = (theme: GrafanaTheme2) => ({
  label: css`
    width: inherit;
  `,
  watchGroup: css`
    overflow-y: scroll;
    height: 150px;
  `,
  watchLine: css`
    width: 100%;
    height: 30px;
  `,
  watchInput: css`
    width: 100%;
  `,
  watchButton: css`
    position: relative;
    right: 5px;
    z-index: 999;
    float: right;
    top: -23px;
  `,
  embedRow: css`
    margin: -4px 0 0 0;
  `,
  embedValues: css`
    max-width: 200px;
  `,
  addValue: css({
    marginLeft: theme.spacing(1),
  }),
});

export const TracepointCreate = ({ datasource, query, onChange, onRunQuery, onBlur }: Props) => {
  const styles = useStyles2(getStyles);
  const [inputErrors, setInputErrors] = useState<{ [key: string]: boolean }>({
    path: !isValidPath(query.tpCreate?.path),
    line: !isValidLine(`${query.tpCreate?.line_number}`),
  });
  const [customOptions, setCustomOptions] = useState<Array<{ label: string; value: number }>>([]);

  const [targeting, setTargeting] = useState<string>();

  useEffect(() => {
    onChange({
      ...query,
      tpCreate: {
        ...query.tpCreate,
        targeting: targeting,
      },
    });
  }, [targeting]); // eslint-disable-line react-hooks/exhaustive-deps

  function anyError() {
    return Object.values(inputErrors).some((v) => v);
  }

  let spanOptions = [
    { label: 'None', value: 'None' },
    { label: 'Line', value: 'Line' },
    {
      label: 'Method/Function',
      value: 'Method',
    },
  ];

  const fireCountValues = [
    { label: 'Forever', value: -1 },
    { label: 'Once', value: 1 },
    { label: '5', value: 5 },
    { label: '10', value: 10 },
  ];

  function spanFromOptions(spanOptions: { label: string; value: string }[], value: string) {
    return spanOptions.filter((value1) => {
      return value1.value == value;
    })[0];
  }

  const randomId = () => uuidv4().slice(0, 12);
  const addMetric = () => {
    const metric = {
      id: randomId(),
    };
    onChange({
      ...query,
      tpCreate: {
        ...query.tpCreate,
        metrics: [...query.tpCreate.metrics, metric],
      },
    });
  };

  const removeMetric = (id: string) => {
    let metrics = query.tpCreate.metrics.filter((tag) => {
      return tag.id !== id;
    });
    if (metrics.length === 0) {
      metrics = [
        {
          id: randomId(),
        },
      ];
    }
    onChange({
      ...query,
      tpCreate: {
        ...query.tpCreate,
        metrics: [...metrics],
      },
    });
  };

  function optionFromConfig(number: number) {
    if (number === -1) {
      return { label: 'Forever', value: -1 };
    }
    return { label: `${number}`, value: number };
  }

  return (
    <div>
      <InlineLabel className={styles.label}>
        Enter a tracepoint details to create a new tracepoint
        <a
          rel="noreferrer"
          target="_blank"
          href="https://intergral.github.io/grafana-deep-datasource/explore/create_tracepoint/"
        >
          Documentation
        </a>
      </InlineLabel>
      <InlineFieldRow>
        <InlineField
          label="File Path"
          invalid={inputErrors.path}
          labelWidth={20}
          grow
          tooltip="The relative path to the source file"
        >
          <Input
            id="path"
            value={query.tpCreate?.path ?? ''}
            placeholder={`/src/python/simple_test.py`}
            onChange={(v) => {
              let value = v.currentTarget.value;
              if (value && isValidPath(value)) {
                setInputErrors({ ...inputErrors, path: false });
              } else {
                setInputErrors({ ...inputErrors, path: true });
              }

              onChange({
                ...query,
                tpCreate: {
                  ...query.tpCreate,
                  path: value,
                },
              });
            }}
          />
        </InlineField>
      </InlineFieldRow>
      <InlineFieldRow>
        <InlineField
          label="Line Number"
          invalid={inputErrors.line}
          labelWidth={20}
          grow
          tooltip="The relative path to the source file"
        >
          <Input
            id="linenumber"
            value={query.tpCreate?.line_number ?? ''}
            type={'number'}
            placeholder={`31`}
            onChange={(v) => {
              let value = v.currentTarget.value;
              if (value && isValidLine(value)) {
                setInputErrors({ ...inputErrors, line: false });
              } else {
                setInputErrors({ ...inputErrors, line: true });
              }

              onChange({
                ...query,
                tpCreate: {
                  ...query.tpCreate,
                  line_number: parseInt(value, 10),
                },
              });
            }}
          />
        </InlineField>
        <InlineField
          label="Fire Count"
          invalid={inputErrors.firecount}
          labelWidth={20}
          grow
          tooltip="Select or enter number of times to fire."
        >
          <Select
            id="firecout"
            value={optionFromConfig(query.tpCreate?.fire_count ?? DEFAULT_FIRE_COUNT)}
            options={[...fireCountValues, ...customOptions]}
            allowCustomValue={true}
            onCreateOption={(v) => {
              if (isValidFireCount(v)) {
                setInputErrors({ ...inputErrors, firecount: false });
                setCustomOptions([...customOptions, { label: v, value: parseInt(v) }]);
                onChange({
                  ...query,
                  tpCreate: {
                    ...query.tpCreate,
                    fire_count: parseInt(v),
                  },
                });
              } else {
                setInputErrors({ ...inputErrors, firecount: true });
              }
            }}
            onChange={(v) => {
              onChange({
                ...query,
                tpCreate: {
                  ...query.tpCreate,
                  fire_count: v.value ?? DEFAULT_FIRE_COUNT,
                },
              });
            }}
          />
        </InlineField>
      </InlineFieldRow>
      <InlineFieldRow>
        <InlineField label="Targetting" labelWidth={20} grow tooltip="Values should be in logfmt.">
          <TagsField
            placeholder="path=/some/file.py error=true"
            value={query.tpCreate?.targeting ?? ''}
            onChange={setTargeting}
            onBlur={onBlur}
            datasource={datasource}
          />
        </InlineField>
      </InlineFieldRow>
      <InlineFieldRow>
        <InlineField label="Log Message" labelWidth={20} grow tooltip="Log Message to inject at Tracepoint.">
          <Input
            id={'logmsg'}
            placeholder={'Use {} to evaluate expressions.'}
            value={query.tpCreate?.log_msg ?? ''}
            type={'text'}
            onChange={(v) => {
              onChange({
                ...query,
                tpCreate: {
                  ...query.tpCreate,
                  log_msg: v.currentTarget.value,
                },
              });
            }}
          />
        </InlineField>
      </InlineFieldRow>
      <InlineFieldRow>
        <InlineField label="Trace" labelWidth={20} grow tooltip="Create Span at the tracepoint.">
          <Select
            options={spanOptions}
            value={spanFromOptions(spanOptions, query.tpCreate?.trace ?? 'None')}
            onChange={(v) => {
              onChange({
                ...query,
                tpCreate: {
                  ...query.tpCreate,
                  trace: v.value,
                },
              });
            }}
          />
        </InlineField>
      </InlineFieldRow>
      <InlineFieldRow className={styles.embedRow}>
        <InlineField label="Metrics" labelWidth={20} tooltip="Create metrics at tracepoint location.">
          <div>
            {(
              query.tpCreate?.metrics ?? [
                {
                  id: randomId(),
                },
              ]
            ).map((tag, i) => (
              <div key={i}>
                <HorizontalGroup spacing={'xs'} width={'auto'}>
                  <Input
                    id={'metric'}
                    placeholder={'uuid_length'}
                    value={tag.name}
                    type={'text'}
                    onChange={(v) => {
                      onChange({
                        ...query,
                        tpCreate: {
                          ...query.tpCreate,
                          metrics: (query.tpCreate?.metrics ?? [tag]).map((metric) => {
                            if (metric.id == tag.id) {
                              metric.name = v.currentTarget.value;
                            }
                            return metric;
                          }),
                        },
                      });
                    }}
                  />
                  <span className={styles.embedValues}>
                    <Input
                      id={'tag'}
                      placeholder={'len(uuid)'}
                      value={tag.expression}
                      type={'text'}
                      onChange={(v) => {
                        onChange({
                          ...query,
                          tpCreate: {
                            ...query.tpCreate,
                            metrics: (query.tpCreate?.metrics ?? [tag]).map((metric) => {
                              if (metric.id == tag.id) {
                                metric.expression = v.currentTarget.value;
                              }
                              return metric;
                            }),
                          },
                        });
                      }}
                    />
                  </span>
                  {(tag.name || tag.expression || (query.tpCreate?.metrics ?? [tag]).length > 1) && (
                    <AccessoryButton
                      aria-label="Remove metric"
                      variant="secondary"
                      icon="times"
                      onClick={() => removeMetric(tag.id)}
                      tooltip="Remove metric"
                    />
                  )}
                  {(tag.name || tag.expression) && i === (query.tpCreate?.metrics ?? [tag]).length - 1 && (
                    <span className={styles.addValue}>
                      <AccessoryButton
                        aria-label="Add metric"
                        variant="secondary"
                        icon="plus"
                        onClick={addMetric}
                        tooltip="Add metric"
                      />
                    </span>
                  )}
                </HorizontalGroup>
              </div>
            ))}
          </div>
        </InlineField>
      </InlineFieldRow>
      <InlineFieldRow className={styles.embedRow}>
        <InlineField label="Watches" labelWidth={20} tooltip="Create metrics at tracepoint location.">
          <div>
            {(
              query.tpCreate?.watches ?? [
                {
                  id: randomId(),
                },
              ]
            ).map((watch, i) => (
              <div key={i}>
                <HorizontalGroup spacing={'xs'} width={'auto'}>
                  <Input
                    id={'metric'}
                    placeholder={'uuid_length'}
                    value={watch.expression}
                    type={'text'}
                    onChange={(v) => {
                      onChange({
                        ...query,
                        tpCreate: {
                          ...query.tpCreate,
                          watches: (query.tpCreate?.watches ?? [watch]).map((value) => {
                            if (value.id === watch.id) {
                              value.expression = v.currentTarget.value;
                            }
                            return value;
                          }),
                        },
                      });
                    }}
                  />

                  {(watch || (query.tpCreate?.watches ?? [watch]).length > 1) && (
                    <AccessoryButton
                      aria-label="Remove watch"
                      variant="secondary"
                      icon="times"
                      onClick={() => {
                        onChange({
                          ...query,
                          tpCreate: {
                            ...query.tpCreate,
                            watches: (query.tpCreate?.watches ?? [watch]).filter((value) => value.id !== watch.id),
                          },
                        });
                      }}
                      tooltip="Remove watch"
                    />
                  )}
                  {watch && i === (query.tpCreate?.watches ?? [watch]).length - 1 && (
                    <span className={styles.addValue}>
                      <AccessoryButton
                        aria-label="Add watch"
                        variant="secondary"
                        icon="plus"
                        onClick={() => {
                          onChange({
                            ...query,
                            tpCreate: {
                              ...query.tpCreate,
                              watches: [
                                ...query.tpCreate.watches,
                                {
                                  id: randomId(),
                                },
                              ],
                            },
                          });
                        }}
                        tooltip="Add watch"
                      />
                    </span>
                  )}
                </HorizontalGroup>
              </div>
            ))}
          </div>
        </InlineField>
      </InlineFieldRow>
      <InlineFieldRow>
        <Button
          disabled={anyError()}
          onClick={async () => {
            await firstValueFrom(datasource.handleCreateTracepoint(query));
            onRunQuery();
          }}
        >
          Create Tracepoint
        </Button>
      </InlineFieldRow>
    </div>
  );
};

const isValidPath = (val: string): boolean => {
  return !(!val || val === '');
};

const isValidLine = (val: string): boolean => {
  const number = parseInt(val, 10);
  return number >= 0;
};

const isValidFireCount = (val: string): boolean => {
  const number = parseInt(val, 10);
  return number >= -1 && number !== 0;
};
