/*
 * services.ts
 *
 * Copyright (C) 2022 by Posit Software, PBC
 *
 * Unless you have received this program directly from Posit Software pursuant
 * to the terms of a commercial license agreement with Posit Software, then
 * this program is licensed to you under the terms of version 3 of the
 * GNU Affero General Public License. This program is distributed WITHOUT
 * ANY EXPRESS OR IMPLIED WARRANTY, INCLUDING THOSE OF NON-INFRINGEMENT,
 * MERCHANTABILITY OR FITNESS FOR A PARTICULAR PURPOSE. Please refer to the
 * AGPL (http://www.gnu.org/licenses/agpl-3.0.txt) for more details.
 *
 */


import { EditorServices } from "editor-types";

import { mathServer, mathServerMethods } from "./math/math";
import { dictionaryServer, dictionaryServerMethods, DictionaryServerOptions } from './dictionary';
import { JSONRpcServerMethod } from 'core-server';

export interface EditorServicesOptions {
  dictionary: DictionaryServerOptions;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function editorServices(options: EditorServicesOptions) : EditorServices {
  return {
    math: mathServer(),
    dictionary: dictionaryServer(options.dictionary)
  };
} 

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function editorServicesMethods(options: EditorServicesOptions): Record<string,JSONRpcServerMethod> {
  return {
    ...mathServerMethods(),
    ...dictionaryServerMethods(options.dictionary)
  }
}
