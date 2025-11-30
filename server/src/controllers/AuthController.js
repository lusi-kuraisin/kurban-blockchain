require("dotenv").config();
const { validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

const {
  Stakeholder,
  FarmerProfile,
  VetProfile,
  DistributorProfile,
  HalalInspectorProfile,
  CommitteeProfile,
} = require("../../models");

const { invokeTransaction } = require("../../invoke");
const {
  enrollUserToCA,
  deleteWallet,
} = require("../../scripts/enrollUserDynamic");

const JWT_SECRET = process.env.JWT_SECRET || "kurban_secret_key_super_aman";

const registerStakeholder = async (req, res) => {
  const {
    name,
    email,
    phone,
    password,
    role,
    address,
    photo_url,
    kyc_documents,
    profileData,
  } = req.body;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ status: "Failed", errors: errors.array() });
  }

  const { v4: uuidv4 } = await import("uuid");

  const stakeholderID = uuidv4();

  try {
    const existingEmail = await Stakeholder.findOne({ where: { email } });
    if (existingEmail) {
      return res.status(400).json({
        status: "Failed",
        message: `Email ${email} sudah terdaftar, Sayang!`,
      });
    }

    console.log(`🚀 Memulai pendaftaran: ${name} sebagai ${role}...`);

    const registeredAt = new Date().toISOString();
    const contactInfo = JSON.stringify({ email, phone, address });
    const digitalSignature = crypto
      .createHash("sha256")
      .update(`${stakeholderID}${email}${role}${registeredAt}`)
      .digest("hex");

    await enrollUserToCA(stakeholderID);

    let ledgerTxId;
    try {
      console.log("🔗 Mengirim data ke Blockchain Ledger...");

      await invokeTransaction(
        "KurbanContract:registerStakeholder",
        [stakeholderID, name, role, contactInfo, registeredAt],
        "admin"
      );

      ledgerTxId = `tx_${Date.now()}_${stakeholderID.substring(0, 8)}`;
    } catch (chainError) {
      console.error(
        "❌ Gagal simpan ke Blockchain. Melakukan Rollback CA:",
        chainError
      );
      await deleteWallet(stakeholderID);
      return res
        .status(500)
        .json({ message: "Blockchain error: " + chainError.message });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    let newStakeholder;

    try {
      newStakeholder = await Stakeholder.create({
        stakeholderID: stakeholderID,
        name,
        email,
        contactInfo: phone,
        role,
        password: passwordHash,
        digitalSignature: digitalSignature,
        status: "active",
        verified: true,
        blockchain_ref: ledgerTxId,
      });

      if (profileData) {
        await createProfileEntry(stakeholderID, role, profileData);
        console.log(`✅ Profil ${role} berhasil dibuat.`);
      } else {
        console.warn(`⚠️ Role ${role} terdaftar tanpa data profil spesifik.`);
      }

      console.log(`✅ Stakeholder ${name} sukses terdaftar penuh!`);

      res.status(201).json({
        status: "Success",
        message: `Hore! Pendaftaran ${name} berhasil sebagai ${role}! 🎉`,
        data: { stakeholderID, role, blockchainRef: ledgerTxId },
      });
    } catch (dbError) {
      console.error(
        "❌ Gagal simpan ke Database. Melakukan Rollback Blockchain:",
        dbError
      );
      await deleteWallet(stakeholderID);
      return res
        .status(500)
        .json({ message: "Database error: " + dbError.message });
    }
  } catch (error) {
    console.error("❌ Unexpected Error:", error);
    res.status(500).json({ message: "Terjadi kesalahan internal server." });
  }
};

const createProfileEntry = async (stakeholderID, role, data) => {
  const baseData = {
    stakeholderId: stakeholderID,
  };

  switch (role) {
    case "Farmer":
      return FarmerProfile.create({
        ...baseData,
        ...data,
      });
    case "VeterinaryDoctor":
      return VetProfile.create({
        ...baseData,
        ...data,
      });
    case "Distributor":
      return DistributorProfile.create({
        ...baseData,
        ...data,
      });
    case "HalalInspector":
      return HalalInspectorProfile.create({
        ...baseData,
        ...data,
      });
    case "Committee":
      return CommitteeProfile.create({
        ...baseData,
        ...data,
      });
    default:
      return null;
  }
};

const loginStakeholder = async (req, res) => {
  const { email, password } = req.body;
  const clientType = req.headers["x-client-type"] || "mobile";

  try {
    const user = await Stakeholder.findOne({ where: { email } });

    if (!user) {
      return res
        .status(401)
        .json({ status: "Error", message: "Email tidak ditemukan, Sayang." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        status: "Error",
        message: "Password salah. Coba ingat-ingat lagi! 😘",
      });
    }

    const token = generateToken(user);

    if (clientType === "web") {
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "Strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
    }

    /*
    try {
        const assetBuffer = await query("readAsset", [user.stakeholderID], "admin");
    } catch (e) {
        console.warn("⚠️ User ada di DB tapi tidak ditemukan di Blockchain!");
    }
    */

    console.log(`✨ ${user.name} berhasil login!`);

    res.status(200).json({
      status: "Success",
      message: `Selamat datang kembali, ${user.name}! 💖`,
      user: {
        id: user.stakeholderID,
        name: user.name,
        role: user.role,
      },
      ...(clientType === "mobile" && { token }),
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Login gagal." });
  }
};

const generateToken = (user) => {
  const payload = {
    stakeholderID: user.stakeholderID,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
};

const logout = (req, res) => {
  res.clearCookie("token");
  res.status(200).json({
    status: "Success",
    message: "Sampai jumpa lagi! Hati-hati di jalan ya 👋",
  });
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await Stakeholder.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: "Email tidak terdaftar." });
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset",
      text: `Click the link to reset your password: ${resetUrl}`,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({
      status: "Success",
      message:
        "Link reset password sudah dikirim ke email kamu! Cek inbox ya 📧",
      debug_token: resetToken,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await Stakeholder.findByPk(decoded.id);
    if (!user) {
      return res.status(404).json({ message: "User tidak valid." });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    user.password = passwordHash;
    await user.save();

    console.log(`🔒 Password untuk ${user.name} berhasil direset.`);

    res.status(200).json({
      status: "Success",
      message:
        "Password berhasil diubah! Silakan login dengan password baru ya 😘",
    });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res
        .status(400)
        .json({ message: "Link reset sudah kadaluarsa, minta baru lagi ya!" });
    }
    res.status(500).json({ message: "Gagal reset password." });
  }
};

module.exports = {
  registerStakeholder,
  loginStakeholder,
  logout,
  forgotPassword,
  resetPassword,
};
