import { allStructured } from './wildcard.js';
let _projectDirectory = null;
export function initPermissions(directory) {
    _projectDirectory = directory;
}
async function getPermissionConfig() {
    // For now, return empty config - can be extended to read from config file
    return {};
}
async function denyWithToast(msg, details) {
    const errorMsg = details ? `${msg} ${details}` : msg;
    throw new Error(errorMsg);
}
async function handleAskPermission(commandLine) {
    await denyWithToast(`PTY: Command "${commandLine}" requires permission (treated as denied)`, `PTY spawn denied: Command "${commandLine}" requires user permission which is not supported by this plugin. Configure explicit "allow" or "deny" in your permission settings.`);
    throw new Error('Unreachable');
}
export async function checkCommandPermission(command, args) {
    const config = await getPermissionConfig();
    const bashPerms = config.bash;
    if (!bashPerms) {
        return;
    }
    if (typeof bashPerms === 'string') {
        if (bashPerms === 'deny') {
            await denyWithToast('PTY spawn denied: All bash commands are disabled by user configuration.');
        }
        if (bashPerms === 'ask') {
            await handleAskPermission(command);
        }
        return;
    }
    const action = allStructured({ head: command, tail: args }, bashPerms);
    if (action === 'deny') {
        await denyWithToast(`PTY spawn denied: Command "${command} ${args.join(' ')}" is explicitly denied by user configuration.`);
    }
    if (action === 'ask') {
        await handleAskPermission(`${command} ${args.join(' ')}`);
    }
}
export async function checkWorkdirPermission(workdir) {
    if (!_projectDirectory) {
        return;
    }
    const normalizedWorkdir = workdir.replace(/\/$/, '');
    const normalizedProject = _projectDirectory.replace(/\/$/, '');
    if (normalizedWorkdir.startsWith(normalizedProject)) {
        return;
    }
    const config = await getPermissionConfig();
    const extDirPerm = config.external_directory;
    if (extDirPerm === 'deny') {
        await denyWithToast(`PTY spawn denied: Working directory "${workdir}" is outside project directory "${_projectDirectory}". External directory access is denied by user configuration.`);
    }
    if (extDirPerm === 'ask') {
        // TODO: Implement user prompt for external directory access
    }
}
//# sourceMappingURL=permissions.js.map