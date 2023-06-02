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

import { LanguageProvider, SelectableValue } from '@grafana/data';
import { CompletionItemGroup, TypeaheadInput, TypeaheadOutput } from '@grafana/ui';

import { DeepDataSource } from './DeepDataSource';
import { Value } from 'slate';

export default class DeepLanguageProvider extends LanguageProvider {
  datasource: DeepDataSource;
  tags?: string[];
  constructor(datasource: DeepDataSource, initialValues?: any) {
    super();

    this.datasource = datasource;
    Object.assign(this, initialValues);
  }

  request = async (url: string, params = {}) => {
    const res = await this.datasource.metadataRequest(url, params);
    return res?.data;
  };

  start = async () => {
    if (!this.startTask) {
      this.startTask = this.fetchTags().then(() => {
        return [];
      });
    }

    return this.startTask;
  };

  async fetchTags() {
    const response = await this.request('/api/search/tags', []);
    this.tags = response.tagNames;
  }

  getTags = () => {
    return this.tags;
  };

  provideCompletionItems = async ({ text, value }: TypeaheadInput): Promise<TypeaheadOutput> => {
    const emptyResult: TypeaheadOutput = { suggestions: [] };

    if (!value) {
      return emptyResult;
    }

    const query = value.endText.getText();
    const isValue = query[query.indexOf(text) - 1] === '=';
    if (isValue || text === '=') {
      return this.getTagValueCompletionItems(value);
    }
    return this.getTagsCompletionItems();
  };

  getTagsCompletionItems = (): TypeaheadOutput => {
    const { tags } = this;
    const suggestions: CompletionItemGroup[] = [];

    if (tags?.length) {
      suggestions.push({
        label: `Tag`,
        items: tags.map((tag) => ({ label: tag })),
      });
    }

    return { suggestions };
  };

  async getTagValueCompletionItems(value: Value) {
    const tags = value.endText.getText().split(' ');

    let tagName = tags[tags.length - 1] ?? '';
    tagName = tagName.split('=')[0];

    const response = await this.request(`/api/v2/search/tag/${tagName}/values`, []);

    const suggestions: CompletionItemGroup[] = [];

    if (response && response.tagValues) {
      suggestions.push({
        label: `Tag Values`,
        items: response.tagValues.map((tagValue: string) => ({ label: tagValue, insertText: `"${tagValue}"` })),
      });
    }
    return { suggestions };
  }

  async getOptionsV1(tag: string): Promise<Array<SelectableValue<string>>> {
    const response = await this.request(`/api/search/tag/${tag}/values`);
    let options: Array<SelectableValue<string>> = [];
    if (response && response.tagValues) {
      options = response.tagValues.map((v: string) => ({
        value: v,
        label: v,
      }));
    }
    return options;
  }

  async getOptionsV2(tag: string): Promise<Array<SelectableValue<string>>> {
    const response = await this.request(`/api/v2/search/tag/${tag}/values`);
    let options: Array<SelectableValue<string>> = [];
    if (response && response.tagValues) {
      options = response.tagValues.map((v: { type: string; value: string }) => ({
        type: v.type,
        value: v.value,
        label: v.value,
      }));
    }
    return options;
  }
}
