import * as vscode from "vscode";
import { getNonce } from "./getNonce";


export class SidebarProvider implements vscode.WebviewViewProvider {
  _view?: vscode.WebviewView;
  _doc?: vscode.TextDocument;

  constructor(private readonly _extensionUri: vscode.Uri) { }

  public resolveWebviewView(webviewView: vscode.WebviewView) {
    this._view = webviewView;

    webviewView.webview.options = {
      // Allow scripts in the webview
      enableScripts: true,

      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(async (data) => {
      switch (data.type) {
        case "onInfo": {
          if (!data.value) {
            return;
          }
          vscode.window.showInformationMessage(data.value);
          break;
        }
        case "onError": {
          if (!data.value) {
            return;
          }
          vscode.window.showErrorMessage(data.value);
          break;
        }
        case "insertContent": {
          if (!data.value) {
            vscode.window.showErrorMessage("No content to insert.");
            return;
          }
          const editor = vscode.window.activeTextEditor;
          if (editor) {
            editor.edit((editBuilder) => {
              editBuilder.insert(editor.selection.active, data.value);
            });
          } else {
            vscode.window.showErrorMessage("No active editor to insert content.");
          }
          break;
        }
        case "insertFile": {
          const filePath = data.path;
          const content = data.content;

          if (!filePath || !content) {
            vscode.window.showErrorMessage("Missing file path or content.");
            return;
          }

          const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
          if (!workspaceFolder) {
            vscode.window.showErrorMessage("No workspace folder open.");
            return;
          }

          const fileUri = vscode.Uri.joinPath(workspaceFolder.uri, filePath);

          try {
            // ✅ Ensure directory exists
            const dirUri = vscode.Uri.joinPath(
              workspaceFolder.uri,
              filePath.split("/").slice(0, -1).join("/")
            );
            await vscode.workspace.fs.createDirectory(dirUri);

            // ✅ Write or overwrite file
            const enc = new TextEncoder();
            await vscode.workspace.fs.writeFile(fileUri, enc.encode(content));

            // ✅ Open the file in the editor
            const doc = await vscode.workspace.openTextDocument(fileUri);
            await vscode.window.showTextDocument(doc);

            vscode.window.showInformationMessage(`✅ File created: ${filePath}`);
          } catch (error) {
            console.error("❌ Error creating file:", error);
            vscode.window.showErrorMessage("❌ Failed to create file.");
          }

          break;
        }

      }
    });
  }

  public revive(panel: vscode.WebviewView) {
    this._view = panel;
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    const styleResetUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "reset.css")
    );
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "out", "compiled/sidebar.js")
    );
    const styleMainUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "out", "compiled/sidebar.css")
    );
    const styleVSCodeUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "vscode.css")
    );

    // Use a nonce to only allow a specific script to be run.
    const nonce = getNonce();

    return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<!--
					Use a content security policy to only allow loading images from https or from our extension directory,
					and only allow scripts that have a specific nonce.
        -->
        <meta http-equiv="Content-Security-Policy" content=" img-src https: data:; style-src 'unsafe-inline' ${webview.cspSource
      }; script-src 'nonce-${nonce}';">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<link href="${styleResetUri}" rel="stylesheet">
				<link href="${styleVSCodeUri}" rel="stylesheet">
        <link href="${styleMainUri}" rel="stylesheet">
        <script nonce=${nonce}>
          const tsvscode = acquireVsCodeApi();        
        </script>
			</head>
      <body>
				<script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`;
  }
}