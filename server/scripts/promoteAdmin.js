require('dotenv').config();
const mongoose = require('mongoose');
const { getConfig } = require('../src/config');
const { User } = require('../src/models');

async function promoteAdmin(email) {
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Pass the existing account email as the first command-line argument.');
  }
  const config = getConfig();
  await mongoose.connect(config.mongoUri);
  const user = await User.findOneAndUpdate(
    { email: email.toLowerCase() },
    { $set: { role: 'admin' } },
    { new: true }
  );
  if (!user) throw new Error('No account exists for the supplied email.');
  console.log(`Promoted ${user.email} to admin.`);
  await mongoose.disconnect();
}

if (require.main === module) {
  promoteAdmin(process.argv[2]).catch(async (error) => {
    console.error('Admin promotion failed:', error.message);
    await mongoose.disconnect();
    process.exitCode = 1;
  });
}

module.exports = { promoteAdmin };
