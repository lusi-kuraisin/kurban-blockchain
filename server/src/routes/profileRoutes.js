const express = require("express");
const profileRoutes = express.Router();
const {
  getProfile,
  updateProfile,
  uploadKycDocuments,
  manageRoleProfile,
} = require("../controllers/ProfileController");
const roleMiddleware = require("../middlewares/roleMiddleware");

profileRoutes.get("/:id", getProfile);

profileRoutes.put("/:id", updateProfile);

profileRoutes.put("/:id/kyc", uploadKycDocuments);

profileRoutes.all(
  "/role/:role/:id",
  roleMiddleware("Admin"),
  manageRoleProfile
);

module.exports = profileRoutes;
