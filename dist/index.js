import { definePlugin, defineSetting } from 'claude-code/plugin';
import { spawn } from 'child_process';
import { resolve, join } from 'path';
import { existsSync, writeFileSync, mkdirSync, appendFileSync, statSync, readdirSync, unlinkSync, watch } from 'fs';
import { homedir } from 'os';
import { ptySpawnTool } from './tools/spawn.js';
import { ptyWrite } from './tools/write.js';
import { ptyRead } from './tools/read.js';
import { ptyKill } from './tools/kill.js';
import { ptyList } from './tools/list.js';
import { manager } from './pty/manager.js';
import { ptyOpenCommand, ptyShowUrlCommand } from './commands/pty-open.js';
// MCP Server process reference
let mcpProcess = null;
let restartCount = 0;
const MAX_RESTARTS = 3;
let restartTimer = null;
// File watcher for hot reload
let configWatcher = null;
// Log configuration
const LOG_DIR = join(homedir(), '.claude-pty', 'logs');
const LOG_FILE = join(LOG_DIR, 'mcp.log');
const MAX_LOG_DAYS = 7;
const MCP_CONFIG_PATH = join(homedir(), '.config', 'claude', 'mcp.json');
/**
 * Initialize log directory
 */
function initLogDir() {
    if (!existsSync(LOG_DIR)) {
        mkdirSync(LOG_DIR, { recursive: true });
    }
    rotateLogs();
}
/**
 * Rotate logs - keep only last 7 days
 */
function rotateLogs() {
    try {
        if (!existsSync(LOG_DIR))
            return;
        const files = readdirSync(LOG_DIR);
        const now = Date.now();
        const maxAge = MAX_LOG_DAYS * 24 * 60 * 60 * 1000;
        for (const file of files) {
            const filePath = join(LOG_DIR, file);
            try {
                const stats = statSync(filePath);
                if (now - stats.mtimeMs > maxAge) {
                    unlinkSync(filePath);
                    console.error(`[Log] Removed old log: ${file}`);
                }
            }
            catch {
                // Ignore file access errors
            }
        }
    }
    catch (err) {
        console.error('[Log] Rotation error:', err);
    }
}
/**
 * Write log with level and timestamp
 */
function log(level, message) {
    const timestamp = new Date().toISOString();
    const logLine = `[${timestamp}] [${level}] ${message}\n`;
    // Console output
    if (level === 'ERROR') {
        console.error(`[MCP] ${message}`);
    }
    else {
        console.error(`[MCP] ${message}`);
    }
    // File output
    try {
        appendFileSync(LOG_FILE, logLine);
    }
    catch (err) {
        console.error('[MCP] Failed to write log:', err);
    }
}
/**
 * Get MCP server path
 */
function getMCPPath() {
    const possiblePaths = [
        resolve(__dirname, '../mcp/dist/server.js'),
        resolve(__dirname, '../../mcp/dist/server.js'),
        join(process.cwd(), 'mcp/dist/server.js'),
    ];
    return possiblePaths.find(p => existsSync(p)) || null;
}
/**
 * Start MCP server as a child process with restart logic
 */
function startMCPServer() {
    try {
        const mcpPath = getMCPPath();
        if (!mcpPath) {
            log('ERROR', 'Server not found in standard locations');
            return null;
        }
        log('INFO', `Starting server from: ${mcpPath}`);
        const proc = spawn('bun', [mcpPath], {
            stdio: ['pipe', 'pipe', 'pipe'],
            detached: false,
        });
        proc.on('error', (err) => {
            log('ERROR', `Process error: ${err.message}`);
        });
        proc.on('exit', (code, signal) => {
            log('WARN', `Process exited with code ${code}, signal: ${signal}`);
            mcpProcess = null;
            // Auto-restart logic
            if (restartCount < MAX_RESTARTS) {
                restartCount++;
                log('INFO', `Scheduling restart ${restartCount}/${MAX_RESTARTS} in 3s...`);
                if (restartTimer)
                    clearTimeout(restartTimer);
                restartTimer = setTimeout(() => {
                    log('INFO', `Restarting MCP server (${restartCount}/${MAX_RESTARTS})...`);
                    mcpProcess = startMCPServer();
                    if (mcpProcess) {
                        log('INFO', 'Restart successful');
                    }
                    else {
                        log('ERROR', 'Restart failed');
                    }
                }, 3000);
            }
            else {
                log('ERROR', `Max restarts (${MAX_RESTARTS}) reached, giving up`);
            }
        });
        proc.stderr?.on('data', (data) => {
            const msg = data.toString().trim();
            if (msg)
                log('INFO', `[stderr] ${msg}`);
        });
        proc.stdout?.on('data', (data) => {
            const msg = data.toString().trim();
            if (msg)
                log('INFO', `[stdout] ${msg}`);
        });
        log('INFO', `Server started with PID: ${proc.pid}`);
        return proc;
    }
    catch (err) {
        log('ERROR', `Failed to start: ${err}`);
        return null;
    }
}
/**
 * Stop MCP server and cleanup
 */
function stopMCPServer() {
    if (restartTimer) {
        clearTimeout(restartTimer);
        restartTimer = null;
    }
    if (mcpProcess) {
        log('INFO', `Stopping server (PID: ${mcpProcess.pid})...`);
        mcpProcess.removeAllListeners();
        mcpProcess.kill('SIGTERM');
        // Force kill after 5s if still running
        setTimeout(() => {
            if (mcpProcess && !mcpProcess.killed) {
                log('WARN', 'Force killing server...');
                mcpProcess.kill('SIGKILL');
            }
        }, 5000);
        mcpProcess = null;
    }
}
/**
 * Reset restart counter (call on successful operation)
 */
function resetRestartCounter() {
    if (restartCount > 0) {
        log('INFO', `Reset restart counter (was ${restartCount})`);
        restartCount = 0;
    }
}
/**
 * Generate MCP configuration file
 */
function generateMCPConfig() {
    try {
        const mcpPath = getMCPPath();
        if (!mcpPath) {
            log('ERROR', 'Cannot generate config: server not found');
            return false;
        }
        const configDir = join(homedir(), '.config', 'claude');
        const configPath = join(configDir, 'mcp.json');
        if (!existsSync(configDir)) {
            mkdirSync(configDir, { recursive: true });
        }
        let config = {};
        try {
            if (existsSync(configPath)) {
                config = JSON.parse(require('fs').readFileSync(configPath, 'utf-8'));
            }
        }
        catch {
            config = {};
        }
        config.mcpServers = config.mcpServers || {};
        config.mcpServers['claude-pty'] = {
            command: 'bun',
            args: [mcpPath],
            description: 'PTY terminal integration for Claude Code',
        };
        writeFileSync(configPath, JSON.stringify(config, null, 2));
        log('INFO', `Configuration written to: ${configPath}`);
        return true;
    }
    catch (err) {
        log('ERROR', `Failed to generate config: ${err}`);
        return false;
    }
}
/**
 * User notification with emoji status
 */
function notifyUser(context, status, message, suggestion) {
    const icons = {
        success: '✅',
        warning: '⚠️',
        error: '❌',
    };
    const fullMessage = suggestion
        ? `${icons[status]} ${message}\n💡 ${suggestion}`
        : `${icons[status]} ${message}`;
    console.error(`[Plugin] ${fullMessage}`);
    if (context.notify) {
        context.notify(fullMessage);
    }
}
/**
 * Setup config file watcher for hot reload
 */
function setupConfigWatcher(context) {
    if (!existsSync(MCP_CONFIG_PATH))
        return;
    try {
        configWatcher = watch(MCP_CONFIG_PATH, (eventType) => {
            if (eventType === 'change') {
                log('INFO', 'MCP config file changed, reloading...');
                notifyUser(context, 'warning', 'MCP configuration changed', 'Restarting MCP server...');
                // Stop and restart
                stopMCPServer();
                setTimeout(() => {
                    setupMCP(context);
                }, 1000);
            }
        });
        log('INFO', `Watching config: ${MCP_CONFIG_PATH}`);
    }
    catch (err) {
        log('ERROR', `Failed to setup config watcher: ${err}`);
    }
}
/**
 * Cleanup config watcher
 */
function cleanupConfigWatcher() {
    if (configWatcher) {
        configWatcher.close();
        configWatcher = null;
        log('INFO', 'Config watcher stopped');
    }
}
/**
 * Try to register MCP server via API or fallback to config
 */
async function setupMCP(context) {
    initLogDir();
    log('INFO', 'Setting up MCP server...');
    // Setup config watcher for hot reload
    setupConfigWatcher(context);
    mcpProcess = startMCPServer();
    if (!mcpProcess) {
        log('ERROR', 'Failed to start server, trying config fallback...');
        notifyUser(context, 'error', 'MCP server failed to start', 'Check logs at ~/.claude-pty/logs/mcp.log');
        return generateMCPConfig();
    }
    // Try API registration
    if (context.registerMCPServer) {
        try {
            await context.registerMCPServer({
                name: 'claude-pty',
                process: mcpProcess,
            });
            log('INFO', 'Registered via API');
            resetRestartCounter();
            notifyUser(context, 'success', 'MCP server started and registered');
            return true;
        }
        catch (err) {
            log('ERROR', `API registration failed: ${err}`);
            notifyUser(context, 'warning', 'MCP server started but API registration failed', 'Using config file fallback');
        }
    }
    // Fallback: generate config file
    log('INFO', 'API not available, using config file...');
    const configOk = generateMCPConfig();
    if (configOk) {
        notifyUser(context, 'warning', 'MCP server configured via config file', 'Please restart Claude Code to activate');
    }
    else {
        notifyUser(context, 'error', 'Failed to configure MCP server', 'Check file permissions for ~/.config/claude/');
    }
    return configOk;
}
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
    commands: [ptyOpenCommand, ptyShowUrlCommand],
    async onLoad(context) {
        console.error('[Plugin] claude-pty loading...');
        const mcpOk = await setupMCP(context);
        if (mcpOk) {
            console.error('[Plugin] MCP setup complete');
        }
        else {
            console.error('[Plugin] MCP setup failed, plugin tools still available');
        }
        console.error('[Plugin] claude-pty loaded successfully');
    },
    onUnload() {
        console.error('[Plugin] claude-pty unloading...');
        stopMCPServer();
        cleanupConfigWatcher();
        console.error('[Plugin] claude-pty unloaded');
    },
    onSessionDeleted({ sessionId }) {
        manager.cleanupBySession(sessionId);
    },
});
//# sourceMappingURL=index.js.map