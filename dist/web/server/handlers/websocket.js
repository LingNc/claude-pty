import { manager } from '../../../pty/manager.js';
import { CustomError, } from '../../shared/types.ts';
class WebSocketHandler {
    sendSessionList(ws) {
        const sessions = manager.list();
        const message = { type: 'session_list', sessions };
        ws.send(JSON.stringify(message));
    }
    handleSubscribe(ws, message) {
        const session = manager.get(message.sessionId);
        if (!session) {
            const error = {
                type: 'error',
                error: new CustomError(`Session ${message.sessionId} not found`),
            };
            ws.send(JSON.stringify(error));
        }
        else {
            ws.subscribe(`session:${message.sessionId}`);
            const response = {
                type: 'subscribed',
                sessionId: message.sessionId,
            };
            ws.send(JSON.stringify(response));
        }
    }
    handleUnsubscribe(ws, message) {
        const topic = `session:${message.sessionId}`;
        ws.unsubscribe(topic);
        const response = {
            type: 'unsubscribed',
            sessionId: message.sessionId,
        };
        ws.send(JSON.stringify(response));
    }
    handleSessionListRequest(ws, _message) {
        this.sendSessionList(ws);
    }
    handleUnknownMessage(ws, message) {
        const error = {
            type: 'error',
            error: new CustomError(`Unknown message type ${message.type}`),
        };
        ws.send(JSON.stringify(error));
    }
    handleWebSocketMessage(ws, data) {
        if (typeof data !== 'string') {
            const error = {
                type: 'error',
                error: new CustomError('Binary messages are not supported yet. File an issue.'),
            };
            ws.send(JSON.stringify(error));
            return;
        }
        try {
            const message = JSON.parse(data);
            switch (message.type) {
                case 'subscribe':
                    this.handleSubscribe(ws, message);
                    break;
                case 'unsubscribe':
                    this.handleUnsubscribe(ws, message);
                    break;
                case 'session_list':
                    this.handleSessionListRequest(ws, message);
                    break;
                case 'spawn':
                    this.handleSpawn(ws, message);
                    break;
                case 'input':
                    this.handleInput(message);
                    break;
                case 'readRaw':
                    this.handleReadRaw(ws, message);
                    break;
                default:
                    this.handleUnknownMessage(ws, message);
            }
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            const error = {
                type: 'error',
                error: new CustomError(errorMessage),
            };
            ws.send(JSON.stringify(error));
        }
    }
    handleSpawn(ws, message) {
        const sessionInfo = manager.spawn(message);
        if (message.subscribe) {
            this.handleSubscribe(ws, { type: 'subscribe', sessionId: sessionInfo.id });
        }
    }
    handleInput(message) {
        manager.write(message.sessionId, message.data);
    }
    handleReadRaw(ws, message) {
        const rawData = manager.getRawBuffer(message.sessionId);
        if (!rawData) {
            const error = {
                type: 'error',
                error: new CustomError(`Session ${message.sessionId} not found`),
            };
            ws.send(JSON.stringify(error));
            return;
        }
        const response = {
            type: 'readRawResponse',
            sessionId: message.sessionId,
            rawData: rawData.raw,
        };
        ws.send(JSON.stringify(response));
    }
}
export function handleWebSocketMessage(ws, data) {
    const handler = new WebSocketHandler();
    handler.handleWebSocketMessage(ws, data);
}
//# sourceMappingURL=websocket.js.map