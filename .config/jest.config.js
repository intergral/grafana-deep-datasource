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

/*
 * ⚠️⚠️⚠️ THIS FILE WAS SCAFFOLDED BY `@grafana/create-plugin`. DO NOT EDIT THIS FILE DIRECTLY. ⚠️⚠️⚠️
 *
 * In order to extend the configuration follow the steps in
 * https://grafana.github.io/plugin-tools/docs/advanced-configuration#extending-the-jest-config
 */

const path = require('path');
const { grafanaESModules, nodeModulesToTransform } = require('./jest/utils');

module.exports = {
  moduleNameMapper: {
    '\\.(css|scss|sass)$': 'identity-obj-proxy',
    'react-inlinesvg': path.resolve(__dirname, 'jest', 'mocks', 'react-inlinesvg.tsx'),
  },
  modulePaths: ['<rootDir>/src'],
  setupFilesAfterEnv: ['<rootDir>/jest-setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.{spec,test,jest}.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.{spec,test,jest}.{js,jsx,ts,tsx}',
  ],
  transform: {
    '^.+\\.(t|j)sx?$': [
      '@swc/jest',
      {
        sourceMaps: true,
        jsc: {
          parser: {
            syntax: 'typescript',
            tsx: true,
            decorators: false,
            dynamicImport: true,
          },
        },
      },
    ],
  },
  // Jest will throw `Cannot use import statement outside module` if it tries to load an
  // ES module without it being transformed first. ./config/README.md#esm-errors-with-jest
  transformIgnorePatterns: [nodeModulesToTransform(grafanaESModules)],
};
