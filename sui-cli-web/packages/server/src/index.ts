import Fastify from 'fastify';
import cors from '@fastify/cors';
import { addressRoutes } from './routes/address';
import { environmentRoutes } from './routes/environment';
import { faucetRoutes } from './routes/faucet';
import { SuiCliExecutor } from './cli/SuiCliExecutor';

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

  // Register CORS - allow the hosted UI domains and localhost
  await fastify.register(cors, {
    origin: [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:3000',
      // Deployed UI domains - update with your actual domain
      /https:\/\/.*\.vercel\.app$/,
      /https:\/\/.*\.netlify\.app$/,
      /https:\/\/sui-cli.*\.vercel\.app$/,
      // Allow all in development
      true,
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  // Health check endpoint
  fastify.get('/api/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // Sui CLI status endpoint
  fastify.get('/api/status', async () => {
    const executor = SuiCliExecutor.getInstance();
    const installation = await executor.checkInstallation();
    return {
      suiInstalled: installation.installed,
      suiVersion: installation.version,
      timestamp: new Date().toISOString(),
    };
  });

  // Register routes
  await fastify.register(addressRoutes, { prefix: '/api' });
  await fastify.register(environmentRoutes, { prefix: '/api' });
  await fastify.register(faucetRoutes, { prefix: '/api' });

  // Start server
  try {
    await fastify.listen({ port: PORT, host: HOST });
    console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   🚀 Sui CLI Web - Local Server                               ║
║                                                               ║
║   Server: http://localhost:${PORT}                             ║
║                                                               ║
║   Now open the web UI:                                        ║
║   → https://sui-cli-web.vercel.app                            ║
║                                                               ║
║   The UI will connect to this local server automatically.     ║
║   Keep this terminal open while using the app.                ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
    `);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

main();
