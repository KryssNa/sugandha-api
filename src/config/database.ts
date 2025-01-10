const mongoose = require("mongoose");

// MongoDB connection configuration
const mongoOptions = {
  serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
  family: 4, // Use IPv4, skip trying IPv6
};

// Function to establish MongoDB connection
export const connectDB = async () => {
  try {
    // Get MongoDB connection string from environment variable
    const mongoURI = process.env.MONGODB_URI as string;

    // Establish connection
    await mongoose.connect(mongoURI, mongoOptions);

    console.log("✅ MongoDB connected successfully");

    // Optional: Handle connection events
    mongoose.connection.on("connected", () => {
      console.log("Mongoose connected to DB");
    });

    mongoose.connection.on("error", (err: any) => {
      console.error(`MongoDB connection error: ${err}`);
    });

    mongoose.connection.on("disconnected", () => {
      console.log("Mongoose disconnected from DB");
    });

    // Graceful shutdown
    process.on("SIGINT", async () => {
      await mongoose.connection.close();
      console.log("MongoDB connection closed through app termination");
      process.exit(0);
    });
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);

    // Exit process with failure
    process.exit(1);
  }
};
