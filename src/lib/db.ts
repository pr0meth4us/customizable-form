import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    'Please define the MONGODB_URI environment variable inside .env.local'
  );
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections from growing exponentially
 * during API Route usage.
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectToDatabase() {
  // If a connection is already cached, return it
  if (cached.conn) {
    return cached.conn;
  }

  // If a connection promise is not already in progress, create one
  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongooseInstance) => {
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
