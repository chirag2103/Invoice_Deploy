/**
 * Promote a user to the "admin" role by email.
 *
 *   node scripts/makeAdmin.js user@example.com
 */
import mongoose from 'mongoose';
import config from '../config/index.js';
import User from '../models/userModel.js';

const run = async () => {
  const email = process.argv[2];
  if (!email) {
    // eslint-disable-next-line no-console
    console.error('Usage: node scripts/makeAdmin.js <email>');
    process.exit(1);
  }

  await mongoose.connect(config.MONGOURI);

  const user = await User.findOneAndUpdate(
    { email },
    { role: 'admin' },
    { new: true }
  );

  if (!user) {
    // eslint-disable-next-line no-console
    console.error(`No user found with email: ${email}`);
    await mongoose.disconnect();
    process.exit(1);
  }

  // eslint-disable-next-line no-console
  console.log(`${user.email} is now an admin.`);
  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
