import { useState } from 'react';
import { Kbd } from '../shared/Kbd';

interface SetupInstructionsProps {
  onRetry: () => void;
  isRetrying: boolean;
}

export function SetupInstructions({ onRetry, isRetrying }: SetupInstructionsProps) {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const CodeBlock = ({ children, id }: { children: string; id: string }) => (
    <div className="relative group">
      <pre className="bg-black/40 rounded-lg p-3 text-sm font-mono text-foreground overflow-x-auto border border-border">
        {children}
      </pre>
      <button
        onClick={() => copyToClipboard(children, id)}
        className="absolute top-2 right-2 p-1.5 rounded bg-secondary opacity-0 group-hover:opacity-100 transition-opacity"
        title="Copy to clipboard"
      >
        {copied === id ? (
          <svg className="w-4 h-4 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        )}
      </button>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Status Banner */}
      <div className="flex items-center gap-3 p-4 bg-warning/10 border border-warning/20 rounded-lg">
        <div className="flex-shrink-0">
          <svg className="w-6 h-6 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div>
          <h3 className="font-medium text-warning">Local Server Not Connected</h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            This app requires a local server to interact with your Sui CLI. If you see network errors below, the server may be experiencing connectivity issues.
          </p>
        </div>
      </div>

      {/* Prerequisites */}
      <div>
        <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-white text-xs">1</span>
          Prerequisites
        </h4>
        <div className="space-y-2 text-sm text-muted-foreground pl-7">
          <div className="flex items-start gap-2">
            <svg className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Node.js 18+ installed</span>
          </div>
          <div className="flex items-start gap-2">
            <svg className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Sui CLI installed and configured (<code className="px-1 py-0.5 bg-black/40 rounded text-xs">sui</code> command available)</span>
          </div>
        </div>

        {/* Upgrade Sui CLI */}
        <div className="mt-4 pt-4 border-t border-border/50 space-y-2">
          <p className="text-xs font-medium text-foreground">Update Sui CLI (if needed):</p>
          <p className="text-xs text-muted-foreground">If Sui CLI is already installed but outdated, upgrade to latest version:</p>
          <CodeBlock id="brew-upgrade">brew upgrade sui</CodeBlock>
          <p className="text-xs text-muted-foreground">Verify installation and check configured networks:</p>
          <CodeBlock id="sui-version">sui --version && sui client envs</CodeBlock>
          <p className="text-xs text-muted-foreground">If no networks appear, initialize Sui:</p>
          <CodeBlock id="sui-init">sui client</CodeBlock>
        </div>
      </div>

      {/* Install & Run */}
      <div>
        <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-white text-xs">2</span>
          Run the Local Server
        </h4>
        <div className="space-y-3 pl-7">
          <p className="text-sm text-muted-foreground">Install globally (recommended - one time only):</p>
          <CodeBlock id="install">npm install -g sui-cli-web-server</CodeBlock>
          <p className="text-xs text-muted-foreground mt-2">
            Or run directly with npx (may prompt for install each time):
          </p>
          <CodeBlock id="npx">npx sui-cli-web-server</CodeBlock>
          <p className="text-xs text-muted-foreground">
            Server will start on port 3001 and connect this UI to your local Sui CLI.
          </p>
        </div>
      </div>

      {/* Network Troubleshooting */}
      <div className="bg-black/40 rounded-lg p-4 border border-border space-y-4">
        <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <svg className="w-4 h-4 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
          </svg>
          Network Issues?
        </h4>

        <div className="text-sm text-muted-foreground space-y-3">
          <div className="space-y-2">
            <p className="font-medium text-foreground text-xs">If requests timeout or show "Request timed out":</p>
            <ul className="text-xs space-y-1 pl-4 text-muted-foreground">
              <li>• Check if terminal running the server is still open</li>
              <li>• Verify server is actually running: you should see output like "🚀 Sui CLI Web - Local Server"</li>
              <li>• Try restarting the server: kill the terminal and run <code className="px-1 py-0.5 bg-black/40 rounded text-xs">npx sui-cli-web-server</code> again</li>
              <li>• Check if port 3001 is in use: <code className="px-1 py-0.5 bg-black/40 rounded text-xs">lsof -i :3001</code></li>
            </ul>
          </div>

          <div className="space-y-2">
            <p className="font-medium text-foreground text-xs">If "Cannot connect to local server" appears:</p>
            <ul className="text-xs space-y-1 pl-4 text-muted-foreground">
              <li>• Ensure the server is actually running (not just installed)</li>
              <li>• Check if you're using a VPN or proxy that blocks localhost</li>
              <li>• Try accessing <code className="px-1 py-0.5 bg-black/40 rounded text-xs">http://localhost:3001/api/health</code> directly in a new tab</li>
              <li>• If nothing works, restart everything: close this tab, close the server terminal, and start fresh</li>
            </ul>
          </div>

          <div className="space-y-2">
            <p className="font-medium text-foreground text-xs">If the app loads but shows empty data:</p>
            <ul className="text-xs space-y-1 pl-4 text-muted-foreground">
              <li>• Sui CLI may not be initialized. Run: <code className="px-1 py-0.5 bg-black/40 rounded text-xs">sui client envs</code></li>
              <li>• If no networks appear, run: <code className="px-1 py-0.5 bg-black/40 rounded text-xs">sui client</code> to initialize</li>
              <li>• Check that at least one address exists: <code className="px-1 py-0.5 bg-black/40 rounded text-xs">sui client addresses</code></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Security & Trust */}
      <div className="bg-black/40 rounded-lg p-4 border border-border space-y-4">
        <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <svg className="w-4 h-4 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          Why Local Server? Security & Trust
        </h4>

        <div className="text-sm text-muted-foreground space-y-3">
          <p>
            <strong className="text-foreground">Your keys stay on YOUR machine.</strong> We don't ask you to trust us with your private keys or wallet access.
          </p>

          <div className="space-y-2">
            <p className="text-xs font-medium text-foreground">How it works:</p>
            <div className="flex items-start gap-2 text-xs">
              <span className="text-primary">1.</span>
              <span><strong>This Web UI</strong> is just a visual interface - it cannot access your keys directly</span>
            </div>
            <div className="flex items-start gap-2 text-xs">
              <span className="text-primary">2.</span>
              <span><strong>The local server</strong> runs on YOUR computer and talks to YOUR local Sui CLI</span>
            </div>
            <div className="flex items-start gap-2 text-xs">
              <span className="text-primary">3.</span>
              <span><strong>Nothing is sent to external servers</strong> - all operations happen locally</span>
            </div>
          </div>

          <div className="pt-3 border-t border-border space-y-2">
            <p className="text-xs font-medium text-foreground flex items-center gap-1">
              <svg className="w-3 h-3 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Verify before you trust:
            </p>
            <ul className="text-xs text-muted-foreground space-y-1 pl-4">
              <li>• <a href="https://github.com/hien-p/raycast-sui-cli" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Review the source code on GitHub</a></li>
              <li>• <a href="https://www.npmjs.com/package/sui-cli-web-server" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Check the npm package</a></li>
              <li>• The server only binds to localhost (127.0.0.1) - no external access</li>
              <li>• All code is open source - audit it yourself!</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Retry Button */}
      <div className="flex justify-center pt-2">
        <button
          onClick={onRetry}
          disabled={isRetrying}
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white rounded-lg transition-colors font-medium"
        >
          {isRetrying ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Connecting...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Retry Connection
            </>
          )}
        </button>
      </div>

      {/* Footer hint */}
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <span>Once the server is running, press</span>
        <Kbd>↵</Kbd>
        <span>or click retry to connect</span>
      </div>
    </div>
  );
}
