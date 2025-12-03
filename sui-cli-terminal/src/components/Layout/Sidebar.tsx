import React from 'react';
import { FiTerminal, FiActivity, FiSettings, FiKey } from 'react-icons/fi';
import './sidebar.css';

interface SidebarProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
    const menuItems = [
        { id: 'terminal', icon: <FiTerminal />, label: 'Terminal' },
        { id: 'dashboard', icon: <FiActivity />, label: 'Dashboard' },
        { id: 'keys', icon: <FiKey />, label: 'Keys' },
        { id: 'settings', icon: <FiSettings />, label: 'Settings' },
    ];

    return (
        <div className="sidebar">
            <div className="sidebar-logo">
                Sui CLI
            </div>
            <nav className="sidebar-nav">
                {menuItems.map((item) => (
                    <button
                        key={item.id}
                        className={`sidebar-item ${activeTab === item.id ? 'active' : ''}`}
                        onClick={() => onTabChange(item.id)}
                        title={item.label}
                    >
                        {item.icon}
                    </button>
                ))}
            </nav>
        </div>
    );
};
