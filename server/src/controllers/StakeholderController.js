require("dotenv").config();
const {
  Stakeholder,
  FarmerProfile,
  VetProfile,
  DistributorProfile,
  HalalInspectorProfile,
  CommitteeProfile,
} = require("../../models");

const { deleteWallet } = require("../../scripts/enrollUserDynamic");
const { invokeTransaction } = require("../../invoke");

const profileModelMap = {
  Farmer: FarmerProfile,
  Vet: VetProfile,
  Distributor: DistributorProfile,
  HalalInspector: HalalInspectorProfile,
  Committee: CommitteeProfile,
};

const getIncludeOptions = (role) => {
  const profileModel = profileModelMap[role];
  if (profileModel) {
    return [
      {
        model: profileModel,
        as: `${role}Profile`,
      },
    ];
  }
  return [];
};

const getAllStakeholders = async (req, res) => {
  try {
    const stakeholders = await Stakeholder.findAll({
      include: Object.keys(profileModelMap).map((role) => ({
        model: profileModelMap[role],
        as: `${role}Profile`,
        required: false,
      })),
      attributes: { exclude: ["password"] },
    });

    console.log(`✅ ${stakeholders.length} Stakeholder berhasil diambil.`);
    res.status(200).json({
      status: "Success",
      message: "Data semua stakeholder berhasil diambil.",
      data: stakeholders,
    });
  } catch (error) {
    console.error("❌ Gagal mengambil daftar stakeholder:", error);
    res.status(500).json({ message: "Gagal mengambil data. " + error.message });
  }
};

const getStakeholderById = async (req, res) => {
  const { id } = req.params;

  try {
    const basicStakeholder = await Stakeholder.findOne({
      where: { stakeholderID: id },
      attributes: ["role"],
    });

    if (!basicStakeholder) {
      return res
        .status(404)
        .json({ message: `Stakeholder ID ${id} tidak ditemukan, Sayang!` });
    }

    const includeOptions = getIncludeOptions(basicStakeholder.role);

    const finalStakeholder = await Stakeholder.findOne({
      where: { stakeholderID: id },
      include: includeOptions,
      attributes: { exclude: ["password"] },
    });

    console.log(
      `✅ Data Stakeholder ${finalStakeholder.name} berhasil diambil.`
    );
    res.status(200).json({
      status: "Success",
      message: "Detail stakeholder berhasil diambil.",
      data: finalStakeholder,
    });
  } catch (error) {
    console.error(`❌ Gagal mengambil stakeholder ${id}:`, error);
    res
      .status(500)
      .json({ message: "Gagal mengambil detail data. " + error.message });
  }
};

const updateStakeholder = async (req, res) => {
  const { id } = req.params;
  const { name, phone, address, photo_url } = req.body;

  try {
    const stakeholder = await Stakeholder.findByPk(id);
    if (!stakeholder) {
      return res
        .status(404)
        .json({ message: `Stakeholder ID ${id} tidak ditemukan.` });
    }

    const updatedStakeholder = await stakeholder.update({
      name,
      contactInfo: phone,
      address,
      photo_url,
    });

    console.log(`🔄 Stakeholder ${id} berhasil diperbarui (Off-Chain).`);
    res.status(200).json({
      status: "Success",
      message: "Data Stakeholder berhasil diperbarui.",
      data: updatedStakeholder,
    });
  } catch (error) {
    console.error(`❌ Gagal update stakeholder ${id}:`, error);
    res
      .status(500)
      .json({ message: "Gagal memperbarui data. " + error.message });
  }
};

const deleteStakeholder = async (req, res) => {
  const { id } = req.params;

  try {
    const stakeholder = await Stakeholder.findByPk(id);
    if (!stakeholder) {
      return res
        .status(404)
        .json({ message: `Stakeholder ID ${id} tidak ditemukan.` });
    }

    await deleteWallet(id);

    try {
      await invokeTransaction(
        "KurbanContract:updateStakeholderStatus",
        [id, "inactive", new Date().toISOString()],
        "admin"
      );
    } catch (chainError) {
      console.warn(
        "⚠️ Gagal mencatat status 'inactive' di Blockchain:",
        chainError.message
      );
    }

    await stakeholder.update({ status: "inactive" });

    // const profileModel = profileModelMap[stakeholder.role];
    // if (profileModel) {
    //   await profileModel.destroy({ where: { stakeholderID: id } });
    // }
    await Stakeholder.destroy({ where: { stakeholderID: id } });

    console.log(`💣 Stakeholder ${id} dinonaktifkan dan Wallet dihapus.`);
    res.status(200).json({
      status: "Success",
      message: "Stakeholder berhasil dinonaktifkan/dihapus (Soft Delete).",
    });
  } catch (error) {
    console.error(`❌ Gagal menghapus stakeholder ${id}:`, error);
    res.status(500).json({ message: "Gagal menghapus data. " + error.message });
  }
};

const toggleVerification = async (req, res) => {
  const { id } = req.params;
  const { verifiedStatus } = req.body;

  try {
    const stakeholder = await Stakeholder.findByPk(id);
    if (!stakeholder) {
      return res
        .status(404)
        .json({ message: `Stakeholder ID ${id} tidak ditemukan.` });
    }

    await stakeholder.update({ verified: verifiedStatus });

    console.log(`✅ Status verifikasi ${id} diubah menjadi ${verifiedStatus}.`);

    res.status(200).json({
      status: "Success",
      message: `Verifikasi Stakeholder berhasil diubah menjadi ${verifiedStatus}.`,
      data: stakeholder,
    });
  } catch (error) {
    console.error(`❌ Gagal toggle verifikasi ${id}:`, error);
    res.status(500).json({
      message: "Gagal memperbarui status verifikasi. " + error.message,
    });
  }
};

module.exports = {
  getAllStakeholders,
  getStakeholderById,
  updateStakeholder,
  deleteStakeholder,
  toggleVerification,
};
