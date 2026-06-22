import mongoose from 'mongoose';

const connectDB = async (): Promise<void> => {
  try {
    const mongoURI =
      process.env.MONGO_URI || 'mongodb://localhost:27017/trackker';

    await mongoose.connect(mongoURI);
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', (error as Error).message);
    process.exit(1);
  }
};

export default connectDB;
