import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTerminalStore } from '../../stores/terminalStore';
import './dashboard.css';
import { apiClient } from '../../api/client';

interface Metric {
    timestamp: number;
    latency: number;
    executed: number;
}

export const Dashboard: React.FC = () => {
    const [activeAddress, setActiveAddress] = useState('');
    const [metrics, setMetrics] = useState<Metric[]>([]);
    const [stats, setStats] = useState({
        totalCommands: 0,
        successRate: 0,
        avgLatency: 0,
    });

    const { history, outputs } = useTerminalStore();

    useEffect(() => {
        loadEnvironment();
    }, []);

    useEffect(() => {
        calculateStats();
    }, [history, outputs]);

    const loadEnvironment = async () => {
        try {
            const result = await apiClient.getActiveAddress();
            setActiveAddress(result);
        } catch (error) {
            console.error('Failed to get active address:', error);
        }
    };

    const calculateStats = () => {
        const totalCommands = history.length;
        const successCount = outputs.filter(o => o.exit_code === 0).length;
        const avgLatency = outputs.length > 0
            ? outputs.reduce((sum, o) => sum + o.duration_ms, 0) / outputs.length
            : 0;

        setStats({
            totalCommands,
            successRate: totalCommands > 0 ? (successCount / totalCommands) * 100 : 0,
            avgLatency: Math.round(avgLatency),
        });

        // Update metrics for chart (mocking time series for now based on outputs)
        const newMetrics = outputs.map((o, idx) => ({
            timestamp: idx,
            latency: o.duration_ms,
            executed: 1
        }));
        setMetrics(newMetrics);
    };

    return (
        <div className="dashboard">
            <div className="stats-grid">
                <div className="stat-card">
                    <h3>Active Address</h3>
                    <p className="stat-value" title={activeAddress}>{activeAddress ? `${activeAddress.slice(0, 6)}...${activeAddress.slice(-4)}` : 'Loading...'}</p>
                </div>

                <div className="stat-card">
                    <h3>Total Commands</h3>
                    <p className="stat-value">{stats.totalCommands}</p>
                </div>

                <div className="stat-card">
                    <h3>Success Rate</h3>
                    <p className="stat-value">{stats.successRate.toFixed(1)}%</p>
                </div>

                <div className="stat-card">
                    <h3>Avg Latency</h3>
                    <p className="stat-value">{stats.avgLatency}ms</p>
                </div>
            </div>

            {/* Performance chart */}
            <div className="chart-container">
                <h3>Performance Metrics</h3>
                <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={metrics}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#3e3e42" />
                            <XAxis dataKey="timestamp" stroke="#858585" />
                            <YAxis stroke="#858585" />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#252526', border: '1px solid #3e3e42', color: '#eaeaea' }}
                            />
                            <Line type="monotone" dataKey="latency" stroke="#8884d8" dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Command history */}
            <div className="history-container">
                <h3>Command History</h3>
                <ul className="history-list">
                    {history.slice(-10).reverse().map((cmd, idx) => (
                        <li key={idx} className="history-item">
                            <code>{cmd}</code>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};
