import * as vscode from "vscode";
import { getNonce } from "./getNonce";
import * as cp from "child_process";


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
    let shouldEndProgress = false;

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
        } case "installPythonLibs": {
          const libs: string[] = data.libs;

          if (!libs || libs.length === 0) {
            vscode.window.showErrorMessage("❌ No libraries provided for installation.");
            return;
          }

          const notInstalled: string[] = [];
          const installed: string[] = [];

          for (const lib of libs) {
            try {
              // Run Python check (you can use `py` instead of `python` on Windows if needed)
              cp.execSync(`python -c "import ${lib}"`, { stdio: "ignore" });
              installed.push(lib);
              console.log(`✅ Already installed: ${lib}`);
            } catch {
              notInstalled.push(lib);
              console.log(`🔍 Not installed: ${lib}`);
            }
          }

          // ✅ Log the summary to output
          console.log(`📋 Checked Python dependencies:\n  ✅ Installed: ${installed.join(", ") || "None"}\n  ❌ Missing: ${notInstalled.join(", ") || "None"}`);

          if (notInstalled.length === 0) {
            vscode.window.showInformationMessage("✅ All required Python libraries are already installed.");
            return;
          }

          const confirm = await vscode.window.showWarningMessage(
            `📦 The following Python libraries are missing: ${notInstalled.join(", ")}.\nDo you want to install them now?`,
            "Yes",
            "No"
          );

          if (confirm !== "Yes") {
            vscode.window.showInformationMessage("⏭️ Skipped library installation.");
            return;
          }

          // 🔄 Install with progress
          await vscode.window.withProgress(
            {
              location: vscode.ProgressLocation.Notification,
              title: "📥 Installing missing Python libraries...",
              cancellable: false,
            },
            async (progress) => {
              const total = notInstalled.length;

              for (let i = 0; i < total; i++) {
                const lib = notInstalled[i];
                progress.report({
                  message: `Installing ${lib} (${i + 1}/${total})`,
                  increment: 100 / total,
                });

                try {
                  cp.execSync(`pip install ${lib}`, { stdio: "ignore" });
                  console.log(`✅ Installed ${lib}`);
                } catch (err) {
                  console.error(`❌ Failed to install ${lib}:`, err);
                  vscode.window.showErrorMessage(`❌ Failed to install ${lib}`);
                }

                await new Promise((resolve) => setTimeout(resolve, 300)); // smooth progress
              }
            }
          );

          vscode.window.showInformationMessage("✅ Finished installing all missing Python libraries.");
          break;
        }

        case "startProgress": {

          vscode.window.withProgress(
            {
              location: vscode.ProgressLocation.Notification,
              title: data.title || "Processing...",
              cancellable: false,
            },
            async (progress) => {
              let percent = 0;

              const interval = setInterval(() => {
                if (percent < 90) {
                  percent += 10;
                  progress.report({
                    increment: 10,
                    message: `${percent}%`,
                  });
                }
              }, 200);

              // Wait for flag to become true
              while (!shouldEndProgress) {
                await new Promise((r) => setTimeout(r, 100));
              }

              clearInterval(interval);
              progress.report({ increment: 10, message: `✅ Done` });
              await new Promise((r) => setTimeout(r, 500));
            }
          );

          break;
        }

        case "endProgress": {
          shouldEndProgress = true;
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