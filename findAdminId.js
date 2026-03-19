// findAdminId.js
require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');
const User = require('./src/app/server/models/User').default;
const { connectDB } = require('./src/app/server/db/connect');

async function main() {
  await connectDB();
  const admin = await User.findOne({ email: 'admin@kiddiescheck.org' });
  if (admin) {
    console.log('Admin ObjectId:', admin._id.toString());
  } else {
    console.log('Admin user not found.');
  }
  mongoose.connection.close();
}

main();
