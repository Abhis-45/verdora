import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import profileRoutes from "./routes/profile.js";
import publicRoutes from "./routes/public.js";
import adminAuthRoutes from "./routes/adminAuth.js";
import adminManagementRoutes from "./routes/admin.js";
import productsRoutes from "./routes/products.js";
import reviewsRoutes from "./routes/reviews.js";
import contactRoutes from "./routes/contact.js";
import vendorRoutes from "./routes/vendor.js";
import pincodeRoutes from "./routes/pincode.js";
import { connectToMongo } from "./utils/connectToMongo.js";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api", publicRoutes);
app.use("/api/admin", adminAuthRoutes);
app.use("/api/admin/manage", adminManagementRoutes);
app.use("/api/vendor", vendorRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/reviews", reviewsRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/pincode", pincodeRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ message: "Verdora API is running" });
});

connectToMongo()
  .then(() => {
    const port = process.env.PORT || 5000;
    app.listen(port, "0.0.0.0", () => {});
  })
  .catch((err) => {});
