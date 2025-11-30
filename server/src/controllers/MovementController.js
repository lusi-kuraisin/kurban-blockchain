const {
  Animal,
  SupplyChainMovement,
  DistributorProfile,
  Stakeholder,
} = require("../../models");

const { invokeTransaction } = require("../../invoke");

const getDistributorProfileId = async (stakeholderID) => {
  const distributorProfile = await DistributorProfile.findOne({
    where: { stakeholderId: stakeholderID },
    attributes: ["id"],
  });
  if (!distributorProfile) {
    throw new Error("User bukan Distributor yang terdaftar.");
  }
  return distributorProfile.id;
};

const startMovement = async (req, res) => {
  const distributorStakeholderID = req.user.stakeholderID;
  const { animalID, fromLocation, toLocation, transportConditions } = req.body;

  try {
    const responsiblePartyId = await getDistributorProfileId(
      distributorStakeholderID
    );
    const animal = await Animal.findByPk(animalID);

    if (!animal) {
      return res
        .status(404)
        .json({ message: `Hewan ID ${animalID} tidak ditemukan.` });
    }
    if (
      animal.status !== "Di Peternak" &&
      animal.status !== "Di Transit Area"
    ) {
      return res.status(400).json({
        message: `Hewan berstatus '${animal.status}'. Tidak bisa memulai pergerakan baru.`,
      });
    }
    const { v4: uuidv4 } = await import("uuid");

    const movementiD = uuidv4();
    const movementTime = new Date().toISOString();
    const newStatus = "In Transit";

    console.log("🔗 Mengirim transaksi 'recordMovementStart' ke Ledger...");
    await invokeTransaction(
      "KurbanContract:recordMovementStart",
      [
        animalID,
        movementiD,
        distributorStakeholderID,
        fromLocation,
        toLocation,
        newStatus,
        movementTime,
      ],
      distributorStakeholderID
    );

    const newMovement = await SupplyChainMovement.create({
      movementiD,
      animalID,
      fromLocation,
      toLocation,
      movementTime,
      transportConditions,
      responsiblePartyId,
    });

    await animal.update({
      status: newStatus,
      currentLocation: `${fromLocation} -> ${toLocation} (In Transit)`,
    });

    console.log(`✅ Pergerakan ${animalID} berhasil dimulai.`);
    res.status(201).json({
      status: "Success",
      message: "Pergerakan berhasil dicatat dan diverifikasi!",
      data: newMovement,
    });
  } catch (error) {
    console.error("❌ Gagal memulai pergerakan:", error);
    res
      .status(500)
      .json({ message: "Gagal memproses pergerakan: " + error.message });
  }
};

const recordArrival = async (req, res) => {
  const receiverStakeholderID = req.user.stakeholderID;
  const { movementID } = req.params;
  const { arrivalCondition, receiverSignature } = req.body;

  try {
    const movement = await SupplyChainMovement.findByPk(movementID);
    if (!movement) {
      return res
        .status(404)
        .json({ message: `Log Pergerakan ID ${movementID} tidak ditemukan.` });
    }

    const animal = await Animal.findByPk(movement.animalID);
    if (!animal) {
      return res
        .status(404)
        .json({ message: `Hewan ID ${movement.animalID} tidak ditemukan.` });
    }
    if (animal.status !== "In Transit") {
      return res
        .status(400)
        .json({ message: `Hewan tidak dalam status In Transit.` });
    }

    const arrivalTime = new Date().toISOString();
    const newStatus = "Di RPH/RPU";

    console.log("🔗 Mengirim transaksi 'recordMovementArrival' ke Ledger...");
    await invokeTransaction(
      "KurbanContract:recordMovementArrival",
      [
        movement.animalID,
        movementID,
        receiverStakeholderID,
        movement.toLocation,
        newStatus,
        arrivalTime,
      ],
      receiverStakeholderID
    );

    await movement.update({
      arrivalTime: arrivalTime,
      arrivalCondition: arrivalCondition,
      receiverSignature: receiverSignature,
    });

    await animal.update({
      status: newStatus,
      currentLocation: movement.toLocation,
    });

    console.log(
      `✅ Hewan ${animal.animalID} sukses tiba di ${movement.toLocation}.`
    );
    res.status(200).json({
      status: "Success",
      message: "Kedatangan hewan berhasil dicatat dan diverifikasi!",
      data: movement,
    });
  } catch (error) {
    console.error("❌ Gagal mencatat kedatangan:", error);
    res
      .status(500)
      .json({ message: "Gagal memproses kedatangan: " + error.message });
  }
};

const getMovementHistory = async (req, res) => {
  const { animalID } = req.params;

  try {
    const movements = await SupplyChainMovement.findAll({
      where: { animalID },
      include: [
        {
          model: DistributorProfile,
          as: "responsibleParty",
          attributes: ["id", "licenseNumber"],
          include: [
            {
              model: Stakeholder,
              as: "stakeholder",
              attributes: ["name", "email"],
            },
          ],
        },
      ],
      order: [["movementTime", "ASC"]],
    });

    if (!movements.length) {
      return res.status(404).json({
        message: `Tidak ada riwayat pergerakan ditemukan untuk hewan ${animalID}.`,
      });
    }

    console.log(`✅ Riwayat logistik untuk ${animalID} berhasil diambil.`);

    res.status(200).json({
      status: "Success",
      message: "Riwayat pergerakan logistik (Off-Chain) berhasil diambil.",
      data: movements,
    });
  } catch (error) {
    console.error(`❌ Gagal mengambil riwayat pergerakan ${animalID}:`, error);
    res.status(500).json({ message: "Gagal mengambil data. " + error.message });
  }
};

module.exports = {
  startMovement,
  recordArrival,
  getMovementHistory,
};
