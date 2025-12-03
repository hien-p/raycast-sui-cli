import React from 'react';
import { FiSearch } from 'react-icons/fi';
import './commandbar.css';

interface CommandBarProps {
    onSearch?: (query: string) => void;
}

export const CommandBar: React.FC<CommandBarProps> = ({ onSearch }) => {
    return (
        <div className="command-bar">
            <div className="command-input-wrapper">
                <FiSearch color="var(--text-tertiary)" size={16} />
                <input
                    type="text"
                    className="command-input"
                    placeholder="Search..."
                    onChange={(e) => onSearch?.(e.target.value)}
                    autoFocus
                />
            </div>
        </div>
    );
};
