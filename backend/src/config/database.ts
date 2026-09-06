import mongoose from 'mongoose';

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 5000;

let memoryServer: { stop: () => Promise<unknown> } | null = null;

/**
 * Connects to MongoDB.
 * - If MONGODB_URI is set, connects to that database.
 * - If MONGODB_URI is empty AND NODE_ENV !== 'production', spins up an
 *   in-memory MongoDB (great for local testing with zero setup).
 */
export const connectDB = async (): Promise<{ usedMemoryServer: boolean }> => {
  let uri = process.env.MONGODB_URI;

  // Local fallback: in-memory MongoDB
  if (!uri && process.env.NODE_ENV !== 'production') {
    console.log('ℹ️  No MONGODB_URI set — starting in-memory MongoDB for local testing...');
    // Lazy import so this dev-only dependency isn't required in production
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    const mem = await MongoMemoryServer.create();
    memoryServer = mem;
    uri = mem.getUri();
    console.log('✅ In-memory MongoDB started');
    await mongoose.connect(uri);
    console.log(`✅ MongoDB connected (in-memory): ${mongoose.connection.host}`);
    return { usedMemoryServer: true };
  }

  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not set');
  }

  let attempt = 0;
  while (attempt < MAX_RETRIES) {
    try {
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 10000,
      });
      console.log(`✅ MongoDB connected: ${mongoose.connection.host}`);
      return { usedMemoryServer: false };
    } catch (err) {
      attempt++;
      console.error(
        `❌ MongoDB connection attempt ${attempt}/${MAX_RETRIES} failed:`,
        (err as Error).message
      );
      if (attempt < MAX_RETRIES) {
        console.log(`Retrying in ${RETRY_DELAY_MS / 1000}s...`);
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      }
    }
  }
  throw new Error('Could not connect to MongoDB after maximum retries');
};

export const stopMemoryServer = async (): Promise<void> => {
  if (memoryServer) {
    await mongoose.disconnect();
    await memoryServer.stop();
    memoryServer = null;
  }
};

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
  console.log('✅ MongoDB reconnected');
});
