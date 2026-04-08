import type { PTYSession } from '../pty/types.js';
import { NOTIFICATION_LINE_TRUNCATE, NOTIFICATION_TITLE_TRUNCATE } from '../pty/constants.js';

/**
 * Notification Manager for MCP
 * In MCP context, notifications are sent via stderr (console.error)
 * instead of context.notify
 */
export class NotificationManager {
  /**
   * Send exit notification via stderr
   * In MCP: Uses console.error instead of notify function
   */
  async sendExitNotification(
    session: PTYSession,
    exitCode: number
  ): Promise<void> {
    try {
      const message = this.buildExitNotification(session, exitCode);
      // In MCP, notifications go to stderr
      console.error(message);
    } catch {
      // Ignore notification errors
    }
  }

  private buildExitNotification(session: PTYSession, exitCode: number): string {
    const lineCount = session.buffer.length;
    let lastLine = '';
    if (lineCount > 0) {
      for (let i = lineCount - 1; i >= 0; i--) {
        const bufferLines = session.buffer.read(i, 1);
        const line = bufferLines[0];
        if (line !== undefined && line.trim() !== '') {
          lastLine =
            line.length > NOTIFICATION_LINE_TRUNCATE
              ? `${line.slice(0, NOTIFICATION_LINE_TRUNCATE)}...`
              : line;
          break;
        }
      }
    }

    const displayTitle = session.description ?? session.title;
    const truncatedTitle =
      displayTitle.length > NOTIFICATION_TITLE_TRUNCATE
        ? `${displayTitle.slice(0, NOTIFICATION_TITLE_TRUNCATE)}...`
        : displayTitle;

    const lines = [
      '<pty_exited>',
      `ID: ${session.id}`,
      `Description: ${truncatedTitle}`,
      `Exit Code: ${exitCode}`,
      `Output Lines: ${lineCount}`,
      `Last Line: ${lastLine}`,
      '</pty_exited>',
      '',
    ];

    if (exitCode === 0) {
      lines.push('Use pty_read to check the full output.');
    } else {
      lines.push(
        'Process failed. Use pty_read with the pattern parameter to search for errors in the output.'
      );
    }

    return lines.join('\n');
  }
}

export const notificationManager = new NotificationManager();
