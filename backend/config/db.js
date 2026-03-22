const mongoose = require('mongoose');

const MONGO_OPTIONS = {
  serverSelectionTimeoutMS: 10000,   // Give Atlas 10s to respond
  socketTimeoutMS: 45000,            // Close sockets after 45s inactivity
  family: 4,                         // Force IPv4 (avoids IPv6 SRV issues on some networks)
};

let retryCount = 0;
const MAX_RETRIES = 5;

const connectDB = async () => {
  while (retryCount < MAX_RETRIES) {
    try {
      const conn = await mongoose.connect(process.env.MONGO_URI, MONGO_OPTIONS);
      console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
      retryCount = 0; // reset on success

      // Reconnect automatically on loss
      mongoose.connection.on('disconnected', () => {
        console.warn('⚡ MongoDB disconnected — reconnecting...');
        setTimeout(connectDB, 3000);
      });

      return;
    } catch (error) {
      retryCount++;
      console.error(`⚠️  MongoDB Connection Error (attempt ${retryCount}/${MAX_RETRIES}): ${error.message}`);
      if (retryCount < MAX_RETRIES) {
        const waitMs = Math.min(retryCount * 2000, 10000);
        console.log(`🔄 Retrying in ${waitMs / 1000}s...`);
        await new Promise(r => setTimeout(r, waitMs));
      } else if (process.env.NODE_ENV === 'production') {
        console.error('❌ Max retries reached. Exiting.');
        process.exit(1);
      } else {
        console.warn('🟡 Running in DEV mode without DB. Fix MONGO_URI in backend/.env to enable data.');
      }
    }
  }
};

module.exports = connectDB;
