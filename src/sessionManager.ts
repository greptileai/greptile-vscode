import * as vscode from 'vscode'
import { Session } from './types/session'

export class SessionManager {
  static globalState: vscode.Memento

  static setSession(session: Session) {
    return this.globalState.update('session', session)
  }

  static getSession(): Session | undefined {
    return this.globalState.get('session')
  }
}
