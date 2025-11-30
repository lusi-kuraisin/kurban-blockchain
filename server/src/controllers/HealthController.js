const { validationResult } = require("express-validator");
const {
  Animal,
  HealthRecord,
  Vaccination,
  VetProfile,
  Stakeholder,
} = require("../../models");

const { invokeTransaction } = require("../../invoke");

const getVetProfileId = async (stakeholderID) => {
  const vetProfile = await VetProfile.findOne({
    where: { stakeholderId: stakeholderID },
    attributes: ["id"],
  });
  if (!vetProfile) {
    throw new Error("User bukan Dokter Hewan yang terdaftar.");
  }
  return vetProfile.id;
};

const recordVaccination = async (req, res) => {
  const vetStakeholderID = req.user.stakeholderID;
  const { animalID, vaccineType, vaccinationDate, nextDueDate, batchNumber } =
    req.body;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ status: "Failed", errors: errors.array() });
  }

  try {
    const administeringVetId = await getVetProfileId(vetStakeholderID);
    const animal = await Animal.findByPk(animalID);

    if (!animal) {
      return res
        .status(404)
        .json({ message: `Hewan ID ${animalID} tidak ditemukan.` });
    }

    const timestamp = new Date().toISOString();

    console.log("🔗 Mengirim transaksi 'recordVaccination' ke Ledger...");
    await invokeTransaction(
      "KurbanContract:recordVaccination",
      [
        animalID,
        vetStakeholderID,
        vaccineType,
        vaccinationDate,
        batchNumber,
        timestamp,
      ],
      vetStakeholderID
    );

    const newVaccination = await Vaccination.create({
      animalID,
      vaccineType,
      vaccinationDate,
      nextDueDate,
      batchNumber,
      administeringVetId,
    });

    // await animal.update({ healthStatus: 'Sehat' });

    console.log(`✅ Vaksinasi untuk ${animalID} berhasil dicatat.`);
    res.status(201).json({
      status: "Success",
      message: "Vaksinasi berhasil dicatat dan diverifikasi!",
      data: newVaccination,
    });
  } catch (error) {
    console.error("❌ Gagal mencatat vaksinasi:", error);
    res
      .status(500)
      .json({ message: "Gagal memproses vaksinasi: " + error.message });
  }
};

const recordHealthCheck = async (req, res) => {
  const vetStakeholderID = req.user.stakeholderID;
  const {
    animalID,
    examinationDate,
    temperature,
    heartRate,
    weight,
    diagnosis,
    treatment,
    remarks,
    fitForSacrifice,
    vetSignature,
  } = req.body;

  try {
    const vetId = await getVetProfileId(vetStakeholderID);
    const animal = await Animal.findByPk(animalID);

    if (!animal) {
      return res
        .status(404)
        .json({ message: `Hewan ID ${animalID} tidak ditemukan.` });
    }

    const timestamp = new Date().toISOString();
    const newHealthStatus = fitForSacrifice
      ? "Fit for Sacrifice"
      : diagnosis
      ? "Observasi"
      : "Sehat";

    console.log("🔗 Mengirim transaksi 'recordHealthCheck' ke Ledger...");
    await invokeTransaction(
      "KurbanContract:recordHealthCheck",
      [
        animalID,
        vetStakeholderID,
        newHealthStatus,
        fitForSacrifice.toString(),
        timestamp,
      ],
      vetStakeholderID
    );

    const newRecord = await HealthRecord.create({
      animalID,
      vetId,
      examinationDate,
      temperature,
      heartRate,
      weight,
      fitForSacrifice,
      diagnosis,
      treatment,
      remarks,
      vetSignature,
    });

    await animal.update({ healthStatus: newHealthStatus });

    console.log(`✅ Pemeriksaan kesehatan ${animalID} berhasil dicatat.`);
    res.status(201).json({
      status: "Success",
      message: `Pemeriksaan kesehatan berhasil dicatat. Status: ${newHealthStatus}`,
      data: newRecord,
    });
  } catch (error) {
    console.error("❌ Gagal mencatat pemeriksaan kesehatan:", error);
    res
      .status(500)
      .json({ message: "Gagal memproses pemeriksaan: " + error.message });
  }
};

const certifyFitForSacrifice = async (req, res) => {
  const { animalID } = req.params;
  const vetStakeholderID = req.user.stakeholderID;

  try {
    const vetId = await getVetProfileId(vetStakeholderID);
    const animal = await Animal.findByPk(animalID);

    if (!animal) {
      return res
        .status(404)
        .json({ message: `Hewan ID ${animalID} tidak ditemukan.` });
    }

    if (
      animal.healthStatus === "Sakit" ||
      animal.healthStatus === "Fit for Sacrifice"
    ) {
      return res.status(400).json({
        message: `Hewan berstatus ${animal.healthStatus}. Tidak bisa disahkan.`,
      });
    }

    const timestamp = new Date().toISOString();

    console.log("🔗 Mengirim transaksi 'certifyAnimalFit' ke Ledger...");
    await invokeTransaction(
      "KurbanContract:certifyAnimalFit",
      [
        animalID,
        vetStakeholderID,
        timestamp,
        "Animal certified based on final check.",
      ],
      vetStakeholderID
    );

    await animal.update({
      healthStatus: "Fit for Sacrifice",
      status: "Siap Sembelih",
    });

    console.log(`✅ Hewan ${animalID} berhasil disahkan (Fit for Sacrifice).`);

    res.status(200).json({
      status: "Success",
      message:
        "Hewan berhasil disertifikasi Fit for Sacrifice dan siap untuk penyembelihan!",
      data: animal,
    });
  } catch (error) {
    console.error("❌ Gagal mensertifikasi hewan:", error);
    res
      .status(500)
      .json({ message: "Gagal memproses sertifikasi: " + error.message });
  }
};

const getHealthRecords = async (req, res) => {
  const { animalID } = req.params;

  try {
    const healthRecords = await HealthRecord.findAll({
      where: { animalID },
      include: [
        {
          model: VetProfile,
          as: "examiner",
          attributes: ["id"],
          include: [
            {
              model: Stakeholder,
              as: "stakeholder",
              attributes: ["name", "email"],
            },
          ],
        },
      ],
      order: [["examinationDate", "DESC"]],
    });

    const vaccinations = await Vaccination.findAll({
      where: { animalID },
      include: [
        {
          model: VetProfile,
          as: "administeringVet",
          attributes: ["id"],
          include: [
            {
              model: Stakeholder,
              as: "stakeholder",
              attributes: ["name", "email"],
            },
          ],
        },
      ],
      order: [["vaccinationDate", "DESC"]],
    });

    if (!healthRecords.length && !vaccinations.length) {
      return res.status(404).json({
        message: `Tidak ada riwayat kesehatan/vaksinasi ditemukan untuk hewan ${animalID}.`,
      });
    }

    console.log(`✅ Riwayat kesehatan untuk ${animalID} berhasil diambil.`);

    res.status(200).json({
      status: "Success",
      message: "Riwayat kesehatan dan vaksinasi (Off-Chain) berhasil diambil.",
      data: {
        healthChecks: healthRecords,
        vaccinations: vaccinations,
      },
    });
  } catch (error) {
    console.error(`❌ Gagal mengambil riwayat kesehatan ${animalID}:`, error);
    res.status(500).json({ message: "Gagal mengambil data. " + error.message });
  }
};

module.exports = {
  recordVaccination,
  recordHealthCheck,
  certifyFitForSacrifice,
  getHealthRecords,
};
