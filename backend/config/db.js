const dns = require("dns");
const mongoose = require("mongoose");

// The local/ISP resolver refuses SRV lookups (querySrv ECONNREFUSED), which
// Atlas "mongodb+srv://" URIs depend on. Resolve through public DNS instead.
dns.setServers((process.env.DNS_SERVERS || "8.8.8.8,1.1.1.1").split(",").map((s) => s.trim()));

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) {
      throw new Error("MONGO_URI is not defined in your .env file");
    }

    await mongoose.connect(uri);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
