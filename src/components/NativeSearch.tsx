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

import { css } from '@emotion/css';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { GrafanaTheme2, SelectableValue, toOption } from '@grafana/data';
import { FetchError, getTemplateSrv, isFetchError } from '@grafana/runtime';
import { Alert, fuzzyMatch, InlineField, InlineFieldRow, Input, Select, useStyles2 } from '@grafana/ui';

import { TagsField } from './TagsField/TagsField';
import { Props } from './QueryEditor';
import DeepLanguageProvider from '../deepql/DeepLanguageProvider';
import { DEFAULT_LIMIT } from '../deepql/DeepDataSource';

const NativeSearch = ({ datasource, query, onChange, onBlur, onRunQuery }: Props) => {
  const styles = useStyles2(getStyles);
  const languageProvider = useMemo(() => new DeepLanguageProvider(datasource), [datasource]);
  const [serviceOptions, setServiceOptions] = useState<Array<SelectableValue<string>>>();
  const [error, setError] = useState<Error | FetchError | null>(null);
  const [inputErrors, setInputErrors] = useState<{ [key: string]: boolean }>({});
  const [isLoading, setIsLoading] = useState<{
    serviceName: boolean;
    spanName: boolean;
  }>({
    serviceName: false,
    spanName: false,
  });

  const loadOptions = useCallback(
    async (name: string, query = '') => {
      const lpName = name === 'serviceName' ? 'service.name' : 'name';
      setIsLoading((prevValue) => ({ ...prevValue, [name]: true }));

      try {
        const options = await languageProvider.getOptionsV1(lpName);
        return options.filter((item) => (item.value ? fuzzyMatch(item.value, query).found : false));
      } catch (error) {
        if (isFetchError(error) && error?.status === 404) {
          setError(error);
        } else if (error instanceof Error) {
          //todo what to do with error?
        }
        return [];
      } finally {
        setIsLoading((prevValue) => ({ ...prevValue, [name]: false }));
      }
    },
    [languageProvider]
  );

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [services] = await Promise.all([loadOptions('serviceName')]);
        if (query.serviceName && getTemplateSrv().containsTemplate(query.serviceName)) {
          services.push(toOption(query.serviceName));
        }
        setServiceOptions(services);
      } catch (error) {
        // Display message if Deep is connected but search 404's
        if (isFetchError(error) && error?.status === 404) {
          setError(error);
        } else if (error instanceof Error) {
          //todo what to do with error?
        }
      }
    };
    fetchOptions();
  }, [languageProvider, loadOptions, query.serviceName]);

  const onKeyDown = (keyEvent: React.KeyboardEvent) => {
    if (keyEvent.key === 'Enter' && (keyEvent.shiftKey || keyEvent.ctrlKey)) {
      onRunQuery();
    }
  };

  const [tagConfig, setTagConfig] = useState<string>('');

  useEffect(() => {
    onChange({
      ...query,
      search: tagConfig,
    });
  }, [tagConfig]);

  return (
    <>
      <div className={styles.container}>
        <InlineFieldRow>
          <InlineField label="Service Name" labelWidth={14} grow>
            <Select
              inputId="service"
              options={serviceOptions}
              onOpenMenu={() => {
                loadOptions('serviceName');
              }}
              isLoading={isLoading.serviceName}
              value={serviceOptions?.find((v) => v?.value === query.serviceName) || query.serviceName}
              onChange={(v) => {
                onChange({
                  ...query,
                  serviceName: v?.value,
                });
              }}
              placeholder="Select a service"
              isClearable
              onKeyDown={onKeyDown}
              aria-label={'select-service-name'}
              allowCustomValue={true}
            />
          </InlineField>
        </InlineFieldRow>
        <InlineFieldRow>
          <InlineField label="Tags" labelWidth={14} grow tooltip="Values should be in logfmt.">
            <TagsField
              placeholder="path=/some/file.py error=true"
              value={query.search || ''}
              onChange={setTagConfig}
              onBlur={onBlur}
              datasource={datasource}
            />
          </InlineField>
        </InlineFieldRow>
        <InlineFieldRow>
          <InlineField
            label="Limit"
            invalid={inputErrors.limit}
            labelWidth={14}
            grow
            tooltip="Maximum number of returned results"
          >
            <Input
              id="limit"
              value={query.limit || ''}
              placeholder={`Default: ${DEFAULT_LIMIT}`}
              type="number"
              onChange={(v) => {
                let limit = v.currentTarget.value ? parseInt(v.currentTarget.value, 10) : undefined;
                if (limit && (!Number.isInteger(limit) || limit <= 0)) {
                  setInputErrors({ ...inputErrors, limit: true });
                } else {
                  setInputErrors({ ...inputErrors, limit: false });
                }

                onChange({
                  ...query,
                  limit: v.currentTarget.value ? parseInt(v.currentTarget.value, 10) : undefined,
                });
              }}
              onKeyDown={onKeyDown}
            />
          </InlineField>
        </InlineFieldRow>
      </div>
      {error ? (
        <Alert title="Unable to connect to Tempo search" severity="info" className={styles.alert}>
          Please ensure that Tempo is configured with search enabled. If you would like to hide this tab, you can
          configure it in the <a href={`/datasources/edit/${datasource.uid}`}>datasource settings</a>.
        </Alert>
      ) : null}
    </>
  );
};

export default NativeSearch;

const getStyles = (theme: GrafanaTheme2) => ({
  container: css`
    max-width: 500px;
  `,
  alert: css`
    max-width: 75ch;
    margin-top: ${theme.spacing(2)};
  `,
});
