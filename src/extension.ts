import * as vscode from 'vscode';
import { commands, ExtensionContext } from "vscode";
import { ChatPanel } from "./panels/ChatPanel";
import { RepositoryViewProvider } from './views/repositoryViewProvider';
import { ChatViewProvider } from './views/chatViewProvider';
import { SessionManager } from './sessionManager';
import { Credentials } from './credentials';

export async function activate(context: ExtensionContext) {

  SessionManager.globalState = context.globalState;

  const credentials = new Credentials();
  await credentials.initialize(context);
  
  let openChat = vscode.commands.registerCommand('onboard.chat', () => {
    // // Toggle the chat panel
    // if (ChatPanel.currentPanel) {
    //   // If the panel is open, close it
    //   ChatPanel.currentPanel.dispose();
    // } else {
    //   // If the panel is not open, create and show it
    //   ChatPanel.render(context.extensionUri);
    // }

    vscode.commands.executeCommand('repositoryView.focus');
    vscode.commands.executeCommand('chatView.focus');
  });

  const githubAuth = vscode.commands.registerCommand('onboard.login', async () => {
    const octokit = await credentials.getOctokit();
    const userInfo = await octokit.users.getAuthenticated();

    vscode.window.showInformationMessage(`Logged into GitHub as ${userInfo.data.login}`);
    // reload the window to update
    vscode.commands.executeCommand('workbench.action.reloadWindow');
  });

  const repositoryViewProvider = new RepositoryViewProvider(context.extensionUri);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(RepositoryViewProvider.viewType, repositoryViewProvider)
  );

  const chatViewProvider = new ChatViewProvider(context.extensionUri);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(ChatViewProvider.viewType, chatViewProvider)
  );

  // Add command to the extension context
  context.subscriptions.push(openChat);
  context.subscriptions.push(githubAuth);
}
