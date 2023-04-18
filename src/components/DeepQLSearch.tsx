import { InlineLabel, useStyles2 } from '@grafana/ui';
import { Props } from './QueryEditor';
import { css } from '@emotion/css';
import { DeepQLEditor } from './DeepQLEditor';
import React from 'react';

export const DeepQLSearch = ({ datasource, query, onChange, onRunQuery }: Props) => {
  const styles = useStyles2(getStyles);

  return (
    <>
      <InlineLabel>
        Build complex queries using DeepQL to select a list of snapshots.{' '}
        <a rel="noreferrer" target="_blank" href="TODO/">
          Documentation
        </a>
      </InlineLabel>
      <DeepQLEditor
        placeholder="Enter a DeepQL query or snapshot ID (run with Shift+Enter)"
        query={query}
        onChange={onChange}
        datasource={datasource}
        onRunQuery={onRunQuery}
        readOnly={false}
      />
      <div className={styles.optionsContainer}></div>
    </>
  );
};

const getStyles = () => ({
  optionsContainer: css`
    margin-top: 10px;
  `,
});
