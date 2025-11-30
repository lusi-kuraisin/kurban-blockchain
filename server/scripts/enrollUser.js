"use strict";

const FabricCAServices = require("fabric-ca-client");
const { FileSystemWallet, X509WalletMixin } = require("fabric-network");
const path = require("path");
const fs = require("fs");
const FabricClient = require("fabric-client");

async function main() {
  try {
    // 1️⃣ Baca connection profile
    const ccpPath = path.resolve(__dirname, "..", "connection-org1.json");
    const ccp = JSON.parse(fs.readFileSync(ccpPath, "utf8"));

    // 2️⃣ Ambil info CA
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

    // 3️⃣ Inisialisasi wallet dan fabric client
    const walletPath = path.join(process.cwd(), "wallet");
    const wallet = new FileSystemWallet(walletPath);
    console.log(`📂 Wallet path: ${walletPath}`);

    const userId = "appUser";

    // 4️⃣ Cek apakah user sudah ada
    const userExists = await wallet.exists(userId);
    if (userExists) {
      console.log(`✔️ User '${userId}' already exists in the wallet`);
      return;
    }

    // 5️⃣ Pastikan admin sudah terdaftar
    const adminExists = await wallet.exists("admin");
    if (!adminExists) {
      console.log(
        "⛔ Admin identity not found in the wallet. Jalankan 'enrollAdmin.js' dulu!"
      );
      return;
    }

    // 6️⃣ Buat fabric client & setup state store (ini kunci fix-nya 🔧)
    const client = new FabricClient();
    const storePath = path.join(__dirname, "hfc-key-store");
    const stateStore = await FabricClient.newDefaultKeyValueStore({
      path: storePath,
    });
    client.setStateStore(stateStore);

    // 7️⃣ Ambil admin dari wallet dan buat User instance
    const adminIdentity = await wallet.export("admin");
    const adminUser = await client.createUser({
      username: "admin",
      mspid: "Org1MSP",
      cryptoContent: {
        privateKeyPEM: adminIdentity.privateKey,
        signedCertPEM: adminIdentity.certificate,
      },
    });

    // 8️⃣ Register user baru ke CA
    const secret = await ca.register(
      {
        affiliation: "org1.department1",
        enrollmentID: userId,
        role: "client",
      },
      adminUser // ✅ valid User class
    );

    // 9️⃣ Enroll user tersebut
    const enrollment = await ca.enroll({
      enrollmentID: userId,
      enrollmentSecret: secret,
    });

    // 🔟 Simpan ke wallet
    const userIdentity = X509WalletMixin.createIdentity(
      "Org1MSP",
      enrollment.certificate,
      enrollment.key.toBytes()
    );

    await wallet.import(userId, userIdentity);
    console.log(
      `✅ Successfully registered and enrolled '${userId}' and imported it into the wallet`
    );
  } catch (error) {
    console.error(`❌ Failed to register user: ${error.message}`);
    process.exit(1);
  }
}

main();
