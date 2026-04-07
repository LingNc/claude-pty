import { manager } from '../../../pty/manager.js';
import { JsonResponse, ErrorResponse } from './responses.ts';
export function getSessions() {
    const sessions = manager.list();
    return new JsonResponse(sessions);
}
export async function createSession(req) {
    try {
        const body = (await req.json());
        if (!body.command || typeof body.command !== 'string' || body.command.trim() === '') {
            return new ErrorResponse('Command is required', 400);
        }
        const session = manager.spawn({
            command: body.command,
            args: body.args || [],
            title: body.description,
            description: body.description,
            workdir: body.workdir,
            parentSessionId: 'web-api',
        });
        return new JsonResponse(session);
    }
    catch {
        return new ErrorResponse('Invalid JSON in request body', 400);
    }
}
export function clearSessions() {
    manager.clearAllSessions();
    return new JsonResponse({ success: true });
}
export function getSession(req) {
    const session = manager.get(req.params.id);
    if (!session) {
        return new ErrorResponse('Session not found', 404);
    }
    return new JsonResponse(session);
}
export async function sendInput(req) {
    try {
        const body = (await req.json());
        if (!body.data || typeof body.data !== 'string') {
            return new ErrorResponse('Data field is required and must be a string', 400);
        }
        const success = manager.write(req.params.id, body.data);
        if (!success) {
            return new ErrorResponse('Failed to write to session', 400);
        }
        return new JsonResponse({ success: true });
    }
    catch {
        return new ErrorResponse('Invalid JSON in request body', 400);
    }
}
export function cleanupSession(req) {
    const success = manager.kill(req.params.id, true);
    if (!success) {
        return new ErrorResponse('Failed to kill session', 400);
    }
    return new JsonResponse({ success: true });
}
export function killSession(req) {
    const success = manager.kill(req.params.id);
    if (!success) {
        return new ErrorResponse('Failed to kill session', 400);
    }
    return new JsonResponse({ success: true });
}
export function getRawBuffer(req) {
    const bufferData = manager.getRawBuffer(req.params.id);
    if (!bufferData) {
        return new ErrorResponse('Session not found', 404);
    }
    return new JsonResponse(bufferData);
}
export function getPlainBuffer(req) {
    const bufferData = manager.getRawBuffer(req.params.id);
    if (!bufferData) {
        return new ErrorResponse('Session not found', 404);
    }
    // Strip ANSI codes - simple implementation
    const plainText = bufferData.raw.replace(/\x1b\[[0-9;]*m/g, '');
    return new JsonResponse({
        plain: plainText,
        byteLength: new TextEncoder().encode(plainText).length,
    });
}
//# sourceMappingURL=sessions.js.map