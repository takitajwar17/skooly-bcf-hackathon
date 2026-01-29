import mongoose from "mongoose";

let initialized = false;

export const connect = async () => {
  mongoose.set("strictQuery", true);

  if (initialized) {
    return;
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: "bcf-hackathon",
    });
    initialized = true;
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw error;
  }
};
