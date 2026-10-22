const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/codegraph';
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 4000,
    });
    console.log(`[CodeGraph DB] Connected to MongoDB at ${uri}`);
    return true;
  } catch (err) {
    console.warn(`[CodeGraph DB] MongoDB connection failed (${err.message}). Using hybrid in-memory/JSON store fallback.`);
    return false;
  }
};

module.exports = { connectDB };
