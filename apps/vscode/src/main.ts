/*
 * main.ts
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

import * as vscode from "vscode";
import * as path from "path";
import { MarkdownEngine } from "./markdown/engine";
import { kQuartoDocSelector } from "./core/doc";
import { activateLsp, deactivate as deactivateLsp } from "./lsp/client";
import { cellCommands } from "./providers/cell/commands";
import { quartoCellExecuteCodeLensProvider } from "./providers/cell/codelens";
import { activateQuartoAssistPanel } from "./providers/assist/panel";
import { activateCommon } from "./extension";
import { activatePreview } from "./providers/preview/preview";
import { activateRender } from "./providers/render";
import { initQuartoContext } from "quarto-core";
import { activateStatusBar } from "./providers/statusbar";
import { walkthroughCommands } from "./providers/walkthrough";
import { activateLuaTypes } from "./providers/lua-types";
import { activateCreate } from "./providers/create/create";
import { activateEditor } from "./providers/editor/editor";
import { activateCopyFiles } from "./providers/copyfiles";
import { activateZotero } from "./providers/zotero/zotero";;
import { extensionHost } from "./host";

export async function activate(context: vscode.ExtensionContext) {
 
  // create extension host
  const host = extensionHost();

  // create markdown engine
  const engine = new MarkdownEngine();

  // commands
  const commands = cellCommands(host, engine);

  // get quarto context (some features conditional on it)
  const config = vscode.workspace.getConfiguration("quarto");
  const quartoPath = config.get("path") as string | undefined;
  const workspaceFolder = vscode.workspace.workspaceFolders?.length
    ? vscode.workspace.workspaceFolders[0].uri.fsPath
    : undefined;
  const quartoContext = initQuartoContext(
    quartoPath,
    workspaceFolder,
    vscode.window.showWarningMessage
  );
  if (quartoContext.available) {

    // enable commands conditional on quarto installation
    vscode.commands.executeCommand(
      "setContext",
      "quartoAvailable",
      true
    );

    // ensure quarto is on the path
    context.environmentVariableCollection.prepend(
      "PATH",
      path.delimiter + quartoContext.binPath + path.delimiter
    );

    // status bar
    activateStatusBar(quartoContext);

    // lua types
    await activateLuaTypes(context, quartoContext);

    // lsp
    const lspClient = await activateLsp(context, engine);

    // provide visual editor
    const editorCommands = activateEditor(context, host, quartoContext, lspClient, engine);
    commands.push(...editorCommands);

    // zotero 
    const zoteroCommands = await activateZotero(context, lspClient);
    commands.push(...zoteroCommands);

    // assist panel
    const assistCommands = activateQuartoAssistPanel(context, engine);
    commands.push(...assistCommands);

    // walkthough
    commands.push(...walkthroughCommands(host, quartoContext));
  }

  // provide render
  const renderCommands = activateRender(quartoContext, engine);
  commands.push(...renderCommands);

  // provide preview
  const previewCommands = activatePreview(context, host, quartoContext, engine);
  commands.push(...previewCommands);

  // provide create
  const createCommands = await activateCreate(context, quartoContext);
  commands.push(...createCommands);

  // provide code lens
  vscode.languages.registerCodeLensProvider(
    kQuartoDocSelector,
    quartoCellExecuteCodeLensProvider(host, engine)
  );

  // provide file copy/drop handling
  activateCopyFiles(context);

  // activate providers common to browser/node
  activateCommon(context, host, engine, commands);
}

export async function deactivate() {
  return deactivateLsp();
} 

