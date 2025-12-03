import { useState } from "react";
import "./App.css";
import { CommandBar } from "./components/Layout/CommandBar";
import { Terminal } from "./components/Terminal/Terminal";
import { Dashboard } from "./components/Dashboard/Dashboard";
import {
  FiTerminal, FiActivity, FiSettings, FiKey, FiBox, FiPlay,
  FiLayers, FiSearch, FiList, FiDisc, FiDroplet, FiHardDrive, FiGlobe
} from 'react-icons/fi';

function App() {
  const [activeView, setActiveView] = useState("terminal");
  const [searchQuery, setSearchQuery] = useState("");

  const sections = [
    {
      title: "Essentials",
      items: [
        { id: 'terminal', icon: <FiTerminal />, label: 'Terminal', description: 'Execute Sui and Walrus commands' },
        { id: 'dashboard', icon: <FiActivity />, label: 'Dashboard', description: 'View performance metrics' },
      ]
    },
    {
      title: "Keys & Security",
      items: [
        { id: 'keys', icon: <FiKey />, label: 'Key Manager', description: 'List, Generate, Import, Export Keys' },
      ]
    },
    {
      title: "Move Development",
      items: [
        { id: 'packages', icon: <FiBox />, label: 'Package Manager', description: 'Build, Test, Publish Move Packages' },
      ]
    },
    {
      title: "Transactions",
      items: [
        { id: 'call', icon: <FiPlay />, label: 'Call Function', description: 'Execute any Move function' },
        { id: 'ptb', icon: <FiLayers />, label: 'PTB Builder', description: 'Build and execute programmable transaction blocks' },
        { id: 'inspect', icon: <FiSearch />, label: 'Inspect Transaction', description: 'View transaction details by digest' },
      ]
    },
    {
      title: "Objects & Assets",
      items: [
        { id: 'objects', icon: <FiList />, label: 'My Objects', description: 'Browse owned objects' },
        { id: 'gas', icon: <FiDisc />, label: 'Gas Coins', description: 'View, Split, Merge Gas' },
        { id: 'faucet', icon: <FiDroplet />, label: 'Request Tokens', description: 'Request tokens from faucet' },
      ]
    },
    {
      title: "Storage",
      items: [
        { id: 'walrus', icon: <FiHardDrive />, label: 'Walrus Storage', description: 'Store and retrieve blobs' },
      ]
    },
    {
      title: "Configuration",
      items: [
        { id: 'env', icon: <FiGlobe />, label: 'Environment', description: 'Switch Network (Mainnet, Testnet, Devnet)' },
        { id: 'settings', icon: <FiSettings />, label: 'Settings', description: 'Configure application preferences' },
      ]
    }
  ];

  const filterItems = () => {
    if (!searchQuery) return sections;
    return sections.map(section => ({
      ...section,
      items: section.items.filter(item =>
        item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    })).filter(section => section.items.length > 0);
  };

  const filteredSections = filterItems();

  return (
    <div className="app-container split-view">
      <div className="sidebar-pane">
        <CommandBar onSearch={setSearchQuery} />
        <div className="root-list">
          {filteredSections.map((section) => (
            <div key={section.title} className="list-section">
              <div className="section-title">{section.title}</div>
              {section.items.map((item) => (
                <div
                  key={item.id}
                  className={`root-item ${activeView === item.id ? 'selected' : ''}`}
                  onClick={() => setActiveView(item.id)}
                >
                  <div className="root-item-icon">{item.icon}</div>
                  <div className="root-item-content">
                    <div className="root-item-title">{item.label}</div>
                    {/* Hide description in sidebar to save space, or keep it? Raycast keeps it. */}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="footer-bar">
          <div className="footer-item">
            <span className="footer-key">↵</span>
            <span className="footer-label">Open</span>
          </div>
          <div className="footer-item">
            <span className="footer-key">⌘K</span>
            <span className="footer-label">Actions</span>
          </div>
        </div>
      </div>

      <main className="content-pane">
        {activeView === "terminal" && <Terminal />}
        {activeView === "dashboard" && <Dashboard />}
        {!["terminal", "dashboard"].includes(activeView) && (
          <div className="placeholder-view">
            <div className="placeholder-icon">{sections.flatMap(s => s.items).find(i => i.id === activeView)?.icon}</div>
            <h2>{sections.flatMap(s => s.items).find(i => i.id === activeView)?.label}</h2>
            <p>Coming Soon</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
