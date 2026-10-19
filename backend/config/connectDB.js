import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_ATLAS_URI);
    console.log(`Database connected successfully.`);
  } catch (err) {
    console.error(`Error connecting to database`, err);
    process.exit(1);
  }
};
