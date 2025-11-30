const {
  Animal,
  SlaughterProcess,
  HalalInspectorProfile,
  HalalCertificate,
  Stakeholder,
} = require("../../models");

const { invokeTransaction } = require("../../invoke");

const getInspectorProfileId = async (stakeholderID) => {
  const inspectorProfile = await HalalInspectorProfile.findOne({
    where: { stakeholderId: stakeholderID },
    attributes: ["id"],
  });
  if (!inspectorProfile) {
    throw new Error("User bukan Halal Inspector yang terdaftar.");
  }
  return inspectorProfile.id;
};

const startSlaughterProcess = async (req, res) => {
  const { animalID, supervisorId, location, method } = req.body;
  const initiatorStakeholderID = req.user.stakeholderID;

  try {
    const animal = await Animal.findByPk(animalID);
    if (!animal) {
      return res
        .status(404)
        .json({ message: `Hewan ID ${animalID} tidak ditemukan.` });
    }
    if (
      animal.healthStatus !== "Fit for Sacrifice" ||
      animal.status !== "Di RPH/RPU"
    ) {
      return res
        .status(400)
        .json({ message: `Hewan tidak siap atau tidak di lokasi RPH/RPU.` });
    }

    const existingProcess = await SlaughterProcess.findOne({
      where: { animalID },
    });
    if (existingProcess) {
      return res
        .status(400)
        .json({ message: "Proses penyembelihan sudah dimulai atau selesai." });
    }

    const slaughterTime = new Date().toISOString();
    const { v4: uuidv4 } = await import("uuid");

    const processID = uuidv4();

    await invokeTransaction(
      "KurbanContract:startSlaughterProcess",
      [
        animalID,
        processID,
        initiatorStakeholderID,
        initiatorStakeholderID,
        location,
        slaughterTime,
      ],
      initiatorStakeholderID
    );

    const newProcess = await SlaughterProcess.create({
      processID,
      animalID,
      slaughtererId: initiatorStakeholderID,
      slaughterTime: slaughterTime,
      location,
      method,
      supervisorId: supervisorId,
    });

    await animal.update({
      status: "Slaughter Process",
      currentLocation: location,
    });

    console.log(`✅ Proses penyembelihan ${animalID} berhasil dimulai.`);
    res.status(201).json({
      status: "Success",
      message: "Proses penyembelihan berhasil diinisiasi!",
      data: newProcess,
    });
  } catch (error) {
    console.error("❌ Gagal memulai proses penyembelihan:", error);
    res.status(500).json({
      message: "Gagal memproses inisiasi penyembelihan: " + error.message,
    });
  }
};

const certifyHalalSlaughter = async (req, res) => {
  const halalInspectorStakeholderID = req.user.stakeholderID;
  const { animalID } = req.params;

  const {
    islamicCompliant,
    slaughterMethod,
    qiblaDirection,
    tasmiyahRecited,
    inspectorSignature,
    expiryDate,
  } = req.body;

  try {
    const supervisorId = await getInspectorProfileId(
      halalInspectorStakeholderID
    );
    const animal = await Animal.findByPk(animalID);
    const process = await SlaughterProcess.findOne({ where: { animalID } });

    if (!animal || !process) {
      return res.status(404).json({
        message: `Hewan ID ${animalID} atau Proses Penyembelihan tidak ditemukan.`,
      });
    }
    if (process.supervisorId !== null) {
      return res
        .status(400)
        .json({ message: "Proses ini sudah selesai dan disertifikasi." });
    }

    const certificationTime = new Date().toISOString();
    const finalStatus = islamicCompliant
      ? "Certified Carcass"
      : "Non-Compliant";
    const certificateStatus = islamicCompliant ? "Issued" : "Failed";

    console.log("🔗 Mengirim transaksi 'recordHalalSlaughter' ke Ledger...");
    await invokeTransaction(
      "KurbanContract:recordHalalSlaughter",
      [
        animalID,
        process.processID,
        halalInspectorStakeholderID,
        process.slaughtererId,
        islamicCompliant.toString(),
        certificationTime,
        require("crypto")
          .createHash("sha256")
          .update(JSON.stringify(req.body))
          .digest("hex"),
      ],
      halalInspectorStakeholderID
    );

    await process.update({
      islamicCompliant,
      supervisorId,
      method: slaughterMethod || process.method,
    });

    const { v4: uuidv4 } = await import("uuid");

    const newCertificate = await HalalCertificate.create({
      certificatelD: uuidv4(),
      animalID,
      inspectorId: supervisorId,
      issueDate: certificationTime,
      expiryDate: expiryDate,
      slaughterMethod: slaughterMethod || process.method,
      qiblaDirection,
      tasmiyahRecited,
      slaughtererID: process.slaughtererId,
      status: certificateStatus,
      inspectorSignature,
      slaughterProcessId: process.processID,
    });

    await animal.update({
      status: finalStatus,
      currentLocation: `${process.location} (${certificateStatus})`,
    });

    console.log(
      `✅ Hewan ${animalID} berhasil disertifikasi Halal: ${islamicCompliant}.`
    );
    res.status(200).json({
      status: "Success",
      message:
        "Penyembelihan berhasil disertifikasi dan dicatat di Blockchain!",
      data: { slaughterProcess: process, certificate: newCertificate },
    });
  } catch (error) {
    console.error("❌ Gagal mensertifikasi penyembelihan:", error);
    res
      .status(500)
      .json({ message: "Gagal memproses sertifikasi: " + error.message });
  }
};

const getSlaughterDetails = async (req, res) => {
  const { animalID } = req.params;

  try {
    const slaughterProcess = await SlaughterProcess.findOne({
      where: { animalID },
      include: [
        "slaughterer",
        {
          model: HalalInspectorProfile,
          as: "supervisor",
          include: [
            {
              model: Stakeholder,
              as: "stakeholder",
              attributes: ["name", "email"],
            },
          ],
        },
        "halalCertificate",
      ],
    });

    if (!slaughterProcess) {
      return res.status(404).json({
        message: `Tidak ada riwayat penyembelihan ditemukan untuk hewan ${animalID}.`,
      });
    }

    console.log(`✅ Detail penyembelihan untuk ${animalID} berhasil diambil.`);

    res.status(200).json({
      status: "Success",
      message: "Detail proses penyembelihan dan sertifikasi halal.",
      data: slaughterProcess,
    });
  } catch (error) {
    console.error(
      `❌ Gagal mengambil detail penyembelihan ${animalID}:`,
      error
    );
    res.status(500).json({ message: "Gagal mengambil data. " + error.message });
  }
};

module.exports = {
  startSlaughterProcess,
  certifyHalalSlaughter,
  getSlaughterDetails,
};
