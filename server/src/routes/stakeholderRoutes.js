const express = require("express");
const router = express.Router();
const {
  getAllStakeholders,
  getStakeholderById,
  updateStakeholder,
  deleteStakeholder,
  toggleVerification,
} = require("../controllers/StakeholderController");

router.get("/", getAllStakeholders);

router.get("/:id", getStakeholderById);

router.put("/:id", updateStakeholder);

router.put("/:id/verify", toggleVerification);

router.delete("/:id", deleteStakeholder);

module.exports = router;
