import express from "express";
import Subscriber from "../models/Subscriber.js";
import Contact from "../models/Contact.js";
import VendorRequest from "../models/VendorRequest.js";
import {
  sendVendorRegistrationSubmittedEmail,
} from "../services/emailService.js";
import {
  sendVendorRegistrationReceivedSMS,
} from "../services/twilioService.js";

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

// POST /api/vendor-register - Submit vendor registration request
router.post("/vendor-register", async (req, res) => {
  const { vendorName, shopName, email, phone, address } = req.body;

  if (!vendorName || !shopName || !email || !phone || !address) {
    return res
      .status(400)
      .json({ message: "All fields are required" });
  }

  try {
    // Check if vendor request already exists
    const existing = await VendorRequest.findOne({
      email: email.toLowerCase().trim(),
      status: "pending",
    });

    if (existing) {
      return res
        .status(400)
        .json({ message: "You have already submitted a vendor registration request" });
    }

    const vendorRequest = new VendorRequest({
      vendorName: vendorName.trim(),
      shopName: shopName.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      address: address.trim(),
    });

    await vendorRequest.save();

    // ✅ SEND VENDOR REGISTRATION RECEIVED NOTIFICATION
    try {
      if (email) {
        await sendVendorRegistrationSubmittedEmail(
          email,
          vendorName,
          shopName
        ).catch((err) => console.error("❌ Vendor registration email failed:", err.message));
      }

      const formattedPhone = phone.startsWith("+") ? phone : `+91${phone}`;
      if (phone) {
        await sendVendorRegistrationReceivedSMS(
          formattedPhone,
          vendorName
        ).catch((err) => console.error("❌ Vendor registration SMS failed:", err.message));
      }
    } catch (notificationErr) {
      console.error("Vendor registration notification failed:", notificationErr.message);
    }

    res.json({
      message:
        "Thank you for your interest! We will contact you shortly to complete your vendor registration.",
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to submit registration", error: err.message });
  }
});

export default router;
