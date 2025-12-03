import React, { useEffect, useRef, useState } from 'react';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';
import './terminal.css';
import { useTerminalStore } from '../../stores/terminalStore';
import { TerminalInput } from './TerminalInput';
import { apiClient } from '../../api/client';

export const Terminal: React.FC = () => {
    const terminalRef = useRef<HTMLDivElement>(null);
    const xtermRef = useRef<XTerm | null>(null);
    const fitAddonRef = useRef<FitAddon | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const { addOutput, addToHistory } = useTerminalStore();

    useEffect(() => {
        if (!terminalRef.current) return;

        // Initialize xterm
        const xterm = new XTerm({
            theme: {
                background: '#1e1e1e',
                foreground: '#d4d4d4',
                cursor: '#aeafad',
                cursorAccent: '#000000',
                selectionBackground: 'rgba(255, 255, 255, 0.15)',
                red: '#f48771',
                green: '#13ce66',
                yellow: '#ffc43a',
                blue: '#4b8bef',
                magenta: '#b299d6',
                cyan: '#67d5ff',
                white: '#eaeaea',
            },
            fontFamily: "'Fira Code', 'Courier New', monospace",
            fontSize: 14,
            lineHeight: 1.5,
            cursorBlink: true,
            disableStdin: true, // Read-only, input handled by React
        });

        const fitAddon = new FitAddon();
        xterm.loadAddon(fitAddon);

        xterm.open(terminalRef.current);
        fitAddon.fit();

        xtermRef.current = xterm;
        fitAddonRef.current = fitAddon;

        // Welcome message
        xterm.writeln('\x1b[32m╔════════════════════════════════════════════════════════════╗\x1b[0m');
        xterm.writeln('\x1b[32m║          Sui CLI Terminal - Web-Based Local Executor        ║\x1b[0m');
        xterm.writeln('\x1b[32m╚════════════════════════════════════════════════════════════╝\x1b[0m');
        xterm.writeln('');

        // Handle resize
        const handleResize = () => fitAddon.fit();
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            xterm.dispose();
        };
    }, []);

    const handleExecute = async (command: string) => {
        if (!xtermRef.current) return;
        const xterm = xtermRef.current;

        setIsLoading(true);
        addToHistory(command);

        xterm.writeln(`\x1b[36msui >\x1b[0m ${command}`);

        try {
            const parts = command.trim().split(/\s+/);
            const cmd = parts[0];
            const args = parts.slice(1);

            let result: any;

            if (cmd === 'sui') {
                const execArgs = args;
                result = await apiClient.executeSuiCommand(execArgs);
            } else if (cmd === 'walrus') {
                if (args[0] === 'list') {
                    result = await apiClient.walrus.list();
                } else if (args[0] === 'store') {
                    result = await apiClient.walrus.store(args[1], args[3] ? parseInt(args[3]) : undefined);
                } else if (args[0] === 'read') {
                    result = await apiClient.walrus.read(args[1], args[3]);
                } else {
                    xterm.writeln(`\x1b[31mUnknown walrus command: ${args[0]}\x1b[0m`);
                    setIsLoading(false);
                    return;
                }
            } else {
                // Default to sui command
                result = await apiClient.executeSuiCommand(parts);
            }

            // Display output
            if (result.stdout) {
                // Handle newlines properly
                const lines = result.stdout.split('\n');
                lines.forEach((line: string) => xterm.writeln(line));
            }
            if (result.stderr) {
                xterm.writeln(`\x1b[31m${result.stderr}\x1b[0m`);
            }

            xterm.writeln(`\x1b[90m(${result.duration_ms}ms)\x1b[0m`);

            addOutput(result);

        } catch (error) {
            xterm.writeln(`\x1b[31mError: ${error}\x1b[0m`);
        } finally {
            xterm.writeln('');
            setIsLoading(false);
        }
    };

    return (
        <div className="terminal-container">
            <div ref={terminalRef} className="xterm-container" />
            <TerminalInput onExecute={handleExecute} />
            {isLoading && <div className="terminal-loader">⌛ Executing...</div>}
        </div>
    );
};
