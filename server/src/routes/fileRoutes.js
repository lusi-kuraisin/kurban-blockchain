const express = require("express");
const fileRoutes = express.Router();
const {
  uploadFileToIPFS,
  getFileByHash,
  getFileMetadata,
} = require("../controllers/FileController");
const verifyToken = require("../middlewares/authMiddleware");
const upload = require("../middlewares/upload");

fileRoutes.post(
  "/upload",
  upload.single("file"),
  verifyToken,
  uploadFileToIPFS
);

fileRoutes.get("/:ipfsHash", getFileByHash);

fileRoutes.get("/metadata/:ipfsHash", getFileMetadata);

module.exports = fileRoutes;
