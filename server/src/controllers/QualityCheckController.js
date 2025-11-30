const {
  Animal,
  QualityCheck,
  CommitteeProfile,
  Stakeholder,
} = require("../../models");

const { invokeTransaction } = require("../../invoke");

const getCommitteeProfileId = async (stakeholderID) => {
  const committeeProfile = await CommitteeProfile.findOne({
    where: { stakeholderId: stakeholderID },
    attributes: ["id"],
  });
  if (!committeeProfile) {
    throw new Error("User bukan Komite atau Supervisor QC yang terdaftar.");
  }
  return committeeProfile.id;
};

const recordQualityCheck = async (req, res) => {
  const qcStakeholderID = req.user.stakeholderID;
  const { animalID, checkType, parameters, results, passed, inspector } =
    req.body;

  try {
    const committeeId = await getCommitteeProfileId(qcStakeholderID);
    const animal = await Animal.findByPk(animalID);

    if (!animal) {
      return res
        .status(404)
        .json({ message: `Hewan ID ${animalID} tidak ditemukan.` });
    }
    if (animal.status !== "Certified Carcass") {
      return res.status(400).json({
        message: `Hewan belum berstatus Certified Carcass. Status: ${animal.status}`,
      });
    }
    const { v4: uuidv4 } = await import("uuid");

    const checkID = uuidv4();
    const checkDate = new Date().toISOString();

    console.log("🔗 Mengirim transaksi 'recordQualityCheck' ke Ledger...");
    await invokeTransaction(
      "KurbanContract:recordQualityCheck",
      [
        animalID,
        checkID,
        qcStakeholderID,
        checkType,
        passed.toString(),
        checkDate,
      ],
      qcStakeholderID
    );

    const newQC = await QualityCheck.create({
      checkID,
      animalID,
      checkType,
      checkDate,
      parameters,
      results,
      passed,
      inspector,
      committeeId,
    });

    console.log(
      `✅ Pemeriksaan kualitas (${checkType}) untuk ${animalID} berhasil dicatat.`
    );
    res.status(201).json({
      status: "Success",
      message: "Pemeriksaan kualitas berhasil dicatat dan diverifikasi!",
      data: newQC,
    });
  } catch (error) {
    console.error("❌ Gagal mencatat pemeriksaan kualitas:", error);
    res.status(500).json({
      message: "Gagal memproses pemeriksaan kualitas: " + error.message,
    });
  }
};

const finalizeQCStatus = async (req, res) => {
  const qcStakeholderID = req.user.stakeholderID;
  const { checkID } = req.params;
  const { finalPassed, finalRemarks } = req.body;

  try {
    const committeeId = await getCommitteeProfileId(qcStakeholderID);

    const qcRecord = await QualityCheck.findByPk(checkID);
    if (!qcRecord) {
      return res
        .status(404)
        .json({ message: `Catatan QC ID ${checkID} tidak ditemukan.` });
    }

    const animal = await Animal.findByPk(qcRecord.animalID);
    if (!animal) {
      return res
        .status(404)
        .json({ message: `Hewan ID ${qcRecord.animalID} tidak ditemukan.` });
    }

    const finalDate = new Date().toISOString();
    const newAnimalStatus = finalPassed ? "Ready for Distribution" : "Rejected";

    console.log("🔗 Mengirim transaksi 'updateFinalQCStatus' ke Ledger...");
    await invokeTransaction(
      "KurbanContract:updateFinalQCStatus",
      [animal.animalID, checkID, qcStakeholderID, newAnimalStatus, finalDate],
      qcStakeholderID
    );

    await qcRecord.update({
      passed: finalPassed,
      results: `${qcRecord.results || ""} | FINAL STATUS: ${
        finalPassed ? "LULUS" : "GAGAL"
      }. Remarks: ${finalRemarks || "-"}`,
      checkType: `Final Quality Check (${finalPassed ? "LULUS" : "GAGAL"})`,
      checkDate: finalDate,
    });

    await animal.update({
      status: newAnimalStatus,
      currentLocation: `${animal.currentLocation} (${newAnimalStatus})`,
    });

    console.log(
      `✅ Status QC final ${animal.animalID} berhasil diperbarui menjadi ${newAnimalStatus}.`
    );
    res.status(200).json({
      status: "Success",
      message: `Pemeriksaan kualitas akhir berhasil dicatat. Status Hewan: ${newAnimalStatus}`,
      data: qcRecord,
    });
  } catch (error) {
    console.error("❌ Gagal memfinalisasi status QC:", error);
    res
      .status(500)
      .json({ message: "Gagal memproses finalisasi QC: " + error.message });
  }
};

const getQualityCheckHistory = async (req, res) => {
  const { animalID } = req.params;

  try {
    const qcHistory = await QualityCheck.findAll({
      where: { animalID },
      include: [
        {
          model: CommitteeProfile,
          as: "authorizer",
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
      order: [["checkDate", "DESC"]],
    });

    if (!qcHistory.length) {
      return res.status(404).json({
        message: `Tidak ada riwayat pemeriksaan kualitas ditemukan untuk hewan ${animalID}.`,
      });
    }

    console.log(`✅ Riwayat QC untuk ${animalID} berhasil diambil.`);

    res.status(200).json({
      status: "Success",
      message: "Riwayat pemeriksaan kualitas (Off-Chain) berhasil diambil.",
      data: qcHistory,
    });
  } catch (error) {
    console.error(`❌ Gagal mengambil riwayat QC ${animalID}:`, error);
    res.status(500).json({ message: "Gagal mengambil data. " + error.message });
  }
};

module.exports = {
  recordQualityCheck,
  finalizeQCStatus,
  getQualityCheckHistory,
};
