import React, { useState, useCallback } from 'react';
import { useTerminalStore } from '../../stores/terminalStore';
import './terminal.css';

interface TerminalInputProps {
    onExecute: (command: string) => Promise<void>;
}

export const TerminalInput: React.FC<TerminalInputProps> = ({ onExecute }) => {
    const [input, setInput] = useState('');
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [showSuggestions, setShowSuggestions] = useState(false);

    const { history } = useTerminalStore();

    const suiCommands = [
        'keytool list',
        'keytool generate',
        'keytool import',
        'keytool sign',
        'keytool export',
        'client objects',
        'client gas',
        'client balance',
        'client switch',
        'client call',
        'client publish',
        'client upgrade',
        'client ptb',
        'move build',
        'move test',
        'move prove',
        'walrus store',
        'walrus read',
        'walrus list',
    ];

    const handleInputChange = useCallback((value: string) => {
        setInput(value);

        // Filter suggestions
        if (value.trim()) {
            const filtered = suiCommands.filter(cmd =>
                cmd.toLowerCase().includes(value.toLowerCase())
            );
            setSuggestions(filtered);
            setShowSuggestions(filtered.length > 0);
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }
    }, []);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        switch (e.key) {
            case 'Enter':
                e.preventDefault();
                handleExecute();
                break;

            case 'ArrowUp':
                e.preventDefault();
                if (history.length > 0) {
                    const prevIndex = Math.min(historyIndex + 1, history.length - 1);
                    setHistoryIndex(prevIndex);
                    // history is stored in order of execution (append), so we want to go backwards
                    // history: [cmd1, cmd2, cmd3]
                    // index 0 (ArrowUp) -> cmd3 (last)
                    // index 1 -> cmd2
                    const cmd = history[history.length - 1 - prevIndex];
                    setInput(cmd || '');
                }
                break;

            case 'ArrowDown':
                e.preventDefault();
                if (historyIndex > 0) {
                    const nextIndex = historyIndex - 1;
                    setHistoryIndex(nextIndex);
                    const cmd = history[history.length - 1 - nextIndex];
                    setInput(cmd);
                } else if (historyIndex === 0) {
                    setHistoryIndex(-1);
                    setInput('');
                }
                break;

            case 'Tab':
                e.preventDefault();
                if (suggestions.length > 0) {
                    setInput(suggestions[0]);
                    setSuggestions([]);
                    setShowSuggestions(false);
                }
                break;

            case 'Escape':
                setSuggestions([]);
                setShowSuggestions(false);
                break;
        }
    };

    const handleExecute = async () => {
        if (!input.trim()) return;

        await onExecute(input);
        setInput('');
        setHistoryIndex(-1);
        setSuggestions([]);
        setShowSuggestions(false);
    };

    return (
        <div className="terminal-input-container">
            {showSuggestions && suggestions.length > 0 && (
                <div className="suggestions-dropdown">
                    {suggestions.slice(0, 5).map((cmd, idx) => (
                        <div
                            key={idx}
                            className="suggestion-item"
                            onClick={() => {
                                setInput(cmd);
                                setSuggestions([]);
                                setShowSuggestions(false);
                            }}
                        >
                            {cmd}
                        </div>
                    ))}
                </div>
            )}
            <div className="input-wrapper">
                <span className="prompt">sui &gt;</span>
                <input
                    type="text"
                    value={input}
                    onChange={(e) => handleInputChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Enter command..."
                    className="terminal-input"
                    autoFocus
                />
            </div>
        </div>
    );
};
