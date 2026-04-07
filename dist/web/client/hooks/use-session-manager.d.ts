import type { PTYSessionInfo } from '../../shared/types.ts';
interface UseSessionManagerOptions {
    activeSession: PTYSessionInfo | null;
    setActiveSession: (session: PTYSessionInfo | null) => void;
    subscribeWithRetry: (sessionId: string) => void;
    sendInput?: (sessionId: string, data: string) => void;
    wsConnected?: boolean;
    onRawOutputUpdate?: (rawOutput: string) => void;
}
export declare function useSessionManager({ activeSession, setActiveSession, subscribeWithRetry, sendInput, wsConnected, onRawOutputUpdate, }: UseSessionManagerOptions): {
    handleSessionClick: any;
    handleSendInput: any;
    handleKillSession: any;
};
export {};
//# sourceMappingURL=use-session-manager.d.ts.map