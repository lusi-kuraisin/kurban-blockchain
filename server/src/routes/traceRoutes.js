const express = require("express");
const traceRoutes = express.Router();
const {
  getFullAnimalTraceability,
  getBlockchainHistory,
} = require("../controllers/TraceabilityController");

traceRoutes.get("/:animalID/full", getFullAnimalTraceability);

traceRoutes.get("/:animalID/onchain", getBlockchainHistory);

module.exports = traceRoutes;
