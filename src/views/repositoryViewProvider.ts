import * as vscode from 'vscode';
import { getNonce } from '../utilities/getNonce';
import { getUri } from '../utilities/getUri';
import { SessionManager } from "../sessionManager";

export class RepositoryViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'repositoryView';
    private _view?: vscode.WebviewView;
    private eUri: vscode.Uri;

    constructor(extensionUri: vscode.Uri) {
        this.eUri = extensionUri;
    }

    public resolveWebviewView(
      webviewView: vscode.WebviewView,
      context: vscode.WebviewViewResolveContext,
      _token: vscode.CancellationToken,
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.joinPath(this.eUri, "out"),
                vscode.Uri.joinPath(this.eUri, "webview-ui/build"),
            ],
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        this._setWebviewMessageListener(this._view.webview);
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        // The CSS file from the React build output
        const stylesUri = getUri(webview, this.eUri, ["webview-ui", "build", "assets", "index.css"]);
        // The JS file from the React build output
        const scriptUri = getUri(webview, this.eUri, ["webview-ui", "build", "assets", "index.js"]);
    
        // const codiconsUri = getUri(webview, extensionUri, ['node_modules', '@vscode/codicons', 'dist', 'codicon.css']);
    
        const nonce = getNonce();
    
        return /*html*/ `
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <meta http-equiv="Content-Security-Policy"
                  content="default-src 'none';
                           connect-src 'self' http://localhost:3001 https://mcxeqf7hzekaahjdqpojzf4hya0aflwj.lambda-url.us-east-1.on.aws/ https://dprnu1tro5.execute-api.us-east-1.amazonaws.com/prod/v1/ https://api.github.com/ https://us.posthog.com/ https://app.posthog.com/ https://api-js.mixpanel.com/;
                           style-src ${webview.cspSource} 'unsafe-inline';
                           script-src 'nonce-${nonce}' https://us.posthog.com/ https://app.posthog.com/;">
            <link rel="stylesheet" type="text/css" href="${stylesUri}">
            <title>Onboard AI Chat</title>
          </head>
          <body>
            <div id="root"></div>
            <script type="module" nonce="${nonce}" src="${scriptUri}"></script>
          </body>
        </html>
      `;
      }

    private _setWebviewMessageListener(webview: vscode.Webview) {
        webview.onDidReceiveMessage(
          (message: any) => {
            const command = message.command;
            const text = message.text;
    
            switch (command) {
              case "hello":
                // Code that should run in response to the hello message command
                vscode.window.showInformationMessage(text);
                return;
              // Add more switch case statements here as more webview message commands
              // are created within the webview context (i.e. inside media/main.js)
              case "login":
                vscode.commands.executeCommand('onboard.login');
                // commands.executeCommand("workbench.action.webview.reloadWebviewAction"); // reloads all webviews
                return;
    
              case "chat":
                vscode.window.showInformationMessage(text);
                return;
    
              case "upgrade":
                vscode.window.showInformationMessage(text);
                return;
    
              case "error":
                vscode.window.showErrorMessage(text);
                return;
    
              case "getSession":
                webview.postMessage({
                  command: "session",
                  value: SessionManager.getSession()
                });
                return;
    
              case "setSession":
                const session = message.session;
                SessionManager.setSession(session);
                return;
            }
          });
      }
}