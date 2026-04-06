import express from "express";
import Subscriber from "../models/Subscriber.js";
import Contact from "../models/Contact.js";

const router = express.Router();

// POST /api/subscribe
router.post("/subscribe", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email is required" });
  try {
    // upsert subscriber
    const existing = await Subscriber.findOne({
      email: email.toLowerCase().trim(),
    });
    if (existing) {
      return res.json({ message: "You're already subscribed" });
    }
    const sub = new Subscriber({ email });
    await sub.save();
    res.json({ message: "Subscribed successfully" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to subscribe", error: err.message });
  }
});

// POST /api/contact
router.post("/contact", async (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message) {
    return res
      .status(400)
      .json({ message: "Name, email and message are required" });
  }
  try {
    const contact = new Contact({ name, email, message });
    await contact.save();
    res.json({ message: "Message received. We'll get back to you soon." });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to save message", error: err.message });
  }
});

export default router;
