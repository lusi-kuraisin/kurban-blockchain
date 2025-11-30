const express = require("express");
const authRoutes = require("./authRoutes");
const animalRoutes = require("./animalRoutes");
const slaughterRoutes = require("./slaughterRoutes");
const stakeholderRoutes = require("./stakeholderRoutes");
const roleMiddleware = require("../middlewares/roleMiddleware");
const verifyToken = require("../middlewares/authMiddleware");
const healthRoutes = require("./healthRoutes");
const movementRoutes = require("./movementRoutes");
const profileRoutes = require("./profileRoutes");
const qualityCheckRoutes = require("./qualityCheckRoutes");
const traceRoutes = require("./traceRoutes");
const blockchainRecordRoutes = require("./blockchainRecordRoutes");
const smartContractRoutes = require("./smartContractRoutes");
const fileRoutes = require("./fileRoutes");
const router = express.Router();

router.use("/animal", verifyToken, animalRoutes);

router.use("/auth", authRoutes);

router.use(
  "/blockchain-record",
  verifyToken,
  roleMiddleware("Admin"),
  blockchainRecordRoutes
);

router.use("/file", fileRoutes);

router.use("/health", verifyToken, healthRoutes);

router.use("/movement", verifyToken, movementRoutes);

router.use("/profile", verifyToken, profileRoutes);

router.use("/quality-check", verifyToken, qualityCheckRoutes);

router.use("/slaughter", verifyToken, slaughterRoutes);

router.use(
  "/smart-contract",
  verifyToken,
  roleMiddleware("Admin"),
  smartContractRoutes
);
router.use(
  "/stakeholder",
  verifyToken,
  roleMiddleware("Admin"),
  stakeholderRoutes
);

router.use("/trace", traceRoutes);

module.exports = router;
