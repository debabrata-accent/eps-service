import 'dotenv/config';
import app from './app';
import { connectDB } from './config/database';
import { initCloudinary } from './config/cloudinary';
import { initFirebase } from './config/firebase';
import { seedUsers, SEED_USERS } from './utils/seedUsers';

const PORT = parseInt(process.env.PORT || '5000', 10);

const startServer = async (): Promise<void> => {
  try {
    // Connect DB (falls back to in-memory Mongo locally when MONGODB_URI is empty)
    const { usedMemoryServer } = await connectDB();

    // Auto-seed users when using the in-memory DB (fresh each run)
    if (usedMemoryServer) {
      const { created } = await seedUsers();
      console.log(`🌱 Seeded ${created} test users into in-memory DB`);
      console.log('\n   Test credentials:');
      SEED_USERS.forEach((u) => {
        console.log(`   • ${u.role.padEnd(20)} ${u.username} / ${u.password}`);
      });
      console.log('');
    }

    // Init optional external services (safe no-op if not configured)
    try { initCloudinary(); } catch (e) { console.warn('⚠️  Cloudinary not configured — file uploads disabled'); }
    initFirebase();

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📋 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
};

startServer();
