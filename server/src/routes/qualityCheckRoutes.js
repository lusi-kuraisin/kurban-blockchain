const express = require("express");
const qualityCheckRoutes = express.Router();
const {
  recordQualityCheck,
  finalizeQCStatus,
  getQualityCheckHistory,
} = require("../controllers/QualityCheckController");
const roleMiddleware = require("../middlewares/roleMiddleware");

qualityCheckRoutes.post(
  "/record",
  roleMiddleware("Admin", "Committee"),
  recordQualityCheck
);

qualityCheckRoutes.put(
  "/:checkID/finalize",
  roleMiddleware("Admin", "Committee"),
  finalizeQCStatus
);

qualityCheckRoutes.get("/history/:animalID", getQualityCheckHistory);

module.exports = qualityCheckRoutes;
