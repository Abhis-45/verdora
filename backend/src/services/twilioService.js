// services/twilioService.js
import twilio from "twilio";
import dotenv from "dotenv";

dotenv.config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

const client = twilio(accountSid, authToken);

export const sendOtpSMS = async (phoneNumber, otp) => {
  if (!phoneNumber.startsWith("+")) {
    throw new Error(
      "Phone number must be in E.164 format (e.g. +91XXXXXXXXXX)",
    );
  }

  try {
    return await client.messages.create({
      body: `Your Verdora OTP is ${otp}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber,
    });
  } catch (err) {
    throw err;
  }
};
