import React from 'react';
import { Terminal } from '@xterm/xterm';
import { SerializeAddon } from '@xterm/addon-serialize';
declare global {
    interface Window {
        xtermTerminal?: Terminal;
        xtermSerializeAddon?: SerializeAddon;
    }
}
interface RawTerminalProps {
    rawOutput: string;
    onSendInput?: (data: string) => void;
    onInterrupt?: () => void;
    disabled?: boolean;
}
export declare class RawTerminal extends React.Component<RawTerminalProps> {
    private terminalRef;
    private xtermInstance;
    private fitAddon;
    private serializeAddon;
    componentDidMount(): void;
    componentDidUpdate(prevProps: RawTerminalProps): void;
    componentWillUnmount(): void;
    private initializeTerminal;
    private setupInputHandling;
    render(): any;
}
export {};
//# sourceMappingURL=terminal-renderer.d.ts.map