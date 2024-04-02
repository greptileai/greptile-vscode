import * as vscode from 'vscode'
import { getNonce } from '../utilities/getNonce'
import { getUri } from '../utilities/getUri'
import { SessionManager } from '../sessionManager'

export class ChatViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'chatView'
  private _view?: vscode.WebviewView
  private eUri: vscode.Uri

  constructor(extensionUri: vscode.Uri) {
    this.eUri = extensionUri
  }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this.eUri, 'out'),
        vscode.Uri.joinPath(this.eUri, 'webview-ui/build'),
        vscode.Uri.joinPath(this.eUri, 'node_modules/@vscode/codicons'),
      ],
    }

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview)

    this._setWebviewMessageListener(this._view.webview)
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    // The CSS file from the React build output
    const stylesUri = getUri(webview, this.eUri, ['webview-ui', 'build', 'assets', 'index.css'])
    // The JS file from the React build output
    const scriptUri = getUri(webview, this.eUri, ['webview-ui', 'build', 'assets', 'index.js'])
    // VS Code codicons
    const codiconsUri = getUri(webview, this.eUri, [
      'node_modules',
      '@vscode/codicons',
      'dist',
      'codicon.css',
    ])

    const nonce = getNonce()

    const greptileIcon = getUri(webview, this.eUri, [
      'webview-ui',
      'build',
      'assets',
      'greptile-icon.png',
    ])

    return /*html*/ `
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <meta http-equiv="Content-Security-Policy"
                  content="default-src 'none';
                           connect-src 'self' http://localhost:3001
                                              https://api.greptile.com/v1/
                                              https://api.github.com/
                                              https://us.posthog.com/
                                              https://app.posthog.com/;
                           style-src ${webview.cspSource} 'unsafe-inline';
                           font-src ${webview.cspSource};
                           img-src ${webview.cspSource};
                           script-src 'nonce-${nonce}' https://us.posthog.com/ https://app.posthog.com/;">
            <link rel="stylesheet" type="text/css" href="${stylesUri}">
            <link rel="stylesheet" href="${codiconsUri}">
            <title>Greptile</title>
          </head>
          <body>
          <style nonce="${nonce}">
              .greptile-icon {
                background-image: url("${greptileIcon}");
                background-size: contain;
                background-repeat: no-repeat;
                background-position: center;
                height: 16px;
                width: 16px;
              }
            </style>
            <div id="root" viewType="${ChatViewProvider.viewType}"></div>
            <script type="module" nonce="${nonce}" src="${scriptUri}"></script>
          </body>
        </html>
      `
  }

  private _setWebviewMessageListener(webview: vscode.Webview) {
    webview.onDidReceiveMessage((message: any) => {
      const command = message.command
      const text = message.text

      switch (command) {
        case 'signIn':
          vscode.commands.executeCommand('greptile.signIn')
          return

        // case 'signOut':
        //   vscode.commands.executeCommand('greptile.signOut')
        //   return

        case 'resetChat':
          vscode.commands.executeCommand('greptile.resetChat')
          return

        case 'info':
          vscode.window.showInformationMessage(new vscode.MarkdownString(text).value)
          return

        case 'error':
          vscode.window.showErrorMessage(new vscode.MarkdownString(text).value)
          return

        case 'getSession':
          webview.postMessage({
            command: 'session',
            value: SessionManager.getSession(),
          })
          return

        case 'setSession':
          const session = message.session
          SessionManager.setSession(session)
          return

        case 'reload':
          vscode.commands.executeCommand('greptile.reload')
          return
      }
    })
  }
}
