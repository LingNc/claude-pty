import {
  registerRawOutputCallback,
  registerSessionUpdateCallback,
  removeRawOutputCallback,
  removeSessionUpdateCallback,
} from '../../pty/manager.js'
import type { PTYSessionInfo } from '../../pty/types.js'
import type { WSMessageServerSessionUpdate, WSMessageServerRawData } from '../shared/types.ts'

export class CallbackManager implements Disposable {
  private server: { publish: (topic: string, data: string) => void }

  constructor(server: { publish: (topic: string, data: string) => void }) {
    this.server = server
    registerSessionUpdateCallback(this.sessionUpdateCallback)
    registerRawOutputCallback(this.rawOutputCallback)
  }

  private sessionUpdateCallback = (session: PTYSessionInfo): void => {
    const message: WSMessageServerSessionUpdate = { type: 'session_update', session }
    this.server.publish('sessions:update', JSON.stringify(message))
  }

  private rawOutputCallback = (session: PTYSessionInfo, rawData: string): void => {
    const message: WSMessageServerRawData = { type: 'raw_data', session, rawData }
    this.server.publish(`session:${session.id}`, JSON.stringify(message))
  }

  [Symbol.dispose]() {
    removeSessionUpdateCallback(this.sessionUpdateCallback)
    removeRawOutputCallback(this.rawOutputCallback)
  }
}
