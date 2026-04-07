import { useState, useEffect, useRef } from 'react';
import { RETRY_DELAY, SKIP_AUTOSELECT_KEY } from '../../shared/constants.ts';
export function useWebSocket({ activeSession, onRawData, onSessionList, onSessionUpdate, }) {
    const [connected, setConnected] = useState(false);
    const wsRef = useRef(null);
    const activeSessionRef = useRef(null);
    // Keep ref in sync with activeSession
    useEffect(() => {
        activeSessionRef.current = activeSession;
    }, [activeSession]);
    // Connect to WebSocket on mount
    useEffect(() => {
        const wsUrl = `ws://${location.host}/ws`;
        const ws = new WebSocket(wsUrl);
        ws.onopen = () => {
            setConnected(true);
            // Request initial session list
            ws.send(JSON.stringify({ type: 'session_list' }));
            // Resubscribe to active session if exists
            if (activeSessionRef.current) {
                ws.send(JSON.stringify({ type: 'subscribe', sessionId: activeSessionRef.current.id }));
            }
        };
        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'session_list') {
                    const sessionListMsg = data;
                    const sessions = sessionListMsg.sessions || [];
                    // Auto-select first running session if none selected (skip in tests that need empty state)
                    const shouldSkipAutoselect = localStorage.getItem(SKIP_AUTOSELECT_KEY) === 'true';
                    let autoSelected = null;
                    if (sessions.length > 0 && !activeSession && !shouldSkipAutoselect) {
                        const runningSession = sessions.find((s) => s.status === 'running') || null;
                        autoSelected = runningSession || sessions[0] || null;
                        if (autoSelected) {
                            activeSessionRef.current = autoSelected;
                            // Subscribe to the auto-selected session for live updates
                            const readyState = wsRef.current?.readyState;
                            if (readyState === WebSocket.OPEN && wsRef.current) {
                                wsRef.current.send(JSON.stringify({ type: 'subscribe', sessionId: autoSelected.id }));
                            }
                            else {
                                setTimeout((autoSelected) => {
                                    const retryReadyState = wsRef.current?.readyState;
                                    if (retryReadyState === WebSocket.OPEN && wsRef.current) {
                                        wsRef.current.send(JSON.stringify({ type: 'subscribe', sessionId: autoSelected.id }));
                                    }
                                }, RETRY_DELAY, autoSelected);
                            }
                        }
                    }
                    onSessionList(sessions, autoSelected);
                }
                else if (data.type === 'session_update') {
                    const sessionUpdateMsg = data;
                    onSessionUpdate?.(sessionUpdateMsg.session);
                }
                else if (data.type === 'raw_data') {
                    const rawDataMsg = data;
                    const isForActiveSession = rawDataMsg.session.id === activeSessionRef.current?.id;
                    if (isForActiveSession) {
                        onRawData?.(rawDataMsg.rawData);
                    }
                }
                // eslint-disable-next-line no-empty
            }
            catch { }
        };
        ws.onclose = () => {
            setConnected(false);
        };
        ws.onerror = () => { };
        wsRef.current = ws;
        return () => {
            ws.close();
        };
    }, [activeSession, onRawData, onSessionList, onSessionUpdate]);
    const subscribe = (sessionId) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'subscribe', sessionId }));
        }
    };
    const subscribeWithRetry = (sessionId) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            subscribe(sessionId);
        }
        else {
            setTimeout(() => {
                subscribe(sessionId);
            }, RETRY_DELAY);
        }
    };
    const sendInput = (sessionId, data) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'input', sessionId, data }));
        }
    };
    return { connected, subscribe, subscribeWithRetry, sendInput };
}
//# sourceMappingURL=use-web-socket.js.map