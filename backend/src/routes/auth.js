import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { sendOtpSMS } from "../services/twilioService.js";
import { sendOtpEmail } from "../services/emailService.js";

const router = express.Router();
const otpStore = new Map();

// ✅ Send OTP
router.post("/send-otp", async (req, res) => {
  const { identifier } = req.body;
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  try {
    if (identifier.includes("@")) {
      await sendOtpEmail(identifier, otp);
    } else {
      await sendOtpSMS(identifier, otp);
    }
    otpStore.set(identifier, otp);
    res.json({ message: "OTP sent successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to send OTP", error: err.message });
  }
});

// ✅ Verify OTP (Login/Register)
router.post("/verify-otp", async (req, res) => {
  const { identifier, otp } = req.body;
  const storedOtp = otpStore.get(identifier);

  if (storedOtp !== otp) {
    return res.status(400).json({ message: "Invalid OTP" });
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
