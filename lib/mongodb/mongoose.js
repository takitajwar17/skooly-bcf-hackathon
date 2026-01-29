import mongoose from "mongoose";

let initialized = false;

export const connect = async (retries = 3) => {
  mongoose.set("strictQuery", true);

  if (initialized) {
    return;
  }

  for (let i = 0; i < retries; i++) {
    try {
      await mongoose.connect(process.env.MONGODB_URI, {
        dbName: process.env.MONGODB_DATABASE || "skooly_db",
        serverSelectionTimeoutMS: 8000,
        connectTimeoutMS: 8000,
        socketTimeoutMS: 45000,
        maxPoolSize: 10,
        minPoolSize: 2,
      });
      initialized = true;
      console.log("MongoDB connected successfully");
      return;
    } catch (error) {
      console.error(
        `MongoDB connection attempt ${i + 1} failed:`,
        error.message,
      );
      initialized = false;

      if (i === retries - 1) {
        throw new Error(
          `Failed to connect to MongoDB after ${retries} attempts: ${error.message}`,
        );
      }

      // Wait before retry
      await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
};

export default connect;
