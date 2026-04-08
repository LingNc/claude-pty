/**
 * MCP Simplified Permission System
 *
 * In MCP context, permissions are handled by the MCP client.
 * This is a simplified version that logs permission checks but doesn't block.
 *
 * For strict permission control, configure at the MCP client level.
 */
/**
 * Check if command is allowed
 * In MCP: Always returns true, client handles permissions
 */
export async function checkCommandPermission(command, args) {
    // MCP clients handle permission enforcement
    // This function is kept for compatibility but doesn't block
    console.error(`[Permission] Command check: ${command} ${args.join(' ')}`);
}
/**
 * Check if workdir is allowed
 * In MCP: Always returns true, client handles permissions
 */
export async function checkWorkdirPermission(workdir) {
    // MCP clients handle permission enforcement
    console.error(`[Permission] Workdir check: ${workdir}`);
}
/**
 * Initialize permissions with project directory
 * In MCP: No-op, kept for API compatibility
 */
export function initPermissions(directory) {
    console.error(`[Permission] Initialized with directory: ${directory}`);
}
//# sourceMappingURL=permissions.js.map