const mongoose = require('mongoose');
const { getConfig } = require('./config');
const models = require('./models');
const { createApp } = require('./app');

async function startServer() {
  const config = getConfig();
  await mongoose.connect(config.mongoUri);
  await Promise.all(Object.values(models).map((Model) => Model.init()));
  const server = createApp().listen(config.port, '0.0.0.0', () => {
    console.log(`API listening on 0.0.0.0:${config.port} (${config.nodeEnv})`);
  });
  const shutdown = async () => {
    server.close(async () => {
      await mongoose.disconnect();
      process.exit(0);
    });
  };
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
  return server;
}

if (require.main === module) {
  startServer().catch((error) => {
    console.error('API startup failed:', error.message);
    process.exitCode = 1;
  });
}

module.exports = { startServer };
