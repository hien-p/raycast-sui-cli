import Fastify from 'fastify';
import cors from '@fastify/cors';
import { addressRoutes } from './routes/address';
import { environmentRoutes } from './routes/environment';
import { faucetRoutes } from './routes/faucet';
import { communityRoutes } from './routes/community';
import { SuiCliExecutor } from './cli/SuiCliExecutor';
import { createRateLimitHook } from './utils/rateLimiter';

const PORT = parseInt(process.env.PORT || '3001', 10);
const HOST = process.env.HOST || '0.0.0.0';

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
  await fastify.register(cors, {
    origin: [
      // Local development (various ports Vite might use)
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174',
      'http://127.0.0.1:5175',
      'http://127.0.0.1:3000',
      // Deployed UI domains
      'https://www.harriweb3.dev',
      'https://harriweb3.dev',
      /^https:\/\/client.*\.vercel\.app$/,
      /^https:\/\/sui-cli.*\.vercel\.app$/,
      /^https:\/\/.*\.vercel\.app$/,
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

  // Start server
  try {
    await fastify.listen({ port: PORT, host: HOST });
    console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   🚀 Sui CLI Web - Local Server                               ║
║                                                               ║
║   Server running at: http://localhost:${PORT}                  ║
║                                                               ║
║   Now open the web UI:                                        ║
║   → https://www.harriweb3.dev/                                ║
║   → https://raycast-sui-cli.vercel.app                        ║
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
