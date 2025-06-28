import mongoose from 'mongoose';

// Validate environment variable at module level
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
      'Please define the MONGODB_URI environment variable inside .env.local'
  );
}

// Now TypeScript knows MONGODB_URI is defined, but we need to help it understand
const connectionString: string = MONGODB_URI;

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections from growing exponentially
 * during API Route usage.
 */
interface MongooseCache {
  conn: mongoose.Mongoose | null;
  promise: Promise<mongoose.Mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongoose: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongoose || { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

export async function connectToDatabase(): Promise<mongoose.Mongoose> {
  // If a connection is already cached, return it
  if (cached.conn) {
    return cached.conn;
  }

  // If a connection promise is not already in progress, create one
  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(connectionString, opts).then((mongooseInstance) => {
      return mongooseInstance;
    });
  }

  // Await the connection promise and cache the result
  try {
    cached.conn = await cached.promise;
  } catch (e) {
    // If the connection fails, reset the promise so a new attempt can be made
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}