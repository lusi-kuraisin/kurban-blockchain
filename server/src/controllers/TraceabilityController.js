const {
  Animal,
  HealthRecord,
  SupplyChainMovement,
  SlaughterProcess,
  QualityCheck,
  HalalCertificate,
  Stakeholder,
  HalalInspectorProfile,
  CommitteeProfile,
  DistributorProfile,
} = require("../../models");

const { query } = require("../../invoke");

const getAnimalTraceData = async (animalID) => {
  const animalDetails = await Animal.findByPk(animalID, {
    attributes: { exclude: ["createdAt", "updatedAt"] },
    include: [
      { model: Stakeholder, as: "owner", attributes: ["name", "role"] },
    ],
  });

  if (!animalDetails) {
    return null;
  }

  const healthRecords = await HealthRecord.findAll({
    where: { animalID },
    attributes: { exclude: ["createdAt", "updatedAt"] },
    order: [["checkDate", "DESC"]],
  });

  const movementHistory = await SupplyChainMovement.findAll({
    where: { animalID },
    attributes: { exclude: ["createdAt", "updatedAt"] },
    include: [
      {
        model: DistributorProfile,
        as: "responsibleParty",
        include: [
          {
            model: Stakeholder,
            as: "stakeholder",
            attributes: ["name", "stakeholderID"],
          },
        ],
      },
    ],
    order: [["movementTime", "ASC"]],
  });

  const slaughterDetails = await SlaughterProcess.findOne({
    where: { animalID },
    attributes: { exclude: ["createdAt", "updatedAt"] },
    include: [
      {
        model: Stakeholder,
        as: "slaughterer",
        attributes: ["name", "stakeholderID"],
      },
      {
        model: HalalInspectorProfile,
        as: "supervisor",
        include: [
          {
            model: Stakeholder,
            as: "stakeholder",
            attributes: ["name", "stakeholderID"],
          },
        ],
      },
      { model: HalalCertificate, as: "halalCertificate" },
    ],
  });

  const qualityChecks = await QualityCheck.findAll({
    where: { animalID },
    attributes: { exclude: ["createdAt", "updatedAt"] },
    include: [
      {
        model: CommitteeProfile,
        as: "authorizer",
        include: [
          {
            model: Stakeholder,
            as: "stakeholder",
            attributes: ["name", "stakeholderID"],
          },
        ],
      },
    ],
    order: [["checkDate", "DESC"]],
  });

  return {
    animalDetails: animalDetails.toJSON(),
    healthRecords,
    movementHistory,
    slaughterDetails: slaughterDetails ? slaughterDetails.toJSON() : null,
    qualityChecks,
  };
};

const getFullAnimalTraceability = async (req, res) => {
  const { animalID } = req.params;

  try {
    console.log(`🔍 Memulai full tracing untuk Animal ID: ${animalID}`);

    const traceData = await getAnimalTraceData(animalID);

    if (!traceData) {
      return res.status(404).json({
        message: `Animal ID ${animalID} tidak ditemukan dalam sistem.`,
      });
    }

    console.log(
      `✅ Data tracing off-chain lengkap untuk ${animalID} berhasil diambil.`
    );

    res.status(200).json({
      status: "Success",
      message:
        "Laporan jejak rantai pasok lengkap (Off-Chain) berhasil dikonsolidasikan.",
      data: traceData,
    });
  } catch (error) {
    console.error(
      `❌ Gagal mendapatkan full traceability untuk ${animalID}:`,
      error
    );
    res.status(500).json({
      message: "Gagal memproses permintaan tracing: " + error.message,
    });
  }
};

const getBlockchainHistory = async (req, res) => {
  const { animalID } = req.params;
  const invokerStakeholderID = req.user ? req.user.stakeholderID : "Auditor";

  try {
    console.log(
      `🔗 Memanggil riwayat transaksi Blockchain untuk Animal ID: ${animalID}`
    );

    const blockchainHistory = await query(
      "getAssetHistory",
      [animalID],
      invokerStakeholderID
    );

    const parsedHistory = JSON.parse(blockchainHistory);

    console.log(`✅ Riwayat Blockchain untuk ${animalID} berhasil diambil.`);

    res.status(200).json({
      status: "Success",
      message: "Riwayat transaksi Immutable (Blockchain) berhasil diambil.",
      data: parsedHistory,
    });
  } catch (error) {
    console.error(
      `❌ Gagal mendapatkan riwayat Blockchain untuk ${animalID}:`,
      error
    );

    res.status(500).json({
      message:
        "Gagal memproses query Blockchain. Pastikan Animal ID benar dan jaringan Fabric aktif: " +
        error.message,
    });
  }
};

module.exports = {
  getFullAnimalTraceability,
  getBlockchainHistory,
};
