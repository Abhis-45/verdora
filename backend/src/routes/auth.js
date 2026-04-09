import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { sendOtpSMS } from "../services/twilioService.js";
import { sendOtpEmail } from "../services/emailService.js";

const router = express.Router();
const otpStore = new Map(); // Format: { otp: string, expiresAt: timestamp }
const OTP_EXPIRY_MINUTES = 10;

// ✅ Send OTP
router.post("/send-otp", async (req, res) => {
  const { identifier } = req.body;
  
  if (!identifier) {
    return res.status(400).json({ message: "Email or mobile number is required" });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  try {
    if (identifier.includes("@")) {
      try {
        await sendOtpEmail(identifier, otp);
        console.log(`✅ Email OTP sent successfully to ${identifier}`);
      } catch (emailErr) {
        console.error(`❌ Email send failed for ${identifier}:`, emailErr.message);
        throw new Error(`Failed to send OTP to email: ${emailErr.message}`);
      }
    } else {
      try {
        const result = await sendOtpSMS(identifier, otp);
        if (!result || !result.sid) {
          throw new Error("SMS service returned no confirmation");
        }
        console.log(`✅ SMS OTP sent successfully to ${identifier}`);
      } catch (smsErr) {
        console.error(`❌ SMS send failed for ${identifier}:`, smsErr.message);
        throw new Error(`Failed to send OTP to SMS: ${smsErr.message}`);
      }
    }
    
    // Store OTP with expiration timestamp
    const expiresAt = Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000;
    otpStore.set(identifier, { otp, expiresAt });
    
    console.log(`✅ OTP sent to ${identifier}, expires at ${new Date(expiresAt).toISOString()}`);
    res.json({ message: "OTP sent successfully" });
  } catch (err) {
    console.error(`❌ OTP Send Error for ${identifier}:`, err.message);
    res.status(500).json({ 
      message: "Failed to send OTP. Please check your email/phone number and try again.",
      error: process.env.NODE_ENV === "development" ? err.message : undefined
    });
  }
});

// ✅ Verify OTP (Login/Register)
router.post("/verify-otp", async (req, res) => {
  const { identifier, otp } = req.body;
  
  if (!identifier || !otp) {
    return res.status(400).json({ message: "Email/mobile and OTP are required" });
  }

  const storedData = otpStore.get(identifier);

  // Check if OTP exists
  if (!storedData) {
    return res.status(400).json({ message: "OTP not found or expired. Please request a new OTP." });
  }

  // Check if OTP has expired
  if (Date.now() > storedData.expiresAt) {
    otpStore.delete(identifier);
    return res.status(400).json({ message: "OTP has expired. Please request a new OTP." });
  }

  // Check if OTP matches
  if (storedData.otp !== otp) {
    return res.status(400).json({ message: "Invalid OTP. Please try again." });
  }

  otpStore.delete(identifier);

  let user = await User.findOne(
    identifier.includes("@") ? { email: identifier } : { mobile: identifier },
  );

  if (!user) {
    user = new User(
      identifier.includes("@") ? { email: identifier } : { mobile: identifier },
    );
    await user.save();
  }

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });
  res.json({ message: "Login successful", token, user });
});

// ✅ Password Login/Register combined
router.post("/password", async (req, res) => {
  const { email, mobile, password } = req.body;

  // Find user by email or mobile
  let user = await User.findOne(email ? { email } : { mobile });

  if (user) {
    // User exists → login
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ message: "Invalid password" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });
    return res.json({ message: "Login successful", token, user });
  } else {
    // User does not exist → register
    const hashedPassword = await bcrypt.hash(password, 10);
    user = new User({ email, mobile, password: hashedPassword });
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });
    return res.json({ message: "Registered successfully", token, user });
  }
});

export default router;
