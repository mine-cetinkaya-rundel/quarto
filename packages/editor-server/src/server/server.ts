/*
 * server.ts
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


import { EditorServer } from "editor-types";

import { crossrefServer, crossrefServerMethods, CrossrefServerOptions } from "./crossref";
import { dataCiteServer, dataCiteServerMethods } from "./datacite";
import { doiServer, doiServerMethods } from "./doi";
import { pandocServer, pandocServerMethods } from "./pandoc";
import { pubMedServer, pubMedServerMethods, PubMedServerOptions } from "./pubmed";
import { xrefServer, xrefServerMethods } from "./xref";
import { zoteroServer, zoteroServerMethods } from "./zotero";
import { JSONRpcServerMethod } from 'core-server';

export interface EditorServerOptions {
  resourcesDir: string;
  payloadLimitMb: number;
  pubmed: PubMedServerOptions;
  crossref: CrossrefServerOptions;
}

export function editorServer(options: EditorServerOptions) : EditorServer {
  return {
    pandoc: pandocServer(options),               // partial
    doi: doiServer(),                            // done
    crossref: crossrefServer(options.crossref),  // done
    datacite: dataCiteServer(),                  // done
    pubmed: pubMedServer(options.pubmed),        // done
    zotero: zoteroServer(),
    xref: xrefServer(),
    environment: undefined                       // done
  };
}

export function editorServerMethods(options: EditorServerOptions): Record<string,JSONRpcServerMethod> {
  return {
    ...pandocServerMethods(options),
    ...doiServerMethods(),
    ...crossrefServerMethods(options.crossref),
    ...dataCiteServerMethods(),
    ...pubMedServerMethods(options.pubmed),
    ...zoteroServerMethods(),
    ...xrefServerMethods()
  }
}
