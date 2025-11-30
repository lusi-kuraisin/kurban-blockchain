const express = require("express");
const blockchainRecordRoutes = express.Router();
const {
  getAssetDetailsOnChain,
  getAssetHistoryOnChain,
  getTransactionDetails,
} = require("../controllers/BlockchainRecordController");

blockchainRecordRoutes.get("/asset/:animalID", getAssetDetailsOnChain);

blockchainRecordRoutes.get("/history/:assetID", getAssetHistoryOnChain);

blockchainRecordRoutes.get("/query/transaction/:txID", getTransactionDetails);

module.exports = blockchainRecordRoutes;
