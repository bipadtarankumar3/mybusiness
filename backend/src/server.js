'use strict';

const http = require('http');
const { Server: SocketIOServer } = require('socket.io');
const { getEnv } = require('./config/env');
const models = require('./models');
const app = require('./app');
const { COOKIE_NAME, verifySessionToken } = require('./middleware/auth');
const { setSocketServer } = require('./utils/realtime');
const { seedAll } = require('./seeders/runSeed');

function parseCookieHeader(cookieHeader = '') {
  const out = {};
  for (const part of String(cookieHeader).split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const k = part.slice(0, idx).trim();
    const v = decodeURIComponent(part.slice(idx + 1).trim());
    out[k] = v;
  }
  return out;
}

async function startServer() {
  const env = getEnv();
  await models.sequelize.authenticate();

  if (!env.isProduction) {
    const planCount = await models.Plan.count().catch(() => 0);
    if (planCount === 0) {
      // eslint-disable-next-line no-console
      console.log('[ChatFlow] Database has no plans yet; running initial seed...');
      await seedAll(models);
    }
  }

  const server = http.createServer(app);
  const io = new SocketIOServer(server, {
    cors: {
      origin: env.frontendOrigins,
      credentials: true,
    },
  });

  io.use((socket, next) => {
    try {
      const cookies = parseCookieHeader(socket.handshake.headers.cookie);
      const token = cookies[COOKIE_NAME] || socket.handshake.auth?.token;
      if (!token) return next(new Error('UNAUTHENTICATED'));
      const payload = verifySessionToken(token);
      socket.data.userId = payload.sub;
      socket.data.businessId = payload.bid;
      return next();
    } catch (_err) {
      return next(new Error('UNAUTHENTICATED'));
    }
  });

  io.on('connection', (socket) => {
    if (socket.data.businessId) {
      socket.join(`business:${socket.data.businessId}`);
    }
  });

  setSocketServer(io);

  server.listen(env.PORT, () => {
    // eslint-disable-next-line no-console
    console.log(
      `[ChatFlow API] Listening on http://localhost:${env.PORT}/api/v1 (env=${env.NODE_ENV}, whatsapp=${
        env.whatsappConfigured ? 'configured' : 'demo'
      }, ai=${env.aiConfigured ? 'configured' : 'demo'})`
    );
  });

  return server;
}

if (require.main === module) {
  startServer().catch((err) => {
    // eslint-disable-next-line no-console
    console.error('[ChatFlow API] Failed to start server:', err);
    process.exit(1);
  });
}

module.exports = { startServer };
