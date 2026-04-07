import React from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { SerializeAddon } from '@xterm/addon-serialize';
export class RawTerminal extends React.Component {
    terminalRef = React.createRef();
    xtermInstance = null;
    fitAddon = null;
    serializeAddon = null;
    componentDidMount() {
        this.initializeTerminal();
        if (this.xtermInstance && this.props.rawOutput) {
            this.xtermInstance.write(this.props.rawOutput);
        }
    }
    componentDidUpdate(prevProps) {
        if (!this.xtermInstance)
            return;
        const currentData = this.props.rawOutput;
        const prevData = prevProps.rawOutput;
        // Optimized diff-based writing - only write new content
        if (currentData.startsWith(prevData)) {
            const newData = currentData.slice(prevData.length);
            if (newData) {
                this.xtermInstance.write(newData);
            }
        }
        else {
            // Session switch/truncate/etc - clear and rewrite
            this.xtermInstance.clear();
            this.xtermInstance.write(currentData);
        }
    }
    componentWillUnmount() {
        if (this.xtermInstance) {
            this.xtermInstance.dispose();
        }
    }
    initializeTerminal() {
        const term = new Terminal({
            cursorBlink: true,
            theme: { background: '#1e1e1e', foreground: '#d4d4d4' },
            fontFamily: 'monospace',
            fontSize: 14,
            scrollback: 5000,
            convertEol: true,
            allowTransparency: true,
        });
        this.fitAddon = new FitAddon();
        this.serializeAddon = new SerializeAddon();
        term.loadAddon(this.fitAddon);
        term.loadAddon(this.serializeAddon);
        if (this.terminalRef.current) {
            term.open(this.terminalRef.current);
            this.fitAddon.fit();
        }
        this.xtermInstance = term;
        // CRITICAL: Expose terminal and serialize addon for E2E testing
        window.xtermTerminal = term;
        window.xtermSerializeAddon = this.serializeAddon;
        // Set up input handling
        this.setupInputHandling(term);
    }
    setupInputHandling(term) {
        const { onSendInput, onInterrupt, disabled } = this.props;
        if (disabled)
            return;
        const handleData = (data) => {
            if (data === '\u0003') {
                // Ctrl+C
                onInterrupt?.();
            }
            else {
                // Send input to PTY server (PTY will echo back for interactive sessions)
                onSendInput?.(data);
            }
        };
        term.onData(handleData);
    }
    render() {
        return (<div ref={this.terminalRef} className="xterm" style={{ width: '100%', height: '100%' }}/>);
    }
}
//# sourceMappingURL=terminal-renderer.js.map