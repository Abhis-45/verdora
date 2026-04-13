import express from "express";
import jwt from "jsonwebtoken";
import Contact from "../models/Contact.js";

const router = express.Router();

// ✅ ADMIN AUTH MIDDLEWARE
const adminAuthMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Token required" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    req.adminId = decoded.id;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

// POST /api/contact - Submit contact/service request form
router.post("/", async (req, res) => {
  const { name, email, phone, message, service, servicePackage } = req.body;

  // Validate required fields
  if (!name || !email || !phone || !message) {
    return res.status(400).json({ message: "All fields are required" });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: "Invalid email format" });
  }

  // Validate phone format (basic check for 10 digits)
  const phoneRegex = /^\d{10}$/;
  if (!phoneRegex.test(phone.replace(/\D/g, ""))) {
    return res.status(400).json({ message: "Phone number must be 10 digits" });
  }

  try {
    // Determine type based on service parameters
    const type = service ? "service" : "general";

    // Save contact form to database
    const contact = new Contact({
      type,
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      subject: message.substring(0, 50), // Use first 50 chars of message as subject
      message: message.trim(),
      service: service?.trim() || "",
      servicePackage: servicePackage?.trim() || "",
      submittedAt: new Date(),
    });

    await contact.save();

    res.status(201).json({
      message: "Thank you for reaching out! We'll get back to you soon.",
      contactId: contact._id,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to submit contact form" });
  }
});

// ✅ GET ALL SERVICE REQUESTS (Public)
router.get("/service-requests", async (req, res) => {
  try {
    const { search, status } = req.query;
    let query = { type: "service" };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { service: { $regex: search, $options: "i" } },
        { message: { $regex: search, $options: "i" } },
      ];
    }

    if (status) {
      query.isResolved = status === "resolved";
    }

    const requests = await Contact.find(query)
      .sort({ submittedAt: -1 })
      .lean();

    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch service requests", error: err.message });
  }
});

// ✅ GET SINGLE SERVICE REQUEST (Public)
router.get("/service-requests/:id", async (req, res) => {
  try {
    const request = await Contact.findById(req.params.id);
    if (!request || request.type !== "service") {
      return res.status(404).json({ message: "Service request not found" });
    }
    res.json(request);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch service request", error: err.message });
  }
});

// ✅ DELETE SERVICE REQUEST (Public)
router.delete("/service-requests/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const request = await Contact.findById(id);

    if (!request || request.type !== "service") {
      return res.status(404).json({ message: "Service request not found" });
    }

    await Contact.findByIdAndDelete(id);

    res.json({ message: "✅ Service request deleted successfully" });
  } catch (err) {
    console.error("Delete service request error:", err);
    res.status(500).json({ message: "Failed to delete service request", error: err.message });
  }
});

// ✅ UPDATE SERVICE REQUEST STATUS (Public)
router.patch("/service-requests/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { isResolved, notes } = req.body;

    const request = await Contact.findById(id);
    if (!request || request.type !== "service") {
      return res.status(404).json({ message: "Service request not found" });
    }

    if (typeof isResolved === "boolean") {
      request.isResolved = isResolved;
      if (isResolved) {
        request.resolvedAt = new Date();
      }
    }

    if (notes) {
      request.notes = notes;
    }

    await request.save();

    res.json({ message: "Service request updated", request });
  } catch (err) {
    res.status(500).json({ message: "Failed to update service request", error: err.message });
  }
});

export default router;
