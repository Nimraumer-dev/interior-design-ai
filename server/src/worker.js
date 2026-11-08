const mongoose = require('mongoose');
const { getConfig } = require('./config');
const models = require('./models');
const {
  processOneDesign,
  processOneOutboxItem,
  releaseExhaustedJobs
} = require('./services/generation');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runWorker() {
  const config = getConfig();
  await mongoose.connect(config.mongoUri);
  await Promise.all(Object.values(models).map((Model) => Model.init()));
  console.log(`Design worker started (${config.aiMock ? 'mock AI' : 'real AI'}).`);
  let stopping = false;
  const shutdown = async () => {
    stopping = true;
  };
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
  while (!stopping) {
    try {
      await releaseExhaustedJobs();
      const didWork = await processOneDesign();
      const didCleanup = await processOneOutboxItem();
      if (!didWork && !didCleanup) await sleep(1000);
    } catch (error) {
      console.error('Worker loop error:', error.message);
      await sleep(2000);
    }
  }
  await mongoose.disconnect();
}

if (require.main === module) {
  runWorker().catch((error) => {
    console.error('Worker startup failed:', error.message);
    process.exitCode = 1;
  });
}

module.exports = { runWorker };
