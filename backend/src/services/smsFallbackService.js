import dotenv from 'dotenv';

dotenv.config();

const MESSAGE_CENTRALS_API_URL = process.env.MESSAGE_CENTRALS_API_URL || '';
const MESSAGE_CENTRALS_API_KEY = process.env.MESSAGE_CENTRALS_API_KEY || '';
const MESSAGE_CENTRALS_CUSTOMER_ID = process.env.MESSAGE_CENTRALS_CUSTOMER_ID || '';
const MESSAGE_CENTRALS_KEY = process.env.MESSAGE_CENTRALS_KEY || '';
const SMS_OTP_PROVIDER = process.env.SMS_OTP_PROVIDER || 'local';

const maskPhone = (phone) => String(phone).replace(/\D/g, '').replace(/(\d{2})\d+(\d{2})$/, '$1******$2');

// Request OTP via MessageCentrals (provider generates OTP)
// Internal auth token cache
let _mcAuthToken = null;
let _mcAuthExpiry = 0;

const getAuthToken = async () => {
  if (Date.now() < _mcAuthExpiry && _mcAuthToken) return _mcAuthToken;

  if (!MESSAGE_CENTRALS_API_URL) throw new Error('MESSAGE_CENTRALS_API_URL not configured');
  if (!MESSAGE_CENTRALS_CUSTOMER_ID || !MESSAGE_CENTRALS_KEY) throw new Error('MessageCentrals credentials missing (CUSTOMER_ID/KEY)');

  const urlBase = MESSAGE_CENTRALS_API_URL.replace(/\/$/, '');
  const params = new URLSearchParams();
  params.set('customerId', MESSAGE_CENTRALS_CUSTOMER_ID);
  params.set('key', MESSAGE_CENTRALS_KEY);
  // scope 'NEW' per docs for initial token
  params.set('scope', 'NEW');

  const url = `${urlBase}/auth/v1/authentication/token?${params.toString()}`;

  const resp = await fetch(url, { method: 'GET', headers: { accept: '*/*' } });
  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`MessageCentrals auth failed: ${resp.status} ${txt}`);
  }

  const json = await resp.json();
  // Expecting auth token in json.data.authToken or json.data?.authToken
  const token = json?.data?.authToken || json?.authToken || null;
  if (!token) throw new Error('MessageCentrals auth response missing authToken');

  _mcAuthToken = token;
  // set expiry to 14 minutes from now (provider examples not explicit)
  _mcAuthExpiry = Date.now() + 14 * 60 * 1000;
  return _mcAuthToken;
};

// Request OTP (send) using VerifyNow API
export const requestSmsOtp = async (phone, otpLength = 4) => {
  if (SMS_OTP_PROVIDER !== 'messagecentrals') {
    throw new Error('SMS OTP provider not configured to MessageCentrals');
  }

  const authToken = await getAuthToken();
  const urlBase = MESSAGE_CENTRALS_API_URL.replace(/\/$/, '');

  // normalize phone: extract country code and number
  const digits = String(phone || '').replace(/\D/g, '');
  let countryCode = '91';
  let mobileNumber = digits;
  if (digits.length > 10) {
    countryCode = digits.slice(0, digits.length - 10);
    mobileNumber = digits.slice(-10);
  }

  const params = new URLSearchParams();
  params.set('countryCode', countryCode);
  params.set('flowType', 'SMS');
  params.set('mobileNumber', mobileNumber);
  if (otpLength) params.set('otpLength', String(otpLength));

  const url = `${urlBase}/verification/v3/send?${params.toString()}`;

  const resp = await fetch(url, { method: 'POST', headers: { authToken } });
  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`MessageCentrals send OTP failed: ${resp.status} ${txt}`);
  }

  const json = await resp.json();
  // Expecting json.data.verificationId and transactionId
  return json;
};

// Verify OTP via MessageCentrals
// Verify OTP using VerifyNow API
export const verifySmsOtp = async (verificationId, code) => {
  if (SMS_OTP_PROVIDER !== 'messagecentrals') {
    throw new Error('SMS OTP provider not configured to MessageCentrals');
  }
  const authToken = await getAuthToken();
  const urlBase = MESSAGE_CENTRALS_API_URL.replace(/\/$/, '');

  const params = new URLSearchParams();
  params.set('verificationId', String(verificationId));
  params.set('code', String(code));

  const url = `${urlBase}/verification/v3/validateOtp?${params.toString()}`;

  const resp = await fetch(url, { method: 'POST', headers: { authToken } });
  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`MessageCentrals verifyOtp failed: ${resp.status} ${txt}`);
  }

  const json = await resp.json();
  return json;
};

// OTP transactional sender (backwards compatible)
// Backwards compatible transactional OTP sender (if local flow is used)
export const sendTransactionalOtpSms = async (phone, otp, name) => {
  if (SMS_OTP_PROVIDER === 'messagecentrals') {
    // Use VerifyNow send endpoint
    const resp = await requestSmsOtp(phone, String(otp || '').length || 4);
    return resp; // contains data.verificationId
  }

  // Local SMS sending (if provider not configured) - try to call /sms/send
  try {
    if (!MESSAGE_CENTRALS_API_URL || !MESSAGE_CENTRALS_API_KEY) return;
    const url = `${MESSAGE_CENTRALS_API_URL.replace(/\/$/, '')}/sms/send`;
    const body = { phone, message: `Hi ${name || 'User'}, your OTP is ${otp}` };
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${MESSAGE_CENTRALS_API_KEY}` },
      body: JSON.stringify(body),
    });
  } catch (err) {
    console.error('sendTransactionalOtpSms failed:', err.message);
  }
};

// Optional resend endpoint — try provider's resend, fall back to error
export const resendSmsOtp = async (verificationId) => {
  if (SMS_OTP_PROVIDER !== 'messagecentrals') throw new Error('SMS OTP provider not configured to MessageCentrals');
  const authToken = await getAuthToken();
  const urlBase = MESSAGE_CENTRALS_API_URL.replace(/\/$/, '');
  const params = new URLSearchParams();
  params.set('verificationId', String(verificationId));
  const url = `${urlBase}/verification/v3/resend?${params.toString()}`;
  const resp = await fetch(url, { method: 'POST', headers: { authToken } });
  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`MessageCentrals resend failed: ${resp.status} ${txt}`);
  }
  return await resp.json();
};

export default {
  requestSmsOtp,
  verifySmsOtp,
  sendTransactionalOtpSms,
  resendSmsOtp,
};
