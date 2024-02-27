import { Disposable, Webview, WebviewPanel, window, Uri, ViewColumn, commands } from 'vscode'
import { getUri } from '../utilities/getUri'
import { getNonce } from '../utilities/getNonce'
import { SessionManager } from '../sessionManager'

/**
 * This class manages the state and behavior of Chat webview panels.
 *
 * It contains all the data and methods for:
 *
 * - Creating and rendering Chat webview panels
 * - Properly cleaning up and disposing of webview resources when the panel is closed
 * - Setting the HTML (and by proxy CSS/JavaScript) content of the webview panel
 * - Setting message listeners so data can be passed between the webview and extension
 */
export class ChatPanel {
  public static currentPanel: ChatPanel | undefined
  private readonly _panel: WebviewPanel
  private _disposables: Disposable[] = []
  private eUri: Uri

  /**
   * The ChatPanel class private constructor (called only from the render method).
   *
   * @param panel A reference to the webview panel
   * @param extensionUri The URI of the directory containing the extension
   */
  private constructor(panel: WebviewPanel, extensionUri: Uri) {
    this._panel = panel

    // Set an event listener to listen for when the panel is disposed (i.e. when the user closes
    // the panel or when the panel is closed programmatically)
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables)

    // Set the HTML content for the webview panel
    this._panel.webview.html = this._getWebviewContent(this._panel.webview, extensionUri)

    // Set an event listener to listen for messages passed from the webview context
    this._setWebviewMessageListener(this._panel.webview)

    this.eUri = extensionUri
  }

  /**
   * Renders the current webview panel if it exists otherwise a new webview panel
   * will be created and displayed.
   *
   * @param extensionUri The URI of the directory containing the extension.
   */
  public static render(extensionUri: Uri) {
    if (ChatPanel.currentPanel) {
      // If the webview panel already exists reveal it
      ChatPanel.currentPanel._panel.reveal(ViewColumn.One)
    } else {
      // If a webview panel does not already exist create and show a new one
      const panel = window.createWebviewPanel(
        // Panel view type
        'showChat',
        // Panel title
        'Onboard AI Chat',
        // The editor column the panel should be displayed in
        ViewColumn.Beside,
        // Extra panel configurations
        {
          // Enable JavaScript in the webview
          enableScripts: true,
          // Restrict the webview to only load resources from the `out` and `webview-ui/build` directories
          localResourceRoots: [
            Uri.joinPath(extensionUri, 'out'),
            Uri.joinPath(extensionUri, 'webview-ui/build'),
          ],
        }
      )

      ChatPanel.currentPanel = new ChatPanel(panel, extensionUri)
    }
  }

  /**
   * Cleans up and disposes of webview resources when the webview panel is closed.
   */
  public dispose() {
    ChatPanel.currentPanel = undefined

    // Dispose of the current webview panel
    this._panel.dispose()

    // Dispose of all disposables (i.e. commands) for the current webview panel
    while (this._disposables.length) {
      const disposable = this._disposables.pop()
      if (disposable) {
        disposable.dispose()
      }
    }
  }

  /**
   * Defines and returns the HTML that should be rendered within the webview panel.
   *
   * @remarks This is also the place where references to the React webview build files
   * are created and inserted into the webview HTML.
   *
   * @param webview A reference to the extension webview
   * @param extensionUri The URI of the directory containing the extension
   * @returns A template string literal containing the HTML that should be
   * rendered within the webview panel
   */
  private _getWebviewContent(webview: Webview, extensionUri: Uri) {
    // The CSS file from the React build output
    const stylesUri = getUri(webview, extensionUri, ['webview-ui', 'build', 'assets', 'index.css'])
    // The JS file from the React build output
    const scriptUri = getUri(webview, extensionUri, ['webview-ui', 'build', 'assets', 'index.js'])

    // const codiconsUri = getUri(webview, extensionUri, ['node_modules', '@vscode/codicons', 'dist', 'codicon.css']);

    const nonce = getNonce()

    // Tip: Install the es6-string-html VS Code extension to enable code highlighting below
    return /*html*/ `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <meta http-equiv="Content-Security-Policy" 
                content="default-src 'none';
                        connect-src 'self' http://localhost:3001 
                                          https://mcxeqf7hzekaahjdqpojzf4hya0aflwj.lambda-url.us-east-1.on.aws/
                                          https://dprnu1tro5.execute-api.us-east-1.amazonaws.com/prod/v1/
                                          https://api.github.com/
                                          https://us.posthog.com/
                                          https://app.posthog.com/
                                          https://api-js.mixpanel.com/;
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
    `
  }

  /**
   * Sets up an event listener to listen for messages passed from the webview context and
   * executes code based on the message that is recieved.
   *
   * @param webview A reference to the extension webview
   * @param context A reference to the extension context
   */
  private _setWebviewMessageListener(webview: Webview) {
    webview.onDidReceiveMessage(
      (message: any) => {
        const command = message.command
        const text = message.text

        switch (command) {
          case 'hello':
            // Code that should run in response to the hello message command
            window.showInformationMessage(text)
            return
          // Add more switch case statements here as more webview message commands
          // are created within the webview context (i.e. inside media/main.js)
          case 'login':
            commands.executeCommand('onboard.login')
            // commands.executeCommand("workbench.action.webview.reloadWebviewAction"); // reloads all webviews
            return

          case 'reset':
            commands.executeCommand('onboard.reset')
            return

          case 'chat':
            window.showInformationMessage(text)
            return

          case 'upgrade':
            window.showInformationMessage(text)
            return

          case 'error':
            window.showErrorMessage(text)
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
        }
      },
      undefined,
      this._disposables
    )
  }
}
