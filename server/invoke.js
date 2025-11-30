const { Gateway, Wallets } = require("fabric-network");
const path = require("path");
const fs = require("fs");

const ccpPath = path.resolve(__dirname, "connection-org1.json");
const ccp = JSON.parse(fs.readFileSync(ccpPath, "utf8"));

const walletPath = path.join(process.cwd(), "wallet");
const walletPromise = Wallets.newFileSystemWallet(walletPath);

const tlsCertPath = path.resolve(__dirname, "certs", "org1-tls-ca.pem");
const tlsCertPem = fs.readFileSync(tlsCertPath, "utf8");

const peerName = "peer0.org1.example.com";
if (ccp.peers[peerName] && ccp.peers[peerName].tlsCACerts) {
  delete ccp.peers[peerName].tlsCACerts.path;
  ccp.peers[peerName].tlsCACerts.pem = tlsCertPem;
}

const invokeTransaction = async (
  contractFunctionName,
  args,
  user = "admin"
) => {
  const wallet = await walletPromise;

  const [contractName, functionName] = contractFunctionName.split(":");

  const gateway = new Gateway();
  try {
    await gateway.connect(ccp, {
      wallet,
      identity: user,
      discovery: { enabled: true, asLocalhost: true },
    });

    const network = await gateway.getNetwork("mychannel");
    const contract = network.getContract("kurban", contractName);

    const result = await contract.submitTransaction(functionName, ...args);
    return result.toString();
  } catch (error) {
    console.error("--- ERROR DETAIL IN FABRIC INVOKE ---");
    console.error(`Fungsi: ${contractFunctionName}`);
    console.error(`User: ${user}`);
    console.error(error);
    console.error("--------------------------------------");
    throw error;
  } finally {
    gateway.disconnect();
  }
};

const query = async (contractFunctionName, args, user = "admin") => {
  const wallet = await walletPromise;

  const [contractName, functionName] = contractFunctionName.split(":");

  const gateway = new Gateway();
  try {
    await gateway.connect(ccp, {
      wallet,
      identity: user,
      discovery: { enabled: true, asLocalhost: true },
    });

    const network = await gateway.getNetwork("mychannel");
    const contract = network.getContract("kurban", contractName);

    const result = await contract.evaluateTransaction(functionName, ...args);
    return result.toString();
  } catch (error) {
    console.error("--- ERROR DETAIL IN FABRIC QUERY ---");
    console.error(`Fungsi: ${contractFunctionName}`);
    console.error(`User: ${user}`);
    console.error(error);
    console.error("--------------------------------------");
    throw error;
  } finally {
    gateway.disconnect();
  }
};

module.exports = { invokeTransaction, query };
