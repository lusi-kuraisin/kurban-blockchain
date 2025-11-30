const express = require("express");
const movementRoutes = express.Router();
const {
  startMovement,
  recordArrival,
  getMovementHistory,
} = require("../controllers/MovementController");
const roleMiddleware = require("../middlewares/roleMiddleware");

movementRoutes.post(
  "/start",
  roleMiddleware("Distributor", "Farmer", "Admin"),
  startMovement
);

movementRoutes.put(
  "/:movementID/arrive",
  roleMiddleware("Committee", "Admin"),
  recordArrival
);

movementRoutes.get("/history/:animalID", getMovementHistory);

module.exports = movementRoutes;
