import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(
     process.env.MONGODB_URI || "mongodb://localhost:27017/nexus-rail"
    );

    console.log(`[MongoDB] Connected: ${conn.connection.host}`);
  } catch (err) {
    console.error("[MongoDB] Error:", err.message);
    process.exit(1);
  }
};

export default connectDB;
