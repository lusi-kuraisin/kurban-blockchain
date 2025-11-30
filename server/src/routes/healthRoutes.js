const express = require("express");
const healthRoutes = express.Router();
const {
  recordVaccination,
  recordHealthCheck,
  certifyFitForSacrifice,
  getHealthRecords,
} = require("../controllers/HealthController");
const roleMiddleware = require("../middlewares/roleMiddleware");

healthRoutes.post(
  "/vaccinate",
  roleMiddleware("VeterinaryDoctor"),
  recordVaccination
);

healthRoutes.post(
  "/checkup",
  roleMiddleware("VeterinaryDoctor"),
  recordHealthCheck
);

healthRoutes.post(
  "/certify/:animalID",
  roleMiddleware("VeterinaryDoctor"),
  certifyFitForSacrifice
);

healthRoutes.get("/records/:animalID", getHealthRecords);

module.exports = healthRoutes;
