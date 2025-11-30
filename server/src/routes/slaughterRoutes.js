const express = require("express");
const slaughterRoutes = express.Router();
const {
  startSlaughterProcess,
  certifyHalalSlaughter,
  getSlaughterDetails,
} = require("../controllers/SlaughterController");
const roleMiddleware = require("../middlewares/roleMiddleware");

slaughterRoutes.post(
  "/start",
  roleMiddleware("Committee"),
  startSlaughterProcess
);

slaughterRoutes.post(
  "/:animalID/certify",
  roleMiddleware("HalalInspector"),
  certifyHalalSlaughter
);

slaughterRoutes.get("/:animalID", getSlaughterDetails);

module.exports = slaughterRoutes;
