import type { PTYSession } from './types.js'
import { NOTIFICATION_LINE_TRUNCATE, NOTIFICATION_TITLE_TRUNCATE } from './constants.js'

/**
 * Manages exit notifications for PTY sessions
 */
export class NotificationManager {
  async sendExitNotification(
    session: PTYSession,
    exitCode: number,
    notifyFn: (message: string) => void
  ): Promise<void> {
    try {
      const message = this.buildExitNotification(session, exitCode)
      notifyFn(message)
    } catch {
      // Ignore notification errors
    }
  }

  private buildExitNotification(session: PTYSession, exitCode: number): string {
    const lineCount = session.buffer.length
    let lastLine = ''
    if (lineCount > 0) {
      for (let i = lineCount - 1; i >= 0; i--) {
        const bufferLines = session.buffer.read(i, 1)
        const line = bufferLines[0]
        if (line !== undefined && line.trim() !== '') {
          lastLine =
            line.length > NOTIFICATION_LINE_TRUNCATE
              ? `${line.slice(0, NOTIFICATION_LINE_TRUNCATE)}...`
              : line
          break
        }
      }
    }

    const displayTitle = session.description ?? session.title
    const truncatedTitle =
      displayTitle.length > NOTIFICATION_TITLE_TRUNCATE
        ? `${displayTitle.slice(0, NOTIFICATION_TITLE_TRUNCATE)}...`
        : displayTitle

    const lines = [
      '<pty_exited>',
      `ID: ${session.id}`,
      `Description: ${truncatedTitle}`,
      `Exit Code: ${exitCode}`,
      `Output Lines: ${lineCount}`,
      `Last Line: ${lastLine}`,
      '</pty_exited>',
      '',
    ]

    if (exitCode === 0) {
      lines.push('Use pty_read to check the full output.')
    } else {
      lines.push(
        'Process failed. Use pty_read with the pattern parameter to search for errors in the output.'
      )
    }

    return lines.join('\n')
  }
}

export const notificationManager = new NotificationManager()
