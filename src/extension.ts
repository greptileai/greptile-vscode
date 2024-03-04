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

  const githubAuth = vscode.commands.registerCommand('greptile.signIn', async () => {
    const octokit = await credentials.getOctokit()
    const userInfo = await octokit.users.getAuthenticated()

    vscode.window.showInformationMessage('Signing in with Github...')
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // reload the window to update
    vscode.commands.executeCommand('workbench.action.reloadWindow')
  })

  // const signOut = vscode.commands.registerCommand('greptile.signOut', async () => {
  //   const session = SessionManager.getSession()
  //   SessionManager.setSession({} as Session)

  //   vscode.window.showInformationMessage('Signed out of Greptile')
  //   vscode.commands.executeCommand('workbench.action.reloadWindow')
  // })

  const sessionReset = vscode.commands.registerCommand('greptile.resetSession', async () => {
    const session = SessionManager.getSession()
    SessionManager.setSession({
      user: session?.user,
    } as Session)
    vscode.window.showInformationMessage('Greptile session reset')
    vscode.commands.executeCommand('workbench.action.webview.reloadWebviewAction')
  })

  const chatReset = vscode.commands.registerCommand('greptile.resetChat', async () => {
    const session = SessionManager.getSession()
    SessionManager.setSession({
      ...session,
      state: {
        ...session?.state,
        chat: null,
      },
    } as Session)
    vscode.window.showInformationMessage('Greptile chat reset')
    vscode.commands.executeCommand('workbench.action.webview.reloadWebviewAction')
  })

  const reload = vscode.commands.registerCommand('greptile.reload', async () => {
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
  // context.subscriptions.push(signOut)
  context.subscriptions.push(sessionReset)
  context.subscriptions.push(chatReset)
  context.subscriptions.push(reload)
}
