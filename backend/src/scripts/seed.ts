import 'dotenv/config';
import mongoose from 'mongoose';
import { SEED_USERS, seedUsers } from '../utils/seedUsers';

const seed = async (): Promise<void> => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI not set in .env (this standalone seed needs a real DB).');
    console.error('   For local testing without a DB, just run: npm run dev');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('✅ Connected to MongoDB');

  const { created, skipped } = await seedUsers();

  console.log(`\n📊 Seed complete: ${created} created, ${skipped} skipped`);
  console.log('\nTest credentials:');
  console.table(
    SEED_USERS.map((u) => ({ username: u.username, password: u.password, role: u.role }))
  );

  await mongoose.disconnect();
  process.exit(0);
};

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
