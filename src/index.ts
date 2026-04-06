import { definePlugin, defineSetting } from 'claude-code/plugin'
import { ptySpawnTool } from './tools/spawn.js'
import { ptyWrite } from './tools/write.js'
import { ptyRead } from './tools/read.js'
import { ptyKill } from './tools/kill.js'
import { ptyList } from './tools/list.js'
import { lifecycleManager } from './pty/session-lifecycle.js'

export default definePlugin({
  name: 'claude-pty',
  description: 'PTY terminal integration for Claude Code',

  settings: [
    defineSetting({
      key: 'pty.maxBufferSize',
      type: 'number',
      description: 'Maximum buffer size in characters',
      default: 1000000,
    }),
    defineSetting({
      key: 'pty.defaultCols',
      type: 'number',
      description: 'Default terminal columns',
      default: 120,
    }),
    defineSetting({
      key: 'pty.defaultRows',
      type: 'number',
      description: 'Default terminal rows',
      default: 30,
    }),
  ],

  tools: [ptySpawnTool, ptyWrite, ptyRead, ptyKill, ptyList],

  // Session cleanup hook - clean up child PTY sessions when parent session is deleted
  onSessionDeleted({ sessionId }) {
    lifecycleManager.cleanupBySession(sessionId)
  },
})
