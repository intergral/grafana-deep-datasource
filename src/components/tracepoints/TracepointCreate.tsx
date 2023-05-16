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

import { Props } from '../QueryEditor';
import { Button, HorizontalGroup, InlineField, InlineFieldRow, InlineLabel, Input, TextArea } from '@grafana/ui';
import React, { useEffect, useState } from 'react';
import { firstValueFrom } from 'rxjs';
import { TagsField } from '../TagsField/TagsField';
import { DEFAULT_FIRE_COUNT } from '../../types';

export const TracepointCreate = ({ datasource, query, onChange, onRunQuery, onBlur }: Props) => {
  const [inputErrors, setInputErrors] = useState<{ [key: string]: boolean }>({
    path: !isValidPath(query.tpCreate?.path),
    line: !isValidLine(`${query.tpCreate?.line_number}`),
  });

  const [targeting, setTargeting] = useState<string>();

  useEffect(() => {
    onChange({
      ...query,
      tpCreate: {
        ...query.tpCreate,
        targeting: targeting,
      },
    });
  }, [targeting]);

  function anyError() {
    return Object.values(inputErrors).some((v) => v);
  }

  return (
    <>
      <InlineLabel>
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
        <InlineField
          grow
          label={'Watches'}
          labelWidth={20}
          invalid={inputErrors.watches}
          tooltip="Statements to be executed at the code location, one statement perline."
        >
          <TextArea
            value={query.tpCreate?.watches ?? ''}
            id="watches"
            placeholder={'Enter each watch statement on a new line'}
            onChange={(v) => {
              const value = v.currentTarget.value;
              if (isValidWatch(value)) {
                setInputErrors({ ...inputErrors, watches: false });
              } else {
                setInputErrors({ ...inputErrors, watches: true });
              }
              const watches = value.split('\n');

              onChange({
                ...query,
                tpCreate: {
                  ...query.tpCreate,
                  watches,
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
    </>
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
const isValidWatch = (val: string): boolean => {
  return true;
};
