"use strict";

const FabricCAServices = require("fabric-ca-client");
const { Wallets } = require("fabric-network");
const path = require("path");
const fs = require("fs");

async function main() {
  try {
    const ccpPath = path.resolve(__dirname, "..", "connection-org1.json");
    const ccp = JSON.parse(fs.readFileSync(ccpPath, "utf8"));

    const caInfo = ccp.certificateAuthorities["ca.org1.example.com"];
    const ca = new FabricCAServices(
      caInfo.url,
      { trustedRoots: [], verify: false },
      caInfo.caName
    );

    const walletPath = path.join(process.cwd(), "wallet");
    const wallet = await Wallets.newFileSystemWallet(walletPath);
    console.log(`🔐 Wallet path: ${walletPath}`);

    const identity = await wallet.get("admin");
    if (identity) {
      console.log("✅ Admin identity already exists in wallet");
      return;
    }

    const enrollment = await ca.enroll({
      enrollmentID: "admin",
      enrollmentSecret: "adminpw",
    });

    const x509Identity = {
      credentials: {
        certificate: enrollment.certificate,
        privateKey: enrollment.key.toBytes(),
      },
      mspId: "Org1MSP",
      type: "X.509",
    };

    await wallet.put("admin", x509Identity);

    console.log(
      "🎉 Successfully enrolled admin and imported it into the wallet"
    );
  } catch (error) {
    console.error(`❌ Failed to enroll admin: ${error}`);
    process.exit(1);
  }
}

main();
