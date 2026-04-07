import type { PTYSessionInfo } from '../../shared/types.ts';
interface UseWebSocketOptions {
    activeSession: PTYSessionInfo | null;
    onRawData?: (rawData: string) => void;
    onSessionList: (sessions: PTYSessionInfo[], autoSelected: PTYSessionInfo | null) => void;
    onSessionUpdate?: (updatedSession: PTYSessionInfo) => void;
}
export declare function useWebSocket({ activeSession, onRawData, onSessionList, onSessionUpdate, }: UseWebSocketOptions): {
    connected: any;
    subscribe: (sessionId: string) => void;
    subscribeWithRetry: (sessionId: string) => void;
    sendInput: (sessionId: string, data: string) => void;
};
export {};
//# sourceMappingURL=use-web-socket.d.ts.map