"use strict";

const FabricCAServices = require("fabric-ca-client");
const { Wallets } = require("fabric-network");
const path = require("path");
const fs = require("fs");

async function enrollUserToCA(userId) {
  console.log(`🚀 Memulai enroll user: ${userId}`);

  try {
    const ccpPath = path.resolve(__dirname, "..", "connection-org1.json");
    const ccp = JSON.parse(fs.readFileSync(ccpPath, "utf8"));

    const caInfo = ccp.certificateAuthorities["ca.org1.example.com"];
    const caTLSCACertsPath = path.resolve(
      __dirname,
      "..",
      "certs",
      "org1-tls-ca.pem"
    );
    const caTLSCACerts = fs.readFileSync(caTLSCACertsPath);

    const ca = new FabricCAServices(
      caInfo.url,
      { trustedRoots: caTLSCACerts, verify: false },
      caInfo.caName
    );

    const walletPath = path.join(process.cwd(), "wallet");
    const wallet = await Wallets.newFileSystemWallet(walletPath);
    console.log(`📂 Wallet path: ${walletPath}`);

    const existing = await wallet.get(userId);
    if (existing) {
      console.log(`✔️ User ${userId} sudah ada di wallet.`);
      return;
    }

    const adminIdentity = await wallet.get("admin");
    if (!adminIdentity) {
      throw new Error(
        "⛔ Admin belum terdaftar di wallet. Jalankan enrollAdmin.js dulu."
      );
    }

    const provider = wallet
      .getProviderRegistry()
      .getProvider(adminIdentity.type);
    const adminUser = await provider.getUserContext(adminIdentity, "admin");

    let secret;
    try {
      secret = await ca.register(
        {
          affiliation: "org1.department1",
          enrollmentID: userId,
          role: "client",
        },
        adminUser
      );
      console.log(`🔑 Secret berhasil dibuat untuk ${userId}`);
    } catch (err) {
      if (err.toString().includes("already registered")) {
        console.log(
          `⚠️ User ${userId} sudah terdaftar di CA… langsung enroll aja.`
        );
        secret = "dummySecret";
      } else {
        throw err;
      }
    }

    const enrollment = await ca.enroll({
      enrollmentID: userId,
      enrollmentSecret: secret,
    });

    const userIdentityEnroll = {
      type: "X.509",
      mspId: "Org1MSP",
      credentials: {
        certificate: enrollment.certificate,
        privateKey: enrollment.key.toBytes(),
      },
    };

    await wallet.put(userId, userIdentityEnroll);

    console.log(`✅ User ${userId} berhasil di-enroll & disimpan ke wallet.`);
  } catch (error) {
    console.error(`❌ Gagal enroll user ${userId}: ${error.message}`);
    throw error;
  }
}

async function deleteWallet(userId) {
  const walletPath = path.join(process.cwd(), "wallet");
  const wallet = await Wallets.newFileSystemWallet(walletPath);

  const identity = await wallet.get(userId);
  if (identity) {
    await wallet.remove(userId);
    console.log(`🧾 Wallet untuk ${userId} dihapus.`);
  }
}

module.exports = { enrollUserToCA, deleteWallet };
