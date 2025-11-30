const express = require("express");
const smartContractRoutes = express.Router();
const {
  initLedger,
  genericInvoke,
  genericQuery,
} = require("../controllers/SmartContractController");

smartContractRoutes.post("/init", initLedger);

smartContractRoutes.post("/invoke", genericInvoke);

smartContractRoutes.get("/query", genericQuery);

module.exports = smartContractRoutes;
