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

import type { Monaco, monacoTypes } from '@grafana/ui';
import DeepLanguageProvider from './DeepLanguageProvider';

interface Props {
  languageProvider: DeepLanguageProvider;
}

export type CompletionType = 'NAME' | 'VALUE' | 'IDENTIFIER';

/**
 * Class that implements CompletionItemProvider interface and allows us to provide suggestion for the Monaco
 * autocomplete system.
 */
export class CompletionProvider implements monacoTypes.languages.CompletionItemProvider {
  languageProvider: DeepLanguageProvider;
  registerInteractionCommandId: string | null;

  constructor(props: Props) {
    this.languageProvider = props.languageProvider;
    this.registerInteractionCommandId = null;
  }

  triggerCharacters = ['{', '[', '(', '=', '~', ' ', '"'];

  // We set these directly and ae required for the provider to function.
  monaco: Monaco | undefined;
  editor: monacoTypes.editor.IStandaloneCodeEditor | undefined;

  private tags: { [tag: string]: Set<string> } = {};

  provideCompletionItems(
    model: monacoTypes.editor.ITextModel,
    position: monacoTypes.Position
  ): monacoTypes.languages.ProviderResult<monacoTypes.languages.CompletionList> {
    // Should not happen, this should not be called before it is initialized
    if (!(this.monaco && this.editor)) {
      throw new Error('provideCompletionItems called before CompletionProvider was initialized');
    }

    // if the model-id does not match, then this call is from a different editor-instance,
    // not "our instance", so return nothing
    if (this.editor.getModel()?.id !== model.id) {
      return { suggestions: [] };
    }

    // temporarily disable auto complete
    return { suggestions: [] };
  }

  /**
   * We expect the tags list data directly from the request and assign it an empty set here.
   */
  setTags(tags: string[]) {
    tags.forEach((t) => (this.tags[t] = new Set<string>()));
  }

  /**
   * Set the ID for the registerInteraction command, to be used to keep track of how many completions are used by the users
   */
  setRegisterInteractionCommandId(id: string | null) {
    this.registerInteractionCommandId = id;
  }
}
