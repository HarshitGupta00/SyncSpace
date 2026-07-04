// config/db.js
// MongoDB connection using Mongoose.
// WHY a separate file instead of connecting in server.js:
// Keeping connection logic isolated means you can mock/replace it in tests
// without touching the server setup, and it keeps server.js clean.

const mongoose = require("mongoose");
const { MONGO_URI } = require("./env");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(MONGO_URI);
    // No need to pass deprecated options like useNewUrlParser anymore —
    // Mongoose 7+ handles defaults automatically.

    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
    // process.exit(1) on DB failure because the app is useless without a
    // database — better to crash fast and let the process manager (PM2/Railway)
    // restart it than to silently run in a broken state.
  }
};

module.exports = connectDB;
