import * as vscode from 'vscode'
import { ExtensionContext } from 'vscode'
import { RepositoryViewProvider } from './views/repositoryViewProvider'
import { ChatViewProvider } from './views/chatViewProvider'
import { SessionManager } from './sessionManager'
import { Credentials } from './credentials'
import { Session } from './types/session'

export async function activate(context: ExtensionContext) {
  SessionManager.globalState = context.globalState

  const credentials = new Credentials()
  await credentials.initialize(context)

  const openChat = vscode.commands.registerCommand('greptile.chat', () => {
    vscode.commands.executeCommand('repositoryView.focus')
    vscode.commands.executeCommand('chatView.focus')
  })

  const githubAuth = vscode.commands.registerCommand('greptile.login', async () => {
    const octokit = await credentials.getOctokit()
    const userInfo = await octokit.users.getAuthenticated()

    vscode.window.showInformationMessage(`Logged into GitHub as ${userInfo.data.login}`)
    // reload the window to update
    vscode.commands.executeCommand('workbench.action.reloadWindow')
  })

  const sessionReset = vscode.commands.registerCommand('greptile.reset', async () => {
    SessionManager.setSession({
      user: SessionManager.getSession()?.user,
    } as Session)
    vscode.window.showInformationMessage('Greptile session reset')
    vscode.commands.executeCommand('workbench.action.webview.reloadWebviewAction')
  })

  const repositoryViewProvider = new RepositoryViewProvider(context.extensionUri)
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      RepositoryViewProvider.viewType,
      repositoryViewProvider
    )
  )

  const chatViewProvider = new ChatViewProvider(context.extensionUri)
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(ChatViewProvider.viewType, chatViewProvider)
  )

  // Add command to the extension context
  context.subscriptions.push(openChat)
  context.subscriptions.push(githubAuth)
  context.subscriptions.push(sessionReset)
}
