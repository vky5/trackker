import mongoose from 'mongoose';

declare global {
  // eslint-disable-next-line no-var
  var __trackkerMongoose: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  } | undefined;
}

const cached = global.__trackkerMongoose ?? { conn: null, promise: null };
global.__trackkerMongoose = cached;

function resolveMongoUri(raw: string): string {
  let uri = raw.trim();

  // Atlas URIs often end with "/" — ensure a database name is present
  if (/mongodb\.net\/?$/.test(uri)) {
    uri = `${uri.replace(/\/?$/, '')}/trackker`;
  }

  if (uri.includes('mongodb.net') && !uri.includes('?')) {
    uri += '?retryWrites=true&w=majority';
  }

  return uri;
}

const connectDB = async (): Promise<typeof mongoose> => {
  if (cached.conn) {
    return cached.conn;
  }

  const mongoURI = resolveMongoUri(
    process.env.MONGO_URI || 'mongodb://localhost:27017/trackker'
  );

  if (!cached.promise) {
    cached.promise = mongoose.connect(mongoURI, {
      bufferCommands: false,
      maxPoolSize: 1,
      serverSelectionTimeoutMS: 10000,
    }).then((mongooseInstance) => {
      console.log('✅ MongoDB connected successfully');
      return mongooseInstance;
    });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    cached.promise = null;
    console.error('❌ MongoDB connection error:', (error as Error).message);
    throw error;
  }
};

export default connectDB;