import * as vscode from 'vscode';
import { commands, ExtensionContext } from "vscode";
import { ChatPanel } from "./panels/ChatPanel";
import { SessionManager } from './sessionManager';
import { Credentials } from './credentials';

export async function activate(context: ExtensionContext) {

  SessionManager.globalState = context.globalState;

  const credentials = new Credentials();
  await credentials.initialize(context);
  

  const openChat = commands.registerCommand("onboard.chat", () => {
    ChatPanel.render(context.extensionUri);
  });

  const githubAuth = vscode.commands.registerCommand('onboard.login', async () => {
    const octokit = await credentials.getOctokit();
    const userInfo = await octokit.users.getAuthenticated();

    vscode.window.showInformationMessage(`Logged into GitHub as ${userInfo.data.login}`);
    // reload the window to update
    vscode.commands.executeCommand('workbench.action.reloadWindow');
  });

  // Add command to the extension context
  context.subscriptions.push(openChat);
  context.subscriptions.push(githubAuth);
}
