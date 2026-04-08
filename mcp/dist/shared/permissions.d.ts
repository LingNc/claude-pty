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
export declare function checkCommandPermission(command: string, args: string[]): Promise<void>;
/**
 * Check if workdir is allowed
 * In MCP: Always returns true, client handles permissions
 */
export declare function checkWorkdirPermission(workdir: string): Promise<void>;
/**
 * Initialize permissions with project directory
 * In MCP: No-op, kept for API compatibility
 */
export declare function initPermissions(directory: string): void;
//# sourceMappingURL=permissions.d.ts.map