/*
 *    Copyright 2014-2021 Grafana Labs
 *
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

import { css } from '@emotion/css';
import React, { useEffect, useRef } from 'react';

import { GrafanaTheme2 } from '@grafana/data';
import { CodeEditor, Monaco, monacoTypes, useTheme2 } from '@grafana/ui';

import { CompletionProvider } from './autocomplete';
import { languageDefinition } from './syntax';
import { DeepDataSource } from '../../DeepDataSource';

interface Props {
  placeholder: string;
  value: string;
  onChange: (val: string) => void;
  onBlur?: () => void;
  datasource: DeepDataSource;
}

export function TagsField(props: Props) {
  const { onChange, onBlur, placeholder } = props;
  const setupAutocompleteFn = useAutocomplete(props.datasource);
  const theme = useTheme2();
  const styles = getStyles(theme, placeholder);

  return (
    <CodeEditor
      value={props.value}
      language={langId}
      onBlur={onBlur}
      onChange={onChange}
      containerStyles={styles.queryField}
      monacoOptions={{
        folding: false,
        fontSize: 14,
        lineNumbers: 'off',
        overviewRulerLanes: 0,
        renderLineHighlight: 'none',
        scrollbar: {
          vertical: 'hidden',
          verticalScrollbarSize: 8, // used as "padding-right"
          horizontal: 'hidden',
          horizontalScrollbarSize: 0,
        },
        scrollBeyondLastLine: false,
        wordWrap: 'on',
      }}
      onBeforeEditorMount={ensureDeepQL}
      onEditorDidMount={(editor, monaco) => {
        setupAutocompleteFn(editor, monaco);
        setupPlaceholder(editor, monaco, styles);
        setupAutoSize(editor);
      }}
    />
  );
}

function setupPlaceholder(editor: monacoTypes.editor.IStandaloneCodeEditor, monaco: Monaco, styles: EditorStyles) {
  const placeholderDecorators = [
    {
      range: new monaco.Range(1, 1, 1, 1),
      options: {
        className: styles.placeholder, // The placeholder text is in styles.placeholder
        isWholeLine: true,
      },
    },
  ];

  let decorators: string[] = [];

  const checkDecorators = (): void => {
    const model = editor.getModel();

    if (!model) {
      return;
    }

    const newDecorators = model.getValueLength() === 0 ? placeholderDecorators : [];
    decorators = model.deltaDecorations(decorators, newDecorators);
  };

  checkDecorators();
  editor.onDidChangeModelContent(checkDecorators);
}

function setupAutoSize(editor: monacoTypes.editor.IStandaloneCodeEditor) {
  const container = editor.getDomNode();
  const updateHeight = () => {
    if (container) {
      const contentHeight = Math.min(1000, editor.getContentHeight());
      const width = parseInt(container.style.width, 10);
      container.style.width = `${width}px`;
      container.style.height = `${contentHeight}px`;
      editor.layout({ width, height: contentHeight });
    }
  };
  editor.onDidContentSizeChange(updateHeight);
  updateHeight();
}

/**
 * Hook that returns function that will set up monaco autocomplete for the label selector
 * @param datasource
 */
function useAutocomplete(datasource: DeepDataSource) {
  // We need the provider ref so we can pass it the label/values data later. This is because we run the call for the
  // values here but there is additional setup needed for the provider later on. We could run the getSeries() in the
  // returned function but that is run after the monaco is mounted so would delay the request a bit when it does not
  // need to.
  const providerRef = useRef<CompletionProvider>(
    new CompletionProvider({ languageProvider: datasource.languageProvider })
  );

  useEffect(() => {
    const fetchTags = async () => {
      try {
        await datasource.languageProvider.start();
        const tags = datasource.languageProvider.getTags();

        if (tags) {
          providerRef.current.setTags(tags);
        }
      } catch (error) {
        //todo what to do with error?
      }
    };
    fetchTags();
  }, [datasource]);

  const autocompleteDisposeFun = useRef<(() => void) | null>(null);
  useEffect(() => {
    // when we unmount, we unregister the autocomplete-function, if it was registered
    return () => {
      autocompleteDisposeFun.current?.();
    };
  }, []);

  // This should be run in monaco onEditorDidMount
  return (editor: monacoTypes.editor.IStandaloneCodeEditor, monaco: Monaco) => {
    providerRef.current.editor = editor;
    providerRef.current.monaco = monaco;

    const { dispose } = monaco.languages.registerCompletionItemProvider(langId, providerRef.current);
    autocompleteDisposeFun.current = dispose;
  };
}

// we must only run the setup code once
let setupDone = false;
const langId = 'tagsfield';

function ensureDeepQL(monaco: Monaco) {
  if (!setupDone) {
    setupDone = true;
    const { aliases, extensions, mimetypes, def } = languageDefinition;
    monaco.languages.register({ id: langId, aliases, extensions, mimetypes });
    monaco.languages.setMonarchTokensProvider(langId, def.language);
    monaco.languages.setLanguageConfiguration(langId, def.languageConfiguration);
  }
}

interface EditorStyles {
  placeholder: string;
  queryField: string;
}

const getStyles = (theme: GrafanaTheme2, placeholder: string): EditorStyles => {
  return {
    queryField: css`
      height: 32px;
      border-radius: ${theme.shape.radius.default};
      border: 1px solid ${theme.components.input.borderColor};
      flex: 1;
    `,
    placeholder: css`
      ::after {
        content: '${placeholder}';
        font-family: ${theme.typography.fontFamilyMonospace};
        opacity: 0.3;
      }
    `,
  };
};
