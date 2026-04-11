import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import profileRoutes from "./routes/profile.js";
import publicRoutes from "./routes/public.js";
import adminAuthRoutes from "./routes/adminAuth.js";
import adminRoutes from "./routes/admin.js";
import adminManagementRoutes from "./routes/admin-management.js";
import productsRoutes from "./routes/products.js";
import reviewsRoutes from "./routes/reviews.js";
import contactRoutes from "./routes/contact.js";
import vendorRoutes from "./routes/vendor.js";
import vendorManagementRoutes from "./routes/vendor-management.js";
import pincodeRoutes from "./routes/pincode.js";
import { connectToMongo } from "./utils/connectToMongo.js";

dotenv.config();
const app = express();

// Configure CORS to allow frontend origin
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "https://verdora-two.vercel.app",
  "https://verdora-3ahq50zb3-abhishe-kumars-projects.vercel.app",
  "https://www.verdora.in",
  process.env.FRONTEND_URL_1,
  process.env.FRONTEND_URL_2,
  process.env.FRONTEND_URL_3,
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS not allowed for origin: ${origin}`));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api", publicRoutes);
app.use("/api/admin", adminAuthRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin/manage", adminManagementRoutes);
app.use("/api/vendor", vendorManagementRoutes);
app.use("/api/vendor", vendorRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/reviews", reviewsRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/pincode", pincodeRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ message: "Verdora API is running" });
});

// Start server
const port = process.env.PORT || 5000;
const server = app.listen(port, "0.0.0.0", () => {
  console.log(`✅ Server running on port ${port}`);
});

// Connect to MongoDB
connectToMongo()
  .then(() => {
    console.log("✅ MongoDB connected successfully");
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    // Server still runs even if MongoDB fails - client can still use API
    // But data operations will fail
  });

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM signal received: closing HTTP server");
  server.close(() => {
    console.log("HTTP server closed");
    process.exit(0);
  });
});
