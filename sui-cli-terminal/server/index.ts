import express from 'express';
import cors from 'cors';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);
const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Helper for command execution
const executeCommand = async (command: string, args: string[]) => {
    try {
        const { stdout, stderr } = await execFileAsync(command, args);
        return {
            stdout,
            stderr,
            exit_code: 0,
            duration_ms: 0 // Simplified for now
        };
    } catch (error: any) {
        return {
            stdout: error.stdout || '',
            stderr: error.stderr || error.message,
            exit_code: error.code || 1,
            duration_ms: 0
        };
    }
};

// --- Routes ---

// Execute generic Sui command
app.post('/api/sui', async (req, res) => {
    const { args } = req.body;
    if (!Array.isArray(args)) {
        return res.status(400).json({ error: 'args must be an array' });
    }

    const start = Date.now();
    const result = await executeCommand('sui', args);
    result.duration_ms = Date.now() - start;

    res.json(result);
});

// Walrus commands
app.post('/api/walrus/list', async (req, res) => {
    const result = await executeCommand('walrus', ['list']);
    res.json(result);
});

app.post('/api/walrus/store', async (req, res) => {
    const { path, epochs } = req.body;
    const args = ['store', path];
    if (epochs) {
        args.push('--epochs', String(epochs));
    }
    const result = await executeCommand('walrus', args);
    res.json(result);
});

app.post('/api/walrus/read', async (req, res) => {
    const { blobId, outputPath } = req.body;
    const args = ['read', blobId];
    if (outputPath) {
        args.push('--out', outputPath);
    }
    const result = await executeCommand('walrus', args);
    res.json(result);
});

// System info
app.get('/api/active-address', async (req, res) => {
    const result = await executeCommand('sui', ['client', 'active-address']);
    res.send(result.stdout.trim());
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
