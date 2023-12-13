## Run The Extension

```bash
# Install dependencies for both the extension and webview UI source code
npm run install:all

# Build webview UI source code
npm run build:webview

# Open sample in VS Code
code .
```

Once inside VS Code, you can run the extension by doing the following:

1. Press `F5` to open a new Extension Development Host window
2. Type `Cmd+L` or `Onboard AI: Chat` in the Command Palette to start a new session

To sign out, do so via the VS Code `Accounts` icon in the Activity Bar (bottom left).

Known issues:
- If you hit 'Back' before a new repo is done processing, an unexpected error may occur. In this case, just enter the GitHub URL again to reprocess your repo.
- Generated markdown doesn't always wrap correctly. 
- After logging in, you may not be automatically redirected. In this case, just reopen/reload the chat window with `Cmd+L`.
- Sometimes when reauthenticating with the `Onboard AI: Login` command, a timeout error pops up. You can (usually) ignore this.
- Do not log out, you won't be able to log back in lol. Edit: Actually you can, but you'll have to do it via `Accounts`, similar to sign out.
- Also, if you log out, you will not be prompted to log back in and will receive errors when trying to execute basic commands.
- If you already have a command mapped to `Cmd+L`, the keybinding may not function properly.
