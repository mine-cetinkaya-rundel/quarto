/*
 * preview-util.ts
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

import semver from "semver";

import vscode from "vscode";
import { TextDocument, Uri, workspace } from "vscode";

import {
  projectDirForDocument,
  metadataFilesForDocument,
  yamlFromMetadataFile,
} from "quarto-core";
import { isNotebook } from "../../core/doc";

import { MarkdownEngine } from "../../markdown/engine";
import { documentFrontMatter } from "../../markdown/document";


export async function isQuartoShinyDoc(
  engine: MarkdownEngine,
  doc?: TextDocument
) {
  if (doc) {
    const frontMatter = documentFrontMatter(engine, doc);
    if (frontMatter["server"] === "shiny") {
      return true;
    } else {
      if (typeof frontMatter["server"] === "object") {
        return (
          (frontMatter["server"] as Record<string, unknown>)["type"] === "shiny"
        );
      }
    }
    return false;
  } else {
    return false;
  }
}


export async function renderOnSave(engine: MarkdownEngine, document: TextDocument) {
  // if its a notebook and we don't have a save hook for notebooks then don't
  // allow renderOnSave (b/c we can't detect the saves)
  if (isNotebook(document) && !haveNotebookSaveEvents()) {
    return false;
  }

  // notebooks automatically get renderOnSave
  if (isNotebook(document)) {
    return true;
  }

  // first look for document level editor setting
  const docYaml = documentFrontMatter(engine, document);
  const docSetting = readRenderOnSave(docYaml);
  if (docSetting !== undefined) {
    return docSetting;
  }

  // now project level (take the first metadata file with a setting)
  const projectDir = projectDirForDocument(document.uri.fsPath);
  if (projectDir) {
    const metadataFiles = metadataFilesForDocument(document.uri.fsPath);
    if (metadataFiles) {
      for (const metadataFile of metadataFiles) {
        const yaml = yamlFromMetadataFile(metadataFile);
        if (yaml) {
          const projSetting = readRenderOnSave(yaml);
          if (projSetting !== undefined) {
            return projSetting;
          }
        }
      }
    }
  }

  // finally, consult vs code settings
  const render =
    workspace.getConfiguration("quarto").get<boolean>("render.renderOnSave") ||
    false;
  return render;
}

export function haveNotebookSaveEvents() {
  return (
    semver.gte(vscode.version, "1.67.0") &&
    !!(workspace as any).onDidSaveNotebookDocument
  );
}

function readRenderOnSave(yaml: Record<string, unknown>) {
  if (typeof yaml["editor"] === "object") {
    const yamlObj = yaml["editor"] as Record<string, unknown>;
    if (typeof yamlObj["render-on-save"] === "boolean") {
      return yamlObj["render-on-save"] as boolean;
    }
  }
  return undefined;
}
