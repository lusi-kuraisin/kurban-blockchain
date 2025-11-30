require("dotenv").config();
const {
  Stakeholder,
  FarmerProfile,
  VetProfile,
  DistributorProfile,
  HalalInspectorProfile,
  CommitteeProfile,
} = require("../../models");

const { invokeTransaction } = require("../../invoke");

const profileModelMap = {
  Farmer: { model: FarmerProfile, as: "FarmerProfile" },
  VeterinaryDoctor: { model: VetProfile, as: "VetProfile" },
  Distributor: { model: DistributorProfile, as: "DistributorProfile" },
  HalalInspector: { model: HalalInspectorProfile, as: "HalalInspectorProfile" },
  Committee: { model: CommitteeProfile, as: "CommitteeProfile" },
};

const getProfileInfoByRole = (role) => {
  return profileModelMap[role];
};

const getProfile = async (req, res) => {
  const { id } = req.params;

  try {
    const stakeholder = await Stakeholder.findByPk(id);
    if (!stakeholder) {
      return res
        .status(404)
        .json({ message: `Stakeholder ID ${id} tidak ditemukan.` });
    }

    const profileInfo = getProfileInfoByRole(stakeholder.role);

    if (!profileInfo) {
      return res.status(400).json({
        message: `Role ${stakeholder.role} tidak memiliki profil spesifik.`,
      });
    }

    const profileData = await Stakeholder.findOne({
      where: { stakeholderID: id },
      attributes: ["stakeholderID", "name", "email", "role"],
      include: [
        {
          model: profileInfo.model,
          as: profileInfo.as,
          required: true,
        },
      ],
    });

    if (!profileData) {
      return res
        .status(404)
        .json({ message: `Data profil ${stakeholder.role} tidak ditemukan.` });
    }

    console.log(
      `✅ Profil ${stakeholder.role} untuk ${stakeholder.name} berhasil diambil.`
    );
    res.status(200).json({
      status: "Success",
      message: "Data profil berhasil diambil.",
      data: profileData,
    });
  } catch (error) {
    console.error(`❌ Gagal mengambil profil ${id}:`, error);
    res
      .status(500)
      .json({ message: "Gagal mengambil data profil. " + error.message });
  }
};

const updateProfile = async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  try {
    const stakeholder = await Stakeholder.findByPk(id);
    if (!stakeholder) {
      return res
        .status(404)
        .json({ message: `Stakeholder ID ${id} tidak ditemukan.` });
    }

    const profileInfo = getProfileInfoByRole(stakeholder.role);
    if (!profileInfo) {
      return res.status(400).json({
        message: `Role ${stakeholder.role} tidak memiliki profil yang bisa diubah.`,
      });
    }

    const profileEntry = await profileInfo.model.findOne({
      where: { stakeholderID: id },
    });
    if (!profileEntry) {
      return res
        .status(404)
        .json({ message: `Entri profil ${stakeholder.role} tidak ditemukan.` });
    }

    const updatedProfile = await profileEntry.update(updateData);

    if (updateData.licenseNumber || updateData.certificationLevel) {
      const auditData = { ...updatedProfile.toJSON() };

      const newProfileHash = require("crypto")
        .createHash("sha256")
        .update(JSON.stringify(auditData))
        .digest("hex");

      try {
        await invokeTransaction(
          "KurbanContract:uditProfileUpdate",
          [id, stakeholder.role, newProfileHash, new Date().toISOString()],
          stakeholder.stakeholderID
        );
        console.log("🔗 Hash perubahan profil berhasil dicatat di Ledger.");
      } catch (chainError) {
        console.warn(
          "⚠️ Gagal mencatat audit profil di Blockchain:",
          chainError.message
        );
      }
    }

    console.log(`🔄 Profil ${stakeholder.role} berhasil diperbarui.`);
    res.status(200).json({
      status: "Success",
      message: "Data profil berhasil diperbarui.",
      data: updatedProfile,
    });
  } catch (error) {
    console.error(`❌ Gagal update profil ${id}:`, error);
    res
      .status(500)
      .json({ message: "Gagal memperbarui data profil. " + error.message });
  }
};

const uploadKycDocuments = async (req, res) => {
  const { id } = req.params;
  const { fileHash, fileName, documentType } = req.body;

  try {
    const stakeholder = await Stakeholder.findByPk(id);
    if (!stakeholder) {
      return res
        .status(404)
        .json({ message: `Stakeholder ID ${id} tidak ditemukan.` });
    }

    await stakeholder.update({
      kyc_documents: JSON.stringify({
        [documentType || "general"]: {
          hash: fileHash,
          name: fileName,
          uploadedAt: new Date().toISOString(),
        },
      }),
    });

    try {
      await invokeTransaction(
        "KurbanContract:auditDocumentUpload",
        [id, documentType || "general", fileHash, new Date().toISOString()],
        stakeholder.stakeholderID
      );
      console.log("🔗 Hash dokumen KYC berhasil dicatat di Ledger.");
    } catch (chainError) {
      console.warn(
        "⚠️ Gagal mencatat audit dokumen di Blockchain:",
        chainError.message
      );
    }

    res.status(200).json({
      status: "Success",
      message: `Dokumen ${documentType} berhasil di-update dan di-audit.`,
      data: { fileHash, stakeholderID: id },
    });
  } catch (error) {
    console.error("❌ Gagal upload dokumen:", error);
    res
      .status(500)
      .json({ message: "Gagal memproses dokumen. " + error.message });
  }
};

const manageRoleProfile = async (req, res) => {
  const { id, role } = req.params;
  const profileData = req.body;

  try {
    const stakeholder = await Stakeholder.findByPk(id);
    if (!stakeholder) {
      return res
        .status(404)
        .json({ message: `Stakeholder ID ${id} tidak ditemukan.` });
    }

    if (stakeholder.role !== role) {
      return res.status(400).json({
        message: `Role di URL tidak sesuai dengan role Stakeholder (${stakeholder.role}).`,
      });
    }

    const profileInfo = getProfileInfoByRole(role);
    if (!profileInfo) {
      return res.status(400).json({
        message: `Role ${role} tidak didukung untuk manajemen profil.`,
      });
    }

    let profileEntry = await profileInfo.model.findOne({
      where: { stakeholderID: id },
    });

    let result;
    if (profileEntry) {
      result = await profileEntry.update(profileData);
    } else {
      result = await profileInfo.model.create({
        stakeholderID: id,
        ...profileData,
      });
    }

    console.log(`✅ Admin sukses memanage/membuat profil ${role} untuk ${id}.`);
    res.status(200).json({
      status: "Success",
      message: `Profil ${role} berhasil dikelola.`,
      data: result,
    });
  } catch (error) {
    console.error(`❌ Gagal mengelola profil role ${role}:`, error);
    res
      .status(500)
      .json({ message: "Gagal mengelola profil. " + error.message });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  uploadKycDocuments,
  manageRoleProfile,
};
