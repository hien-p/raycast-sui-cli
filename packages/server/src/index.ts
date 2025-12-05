import Fastify from 'fastify';
import cors from '@fastify/cors';
import { addressRoutes } from './routes/address';
import { environmentRoutes } from './routes/environment';
import { faucetRoutes } from './routes/faucet';
import { communityRoutes } from './routes/community';
import { transferRoutes } from './routes/transfer';
import { keyManagementRoutes } from './routes/key-management';
import { moveRoutes } from './routes/move';
import { packageRoutes } from './routes/package';
import { inspectorRoutes } from './routes/inspector';
import { filesystemRoutes } from './routes/filesystem';
import { SuiCliExecutor } from './cli/SuiCliExecutor';
import { createRateLimitHook } from './utils/rateLimiter';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pkg = require('../package.json');
const CURRENT_VERSION = pkg.version;
const PACKAGE_NAME = pkg.name;

const PORT = parseInt(process.env.PORT || '3001', 10);
const HOST = process.env.HOST || '0.0.0.0';

// Check for updates from npm registry
async function checkForUpdates(): Promise<{ hasUpdate: boolean; latestVersion: string | null }> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000); // 5s timeout

    const response = await fetch(`https://registry.npmjs.org/${PACKAGE_NAME}/latest`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) return { hasUpdate: false, latestVersion: null };

    const data = (await response.json()) as { version: string };
    const latestVersion = data.version;

    // Compare versions (simple semver comparison)
    const current = CURRENT_VERSION.split('.').map(Number);
    const latest = latestVersion.split('.').map(Number);

    for (let i = 0; i < 3; i++) {
      if (latest[i] > current[i]) {
        return { hasUpdate: true, latestVersion };
      }
      if (latest[i] < current[i]) {
        return { hasUpdate: false, latestVersion };
      }
    }

    return { hasUpdate: false, latestVersion };
  } catch {
    // Network error or timeout - silently ignore
    return { hasUpdate: false, latestVersion: null };
  }
}

// ANSI color codes for terminal
const colors = {
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  reset: '\x1b[0m',
  bgRed: '\x1b[41m',
  bgYellow: '\x1b[43m',
};

function printUpdateWarning(latestVersion: string) {
  const c = colors;
  console.log(`
${c.bgRed}${c.white}${c.bold}                                                                 ${c.reset}
${c.bgRed}${c.white}${c.bold}   🚨🚨🚨  NEW VERSION AVAILABLE - PLEASE UPDATE  🚨🚨🚨          ${c.reset}
${c.bgRed}${c.white}${c.bold}                                                                 ${c.reset}

${c.red}${c.bold}   ╔═══════════════════════════════════════════════════════════╗${c.reset}
${c.red}${c.bold}   ║                                                           ║${c.reset}
${c.red}${c.bold}   ║   ${c.yellow}⚠️  YOUR VERSION IS OUTDATED!${c.red}                           ║${c.reset}
${c.red}${c.bold}   ║                                                           ║${c.reset}
${c.red}${c.bold}   ║   ${c.white}Current: ${c.red}${CURRENT_VERSION.padEnd(12)}${c.white} ❌ OLD${c.red}                        ║${c.reset}
${c.red}${c.bold}   ║   ${c.white}Latest:  ${c.green}${latestVersion.padEnd(12)}${c.white} ✅ NEW${c.red}                        ║${c.reset}
${c.red}${c.bold}   ║                                                           ║${c.reset}
${c.red}${c.bold}   ║   ${c.yellow}Update now to get bug fixes & new features:${c.red}             ║${c.reset}
${c.red}${c.bold}   ║                                                           ║${c.reset}
${c.red}${c.bold}   ║   ${c.cyan}npm install -g ${PACKAGE_NAME}${c.red}               ║${c.reset}
${c.red}${c.bold}   ║                                                           ║${c.reset}
${c.red}${c.bold}   ║   ${c.dim}Or always use latest with npx:${c.red}                        ║${c.reset}
${c.red}${c.bold}   ║   ${c.cyan}npx ${PACKAGE_NAME}@latest${c.red}                   ║${c.reset}
${c.red}${c.bold}   ║                                                           ║${c.reset}
${c.red}${c.bold}   ╚═══════════════════════════════════════════════════════════╝${c.reset}

${c.yellow}${c.bold}   ⚡ Continuing with outdated version... Consider updating soon!${c.reset}
  `);
}

async function main() {
  const fastify = Fastify({
    logger: {
      level: 'info',
      transport: {
        target: 'pino-pretty',
        options: {
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      },
    },
  });

  // Register CORS - allow localhost and deployed UI domains only
  // Security: Only allow specific Vercel deployments, not all *.vercel.app
  await fastify.register(cors, {
    origin: [
      // Local development (allow any localhost port)
      /^http:\/\/localhost:\d+$/,
      /^http:\/\/127\.0\.0\.1:\d+$/,
      // Production domains
      'https://www.harriweb3.dev',
      'https://harriweb3.dev',
      // Specific Vercel preview deployments (project-specific patterns only)
      /^https:\/\/raycast-sui-cli-[a-z0-9]+-[a-z0-9]+\.vercel\.app$/,
      /^https:\/\/sui-cli-web-[a-z0-9]+-[a-z0-9]+\.vercel\.app$/,
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  // Rate limiting hooks
  const readRateLimit = createRateLimitHook('read');
  const writeRateLimit = createRateLimitHook('write');
  const faucetRateLimit = createRateLimitHook('faucet');

  // Health check endpoint (no rate limit)
  fastify.get('/api/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // Sui CLI status endpoint (read rate limit)
  fastify.get('/api/status', { preHandler: readRateLimit }, async () => {
    const executor = SuiCliExecutor.getInstance();
    const installation = await executor.checkInstallation();
    return {
      suiInstalled: installation.installed,
      suiVersion: installation.version,
      timestamp: new Date().toISOString(),
    };
  });

  // Register routes with rate limiting
  // Address routes - mixed read/write
  await fastify.register(
    async (instance) => {
      // Read endpoints
      instance.addHook('onRequest', async (request, reply) => {
        if (request.method === 'GET') {
          await readRateLimit(request, reply);
        } else {
          await writeRateLimit(request, reply);
        }
      });
      await instance.register(addressRoutes);
    },
    { prefix: '/api' }
  );

  // Environment routes - write operations
  await fastify.register(
    async (instance) => {
      instance.addHook('onRequest', async (request, reply) => {
        if (request.method === 'GET') {
          await readRateLimit(request, reply);
        } else {
          await writeRateLimit(request, reply);
        }
      });
      await instance.register(environmentRoutes);
    },
    { prefix: '/api' }
  );

  // Faucet routes - strict rate limit
  await fastify.register(
    async (instance) => {
      instance.addHook('onRequest', faucetRateLimit);
      await instance.register(faucetRoutes);
    },
    { prefix: '/api' }
  );

  // Community routes - mixed read/write
  await fastify.register(
    async (instance) => {
      instance.addHook('onRequest', async (request, reply) => {
        if (request.method === 'GET') {
          await readRateLimit(request, reply);
        } else {
          await writeRateLimit(request, reply);
        }
      });
      await instance.register(communityRoutes);
    },
    { prefix: '/api' }
  );

  // Transfer routes - write operations (sensitive)
  await fastify.register(
    async (instance) => {
      instance.addHook('onRequest', writeRateLimit);
      await instance.register(transferRoutes);
    },
    { prefix: '/api' }
  );

  // Key management routes - highly sensitive operations
  await fastify.register(
    async (instance) => {
      // Use write rate limit for all key operations
      instance.addHook('onRequest', async (request, reply) => {
        // More strict rate limiting for export operations
        if (request.url.includes('/export') && request.method === 'POST') {
          // Export uses its own rate limiting in the service layer
          await writeRateLimit(request, reply);
        } else {
          await writeRateLimit(request, reply);
        }
      });
      await instance.register(keyManagementRoutes);
    },
    { prefix: '/api' }
  );

  // Move routes - development operations
  await fastify.register(
    async (instance) => {
      instance.addHook('onRequest', writeRateLimit);
      await instance.register(moveRoutes);
    },
    { prefix: '/api' }
  );

  // Package routes - publish/upgrade operations (sensitive)
  await fastify.register(
    async (instance) => {
      instance.addHook('onRequest', writeRateLimit);
      await instance.register(packageRoutes);
    },
    { prefix: '/api' }
  );

  // Inspector routes - read operations (inspection, replay)
  await fastify.register(
    async (instance) => {
      instance.addHook('onRequest', readRateLimit);
      await instance.register(inspectorRoutes);
    },
    { prefix: '/api' }
  );

  // Filesystem routes - directory browsing (read operations)
  await fastify.register(
    async (instance) => {
      instance.addHook('onRequest', readRateLimit);
      await instance.register(filesystemRoutes);
    },
    { prefix: '/api' }
  );

  // Start server
  try {
    await fastify.listen({ port: PORT, host: HOST });

    // Check for updates in background (don't block server startup)
    checkForUpdates().then(({ hasUpdate, latestVersion }) => {
      if (hasUpdate && latestVersion) {
        printUpdateWarning(latestVersion);
      }
    });

    console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   🚀 Sui CLI Web - Local Server v${CURRENT_VERSION.padEnd(27)}║
║                                                               ║
║   Server running at: http://localhost:${PORT}                  ║
║                                                               ║
║   Now open the web UI:                                        ║
║   → https://www.harriweb3.dev                                 ║
║                                                               ║
║   The UI will connect to this local server automatically.     ║
║   Keep this terminal open while using the app.                ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
    `);
  } catch (err: any) {
    if (err.code === 'EADDRINUSE') {
      console.error(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   ❌ ERROR: Port ${PORT} is already in use                       ║
║                                                               ║
║   Another server is running on this port.                     ║
║                                                               ║
║   To fix this, run one of these commands:                     ║
║                                                               ║
║   MacOS/Linux:                                                ║
║   → lsof -ti:${PORT} | xargs kill -9                             ║
║                                                               ║
║   Or change the port:                                         ║
║   → PORT=3002 sui-cli-web                                     ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
      `);
    } else {
      fastify.log.error(err);
    }
    process.exit(1);
  }
}

main();
