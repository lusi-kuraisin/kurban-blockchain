const { IPFSFile } = require("../../models");

const { invokeTransaction } = require("../../invoke");

const ipfsClient = {
  add: async (fileBuffer) => {
    console.log("-> Mengunggah file ke IPFS...");
    return {
      cid:
        "Qm" +
        Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15),
      fileName: "temp-name",
      fileSize: fileBuffer.length,
    };
  },
  cat: async (ipfsHash) => {
    console.log(`-> Mengambil konten file dari IPFS hash: ${ipfsHash}`);
    const dummyBuffer = Buffer.from(
      `Ini adalah konten file terenkripsi yang diambil dari IPFS dengan hash: ${ipfsHash}`
    );
    return dummyBuffer;
  },
};

const uploadFileToIPFS = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "File wajib diunggah." });
  }

  const { entityType, entityID } = req.body;
  const invokerStakeholderID = req.user.stakeholderID;
  const fileBuffer = req.file.buffer;

  try {
    const result = await ipfsClient.add(fileBuffer);
    const ipfsHash = result.cid;
    const fileName = req.file.originalname;
    const fileType = req.file.mimetype;

    const newIPFSFile = await IPFSFile.create({
      fileHash: ipfsHash,
      fileName: fileName,
      fileType: fileType,
      entityType: entityType,
      entityID: entityID,
    });

    console.log("🔗 Mencatat Hash File ke Ledger...");
    await invokeTransaction(
      "KurbanContract:recordFileHash",
      [
        entityID,
        entityType,
        ipfsHash,
        invokerStakeholderID,
        new Date().toISOString(),
      ],
      invokerStakeholderID
    );

    console.log(
      `✅ File ${fileName} berhasil diunggah ke IPFS dan Hash dicatat.`
    );

    res.status(201).json({
      status: "Success",
      message: "File berhasil diunggah dan Hash diverifikasi di Blockchain!",
      data: {
        fileHash: ipfsHash,
        fileName: fileName,
        entityType: entityType,
        entityID: entityID,
      },
    });
  } catch (error) {
    console.error("❌ Gagal mengunggah file ke IPFS/DB:", error);
    res
      .status(500)
      .json({ message: "Gagal memproses unggahan file: " + error.message });
  }
};

const getFileByHash = async (req, res) => {
  const { ipfsHash } = req.params;

  try {
    const fileRecord = await IPFSFile.findByPk(ipfsHash);
    if (!fileRecord) {
      return res.status(404).json({
        message: `Hash ${ipfsHash} tidak ditemukan dalam database referensi.`,
      });
    }

    const fileContentBuffer = await ipfsClient.cat(ipfsHash);

    res.setHeader("Content-Type", fileRecord.fileType);
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${fileRecord.fileName}"`
    );

    console.log(`✅ Berhasil mengambil file ${fileRecord.fileName} dari IPFS.`);
    res.send(fileContentBuffer);
  } catch (error) {
    console.error(`❌ Gagal mengambil file dari IPFS hash ${ipfsHash}:`, error);
    res.status(500).json({
      message:
        "Gagal mengambil file dari IPFS. Hash mungkin tidak valid atau node tidak dapat diakses." +
        error.message,
    });
  }
};

const getFileMetadata = async (req, res) => {
  const { ipfsHash } = req.params;

  try {
    const fileRecord = await IPFSFile.findByPk(ipfsHash, {
      attributes: { exclude: ["createdAt", "updatedAt"] },
    });

    if (!fileRecord) {
      return res
        .status(404)
        .json({ message: `Metadata untuk Hash ${ipfsHash} tidak ditemukan.` });
    }

    console.log(`✅ Metadata file ${fileRecord.fileName} berhasil diambil.`);

    res.status(200).json({
      status: "Success",
      message: "Metadata file (Off-Chain) berhasil diambil.",
      data: fileRecord,
    });
  } catch (error) {
    console.error(`❌ Gagal mengambil metadata file ${ipfsHash}:`, error);
    res
      .status(500)
      .json({ message: "Gagal mengambil data metadata. " + error.message });
  }
};

module.exports = {
  uploadFileToIPFS,
  getFileByHash,
  getFileMetadata,
};
