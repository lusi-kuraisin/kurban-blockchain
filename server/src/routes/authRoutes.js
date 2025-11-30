const express = require("express");
const authRoutes = express.Router();
const {
  registerLimit,
  loginLimit,
  sendOtpLimit,
  verifyOtpLimit,
} = require("../middlewares/rateLimiter");
const verifyToken = require("../middlewares/authMiddleware");
const {
  loginStakeholder,
  registerStakeholder,
  forgotPassword,
  resetPassword,
  logout,
} = require("../controllers/authController");

authRoutes.post("/register", registerLimit, registerStakeholder);

authRoutes.post("/login", loginLimit, loginStakeholder);

authRoutes.get("/me", verifyToken, (req, res) => {
  res.json({ user: req.user });
});

authRoutes.post("/logout", logout);

authRoutes.post("/forgot-password", sendOtpLimit, forgotPassword);

authRoutes.post("/reset-password", resetPassword);

module.exports = authRoutes;
