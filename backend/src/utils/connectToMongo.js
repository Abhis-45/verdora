import mongoose from "mongoose";

/**
 * Ensure MONGO_URI environment variable is set
 */
function ensureMongoUri(uri = process.env.MONGO_URI) {
  const value = uri?.trim();

  if (!value) {
    throw new Error(
      "MONGO_URI is not set. Add it to backend/.env before starting the backend."
    );
  }

  return value;
}

/**
 * Connect to MongoDB
 * Works on all platforms (Windows, Linux, macOS, Render, etc.)
 * MongoDB driver handles DNS resolution natively
 */
export async function connectToMongo(options = {}) {
  try {
    const mongoUri = ensureMongoUri();
    
    // MongoDB connection options
    const defaultOptions = {
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 2,
      retryWrites: true,
    };

    const finalOptions = { ...defaultOptions, ...options };
    
    await mongoose.connect(mongoUri, finalOptions);
    console.log("✅ MongoDB connected successfully");
    
    return mongoose.connection;
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    // Don't throw - server continues to run even without MongoDB
    return null;
  }
}

export default connectToMongo;
