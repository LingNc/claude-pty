import { defineCommand } from 'claude-code/plugin';
import { PTYServer } from '../web/server/server.js';
// Global server instance to keep it running
let ptyServer = null;
/**
 * Get or create the PTY server instance
 */
export async function getOrCreateServer() {
    if (!ptyServer) {
        ptyServer = await PTYServer.createServer();
    }
    return ptyServer;
}
/**
 * Get the current server URL if available
 */
export function getServerUrl() {
    if (!ptyServer) {
        return null;
    }
    return ptyServer.getHttpUrl();
}
/**
 * Close the PTY server if running
 */
export function closeServer() {
    if (ptyServer) {
        ptyServer[Symbol.dispose]();
        ptyServer = null;
    }
}
/**
 * PTY Open command - Opens the Web UI for PTY sessions
 */
export const ptyOpenCommand = defineCommand({
    name: 'pty-open',
    description: 'Open the PTY Sessions Web Interface in your browser',
    parameters: {
        port: {
            type: 'number',
            description: 'Optional port number (default: auto-assigned)',
        },
    },
    async execute(args) {
        try {
            // Start the server if not already running
            const server = await getOrCreateServer();
            const url = server.getHttpUrl();
            const wsUrl = server.getWsUrl();
            // Return message with URLs
            // Note: Claude Code may not have a browser open API, so we provide the URL
            return `
┌────────────────────────────────────────────────────────────┐
│              PTY Sessions Web Interface                     │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  🌐 Web UI:    ${url.padEnd(50)}│
│  🔌 WebSocket: ${wsUrl.padEnd(50)}│
│                                                            │
├────────────────────────────────────────────────────────────┤
│  The Web UI allows you to:                                 │
│  • View all active PTY sessions                            │
│  • Monitor real-time terminal output                       │
│  • Send input to running sessions                          │
│  • Kill sessions                                           │
│                                                            │
│  Note: If the URL doesn't open automatically, please       │
│  copy and paste it into your browser.                      │
│                                                            │
└────────────────────────────────────────────────────────────┘
`;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return `Failed to start PTY Web Interface: ${errorMessage}`;
        }
    },
});
/**
 * PTY Show URL command - Display the current Web UI URL
 */
export const ptyShowUrlCommand = defineCommand({
    name: 'pty-show-url',
    description: 'Show the PTY Sessions Web Interface URL',
    parameters: {},
    async execute() {
        const url = getServerUrl();
        if (!url) {
            return `
PTY Web Interface is not running.

Use /pty-open to start the server first.
`;
        }
        return `
PTY Sessions Web Interface URL:
${url}
`;
    },
});
//# sourceMappingURL=pty-open.js.map