// ✅ Utility function to validate email format
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// ✅ Utility function to validate phone format
export const validatePhone = (phone) => {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/; // E.164 format
  return phoneRegex.test(phone);
};

// ✅ Utility to generate random OTP
export const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// ✅ Utility to check if OTP is expired
export const isOtpExpired = (expiryTime) => {
  return !expiryTime || new Date() > new Date(expiryTime);
};

// ✅ Utility to sanitize user object (remove sensitive fields)
export const sanitizeUser = (user) => {
  const userObj = user.toObject ? user.toObject() : user;
  delete userObj.password;
  delete userObj.otp;
  delete userObj.otpExpiry;
  delete userObj.otpField;
  return userObj;
};
