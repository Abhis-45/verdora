import dotenv from "dotenv";

dotenv.config();

const MESSAGE_CENTRAL_API_URL =
  process.env.MESSAGE_CENTRAL_API_URL ||
  process.env.MESSAGE_CENTRALS_API_URL ||
  "https://cpaas.messagecentral.com";
const MESSAGE_CENTRAL_CUSTOMER_ID =
  process.env.MESSAGE_CENTRAL_CUSTOMER_ID ||
  process.env.MESSAGE_CENTRALS_CUSTOMER_ID ||
  "";
const MESSAGE_CENTRAL_KEY =
  process.env.MESSAGE_CENTRAL_KEY ||
  process.env.MESSAGE_CENTRALS_KEY ||
  "";
const MESSAGE_CENTRAL_PASSWORD =
  process.env.MESSAGE_CENTRAL_PASSWORD ||
  process.env.MESSAGE_CENTRALS_PASSWORD ||
  "";
const SMS_OTP_PROVIDER = (
  process.env.SMS_OTP_PROVIDER ||
  process.env.OTP_SMS_PROVIDER ||
  "messagecentral"
).toLowerCase();

let authToken = null;
let authTokenExpiresAt = 0;

const isMessageCentralProvider = () =>
  ["messagecentral", "messagecentrals"].includes(SMS_OTP_PROVIDER);

const getMessageCentralKey = () => {
  if (MESSAGE_CENTRAL_KEY) return MESSAGE_CENTRAL_KEY;
  if (MESSAGE_CENTRAL_PASSWORD) {
    return Buffer.from(MESSAGE_CENTRAL_PASSWORD).toString("base64");
  }
  return "";
};

const assertConfigured = () => {
  if (!isMessageCentralProvider()) {
    throw new Error("SMS OTP provider must be Message Central");
  }
  if (!MESSAGE_CENTRAL_CUSTOMER_ID || !getMessageCentralKey()) {
    throw new Error(
      "Message Central credentials missing. Set MESSAGE_CENTRAL_CUSTOMER_ID and MESSAGE_CENTRAL_KEY.",
    );
  }
};

const getBaseUrl = () => MESSAGE_CENTRAL_API_URL.replace(/\/$/, "");

const normalizePhoneParts = (phone) => {
  const digits = String(phone || "").replace(/\D/g, "");

  if (digits.length < 10) {
    throw new Error("Invalid mobile number");
  }

  return {
    countryCode: digits.length > 10 ? digits.slice(0, -10) : "91",
    mobileNumber: digits.slice(-10),
  };
};

const extractVerificationId = (response) =>
  response?.data?.verificationId ||
  response?.data?.requestId ||
  response?.verificationId ||
  response?.requestId ||
  response?.data?.transactionId ||
  response?.transactionId ||
  null;

const getAuthToken = async () => {
  assertConfigured();

  if (authToken && Date.now() < authTokenExpiresAt) {
    return authToken;
  }

  const params = new URLSearchParams({
    customerId: MESSAGE_CENTRAL_CUSTOMER_ID,
    key: getMessageCentralKey(),
    scope: "NEW",
  });

  const response = await fetch(
    `${getBaseUrl()}/auth/v1/authentication/token?${params.toString()}`,
    { method: "GET", headers: { accept: "*/*" } },
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Message Central auth failed: ${response.status} ${body}`);
  }

  const json = await response.json();
  const nextToken =
    json?.data?.authToken ||
    json?.authToken ||
    json?.data?.token ||
    json?.token ||
    null;

  if (!nextToken) {
    throw new Error("Message Central auth response did not include an auth token");
  }

  authToken = nextToken;
  authTokenExpiresAt = Date.now() + 14 * 60 * 1000;
  return authToken;
};

export const getSmsOtpStatus = () => ({
  provider: "messagecentral",
  configured: Boolean(
    isMessageCentralProvider() &&
      MESSAGE_CENTRAL_CUSTOMER_ID &&
      getMessageCentralKey(),
  ),
  apiUrl: getBaseUrl(),
  customerIdConfigured: Boolean(MESSAGE_CENTRAL_CUSTOMER_ID),
  keyConfigured: Boolean(getMessageCentralKey()),
});

export const requestSmsOtp = async (phone, otpLength = 6) => {
  const token = await getAuthToken();
  const { countryCode, mobileNumber } = normalizePhoneParts(phone);

  const params = new URLSearchParams({
    countryCode,
    flowType: "SMS",
    mobileNumber,
    otpLength: String(otpLength),
  });

  const response = await fetch(
    `${getBaseUrl()}/verification/v3/send?${params.toString()}`,
    { method: "POST", headers: { authToken: token } },
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Message Central send OTP failed: ${response.status} ${body}`);
  }

  const json = await response.json();
  const verificationId = extractVerificationId(json);

  if (!verificationId) {
    throw new Error("Message Central send OTP response missing verificationId");
  }

  return {
    provider: "messagecentral",
    verificationId,
    requestId: verificationId,
    response: json,
  };
};

export const verifySmsOtp = async (verificationId, code, phone = null) => {
  if (!verificationId || !code) {
    throw new Error("verificationId and code are required");
  }

  const token = await getAuthToken();
  const params = new URLSearchParams({
    verificationId: String(verificationId),
    customerId: MESSAGE_CENTRAL_CUSTOMER_ID,
    code: String(code),
  });

  if (phone) {
    const { countryCode, mobileNumber } = normalizePhoneParts(phone);
    params.set("countryCode", countryCode);
    params.set("mobileNumber", mobileNumber);
  }

  const response = await fetch(
    `${getBaseUrl()}/verification/v3/validateOtp?${params.toString()}`,
    { method: "GET", headers: { authToken: token } },
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Message Central verify OTP failed: ${response.status} ${body}`);
  }

  const json = await response.json();
  const status =
    json?.data?.verificationStatus ||
    json?.data?.status ||
    json?.data?.message ||
    json?.verificationStatus ||
    json?.status ||
    json?.message ||
    "";
  const verified = json?.data?.verified ?? json?.verified;

  if (verified === true) {
    return json;
  }

  if (
    status &&
    !/success|verified|approved|verification_completed|completed|200/i.test(
      String(status),
    )
  ) {
    throw new Error(`Message Central rejected OTP with status: ${status}`);
  }

  return json;
};

export const resendSmsOtp = async (verificationId) => {
  if (!verificationId) {
    throw new Error("verificationId is required");
  }

  const token = await getAuthToken();
  const params = new URLSearchParams({ verificationId: String(verificationId) });
  const response = await fetch(
    `${getBaseUrl()}/verification/v3/send?${params.toString()}`,
    { method: "POST", headers: { authToken: token } },
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Message Central resend OTP failed: ${response.status} ${body}`);
  }

  return response.json();
};

export default {
  getSmsOtpStatus,
  requestSmsOtp,
  verifySmsOtp,
  resendSmsOtp,
};
