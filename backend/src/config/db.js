const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoUri =
      process.env.MONGODB_URI ||
      process.env.MONGO_URI ||
      'mongodb+srv://asifh9336_db_user:PicR5qIZvqmxfioY@cluster0.es5eufp.mongodb.net/swadghar?retryWrites=true&w=majority';

    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 8000,
      autoIndex: true,
    });
    console.log(`[MongoDB] Connected successfully: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`[MongoDB] Connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
