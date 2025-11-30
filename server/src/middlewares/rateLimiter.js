const rateLimit = require("express-rate-limit");

const sendOtpLimit = rateLimit({
  windowMs: 60000,
  max: 3,
  message: "Too many OTP requests from this IP, please try again later.",
});

const verifyOtpLimit = rateLimit({
  windowMs: 60000,
  max: 5,
  message: "Too many verification requests, please try again later.",
});

const registerLimit = rateLimit({
  windowMs: 15 * 60000,
  max: 5,
  message: "Too many registration attempts. Please try again later.",
});

const loginLimit = rateLimit({
  windowMs: 60000,
  max: 10,
  message: "Too many registration attempts. Please try again later.",
});

module.exports = { sendOtpLimit, verifyOtpLimit, registerLimit, loginLimit };
