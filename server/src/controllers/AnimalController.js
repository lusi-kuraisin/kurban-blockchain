const { validationResult } = require("express-validator");
const { Animal, FarmerProfile, Stakeholder } = require("../../models");
const QRCode = require("qrcode");

const { invokeTransaction, query } = require("../../invoke");

const registerAnimal = async (req, res) => {
  const farmerStakeholderID = req.user.stakeholderID;
  const { species, birthDate, breed, gender, weight } = req.body;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ status: "Failed", errors: errors.array() });
  }

  const { v4: uuidv4 } = await import("uuid");

  const animalID = uuidv4();
  const registeredAt = new Date().toISOString();

  // const qrCodeContent = `ANIMAL-${animalID}`;

  // const qrCodeDataUrl = await QRCode.toDataURL(qrCodeContent);

  const qrCode = "data:image/png;base64,iVBORw0KGgoAAAA";

  try {
    const farmerProfile = await FarmerProfile.findOne({
      where: { stakeholderId: farmerStakeholderID },
      attributes: ["id"],
    });

    if (!farmerProfile) {
      return res.status(403).json({
        message: "Akses Ditolak: User ini bukan Farmer yang terdaftar.",
      });
    }
    const farmerProfileId = farmerProfile.id;

    console.log("🔗 Mengirim transaksi 'createAnimal' ke Ledger...");
    await invokeTransaction(
      "KurbanContract:createAnimal",
      [
        animalID,
        species,
        breed,
        birthDate,
        farmerStakeholderID,
        weight.toString(),
        registeredAt,
      ],
      farmerStakeholderID
    );

    const newAnimal = await Animal.create({
      animalID,
      qrCode,
      species,
      birthDate,
      breed,
      gender,
      weight,
      healthStatus: "Sehat",
      currentLocation: "Farm (Initial)",
      status: "Di Peternak",
      farmerProfileId,
    });

    console.log(
      `✅ Hewan ${animalID} berhasil didaftarkan On-Chain dan Off-Chain.`
    );
    res.status(201).json({
      status: "Success",
      message: "Data hewan berhasil didaftarkan!",
      data: newAnimal,
      blockchain_tx: "TX_ID_DARI_FABRIC_SDK",
    });
  } catch (error) {
    console.error("❌ Gagal mendaftarkan hewan:", error);
    res
      .status(500)
      .json({ message: "Gagal memproses pendaftaran hewan: " + error.message });
  }
};

const getAllAnimals = async (req, res) => {
  const { status, species, farmerId } = req.query;

  let where = {};
  if (status) where.status = status;
  if (species) where.species = species;

  if (farmerId) where.farmerProfileId = farmerId;

  try {
    const animals = await Animal.findAll({
      where,
      include: [
        {
          model: FarmerProfile,
          as: "owner",
          include: [
            {
              model: Stakeholder,
              as: "stakeholder",
              attributes: ["name", "email"],
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    console.log(`✅ ${animals.length} data hewan berhasil diambil.`);
    res.status(200).json({
      status: "Success",
      message: "Daftar hewan berhasil diambil.",
      data: animals,
    });
  } catch (error) {
    console.error("❌ Gagal mengambil daftar hewan:", error);
    res.status(500).json({ message: "Gagal mengambil data. " + error.message });
  }
};

const getAnimalById = async (req, res) => {
  const { animalID } = req.params;

  try {
    console.log("🔗 Query status aset terkini dari Ledger...");
    let onChainState = {};
    try {
      const resultBuffer = await query("KurbanContract:readAsset", [animalID]);
      onChainState = JSON.parse(resultBuffer);
    } catch (chainError) {
      console.warn(
        "⚠️ Gagal query Ledger. Mengandalkan data Off-Chain:",
        chainError.message
      );
    }

    const animal = await Animal.findByPk(animalID, {
      include: [
        "owner",
        "healthRecords",
        "vaccinations",
        "slaughterProcess",
        "halalCertificate",
      ],
    });

    if (!animal) {
      return res
        .status(404)
        .json({ message: `Hewan dengan ID ${animalID} tidak ditemukan.` });
    }

    const combinedData = {
      ...animal.toJSON(),
      currentLocation: onChainState.currentLocation || animal.currentLocation,
      healthStatus: onChainState.healthStatus || animal.healthStatus,
      status: onChainState.status || animal.status,
      fitForSacrifice: onChainState.fitForSacrifice || false,
      onChainStatus: onChainState,
    };

    console.log(
      `✅ Detail hewan ${animalID} berhasil digabung dari DB & Ledger.`
    );
    res.status(200).json({
      status: "Success",
      message: "Detail hewan berhasil diambil.",
      data: combinedData,
    });
  } catch (error) {
    console.error(`❌ Gagal mengambil detail hewan ${animalID}:`, error);
    res
      .status(500)
      .json({ message: "Gagal mengambil detail data. " + error.message });
  }
};

const updateAnimalInfo = async (req, res) => {
  const { animalID } = req.params;
  const { weight, breed } = req.body;

  try {
    const animal = await Animal.findByPk(animalID);
    if (!animal) {
      return res
        .status(404)
        .json({ message: `Hewan ID ${animalID} tidak ditemukan.` });
    }

    const [rowsUpdated, [updatedAnimal]] = await Animal.update(
      { weight, breed },
      { where: { animalID }, returning: true }
    );

    if (rowsUpdated === 0) {
      return res.status(400).json({ message: "Tidak ada data yang diubah." });
    }

    console.log(
      `🔄 Data non-kritis hewan ${animalID} berhasil diperbarui (Off-Chain).`
    );
    res.status(200).json({
      status: "Success",
      message: "Data hewan berhasil diperbarui.",
      data: updatedAnimal,
    });
  } catch (error) {
    console.error(`❌ Gagal update hewan ${animalID}:`, error);
    res
      .status(500)
      .json({ message: "Gagal memperbarui data. " + error.message });
  }
};

const getAnimalHistory = async (req, res) => {
  const { animalID } = req.params;

  try {
    console.log("🔗 Meminta riwayat audit penuh dari Ledger...");
    const historyBuffer = await query("getAssetHistory", [animalID]);
    const history = JSON.parse(historyBuffer);

    if (!history || history.length === 0) {
      return res.status(404).json({
        message: `Riwayat hewan dengan ID ${animalID} tidak ditemukan di Ledger.`,
      });
    }

    console.log(`✅ Riwayat audit ${animalID} berhasil diambil.`);

    res.status(200).json({
      status: "Success",
      message: "Riwayat pelacakan lengkap dari Blockchain.",
      data: history,
    });
  } catch (error) {
    console.error(`❌ Gagal mengambil riwayat hewan ${animalID}:`, error);
    res.status(500).json({
      message: "Gagal mengambil riwayat dari Ledger. " + error.message,
    });
  }
};

module.exports = {
  registerAnimal,
  getAllAnimals,
  getAnimalById,
  updateAnimalInfo,
  getAnimalHistory,
};
