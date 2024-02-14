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
  IconButton,
  InlineField,
  InlineFieldRow,
  InlineLabel,
  Input,
  useStyles2,
  VerticalGroup,
} from '@grafana/ui';
import React, { useEffect, useState } from 'react';
import { firstValueFrom } from 'rxjs';
import { TagsField } from '../TagsField/TagsField';
import { DEFAULT_FIRE_COUNT } from '../../types';
import { css, cx } from '@emotion/css';

const getStyles = () => ({
  container: css`
    display: flex;
    flex-direction: row;
  `,
  containerColumn1: css`
    display: flex;
    flex-direction: column;
    flex-basis: 79%;
    margin-right: 5px;
  `,
  containerColumn2: css`
    display: flex;
    flex-direction: column;
    flex-basis: 19%;
  `,
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
});

export const TracepointCreate = ({ datasource, query, onChange, onRunQuery, onBlur }: Props) => {
  const styles = useStyles2(getStyles);
  const [inputErrors, setInputErrors] = useState<{ [key: string]: boolean }>({
    path: !isValidPath(query.tpCreate?.path),
    line: !isValidLine(`${query.tpCreate?.line_number}`),
  });
  const [newWatch, setNewWatch] = useState('');

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

  return (
    <div>
      <div className={styles.container}>
        <div className={styles.containerColumn1}>
          <InlineLabel className={styles.label}>
            Enter a tracepoint details to create a new tracepoint
            <a rel="noreferrer" target="_blank" href="TODO/">
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
              tooltip="Use -1 to always fire."
            >
              <Input
                id="firecount"
                value={query.tpCreate?.fire_count ?? DEFAULT_FIRE_COUNT}
                type={'number'}
                placeholder={`${DEFAULT_FIRE_COUNT}`}
                onChange={(v) => {
                  let value = v.currentTarget.value;
                  if (value && isValidFireCount(value)) {
                    setInputErrors({ ...inputErrors, firecount: false });
                  } else {
                    setInputErrors({ ...inputErrors, firecount: true });
                  }

                  onChange({
                    ...query,
                    tpCreate: {
                      ...query.tpCreate,
                      fire_count: parseInt(value, 10),
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
        </div>
        <div className={styles.containerColumn2}>
          <InlineLabel>
            Watchers
            <a rel="noreferrer" target="_blank" href="TODO/">
              Documentation
            </a>
          </InlineLabel>
          <div className={styles.watchGroup}>
            <VerticalGroup>
              {(query.tpCreate?.watches ?? []).map((watch, index) => {
                return (
                  <div className={styles.watchLine} key={index}>
                    <Input
                      className={styles.watchInput}
                      value={watch}
                      type={'text'}
                      onChange={(event) => {
                        query.tpCreate = {
                          ...query.tpCreate,
                        };
                        query.tpCreate.watches = query.tpCreate?.watches ?? [];
                        query.tpCreate.watches[index] = event.currentTarget.value;
                        onChange({
                          ...query,
                        });
                      }}
                    />
                    <span className={styles.watchButton}>
                      <IconButton
                        name={'trash-alt'}
                        aria-label={'delete'}
                        onClick={() => {
                          query.tpCreate.watches.splice(index, 1);
                          onChange({
                            ...query,
                          });
                        }}
                      />
                    </span>
                  </div>
                );
              })}
            </VerticalGroup>
          </div>
          <div className={styles.watchLine}>
            <Input
              className={styles.watchInput}
              placeholder={'Create new watcher'}
              type={'text'}
              value={newWatch}
              onChange={(event) => {
                setNewWatch(event.currentTarget.value);
              }}
            />
            <span className={styles.watchButton}>
              <IconButton
                name={'plus'}
                aria-label={'Create'}
                onClick={() => {
                  query.tpCreate = {
                    ...query.tpCreate,
                  };
                  query.tpCreate.watches = query.tpCreate?.watches ?? [];
                  query.tpCreate.watches.push(newWatch);
                  onChange({
                    ...query,
                  });
                }}
              />
            </span>
          </div>
        </div>
      </div>
      <div
        className={cx(
          css`
            margin-top: 15px;
          `
        )}
      >
        <HorizontalGroup justify={'flex-end'}>
          <Button
            disabled={anyError()}
            onClick={async () => {
              await firstValueFrom(datasource.handleCreateTracepoint(query));
              onRunQuery();
            }}
          >
            Create Tracepoint
          </Button>
        </HorizontalGroup>
      </div>
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
