import express from "express";
import Contact from "../models/Contact.js";

const router = express.Router();

// POST /api/contact - Submit contact form
router.post("/", async (req, res) => {
  const { name, email, phone, subject, message } = req.body;

  // Validate required fields
  if (!name || !email || !phone || !subject || !message) {
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
    // Save contact form to database
    const contact = new Contact({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      subject: subject.trim(),
      message: message.trim(),
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

// GET /api/contact (admin only - future feature)
// GET /api/contact/:id (admin only - future feature)

export default router;
