const { SmartContract } = require("../../models");

const { invokeTransaction, query } = require("../../invoke");

const updateSCExecutionTime = async (contractType) => {
  await SmartContract.update(
    { lastExecutedAt: new Date() },
    { where: { contractType: contractType } }
  );
};

const initLedger = async (req, res) => {
  const invokerStakeholderID = req.user.stakeholderID;
  const contractType = "KurbanTraceability";

  try {
    console.log(`⚙️ Menginisialisasi Ledger melalui Smart Contract...`);

    await invokeTransaction(
      "KurbanContract:InitLedger",
      [],
      invokerStakeholderID
    );

    await updateSCExecutionTime(contractType);

    await SmartContract.findOrCreate({
      where: { contractType: contractType },
      defaults: {
        contractType: contractType,
        creator: invokerStakeholderID,
        conditions: "Initial setup completed.",
        lastExecutedAt: new Date(),
      },
    });

    console.log(`✅ Ledger berhasil diinisialisasi.`);
    res.status(200).json({
      status: "Success",
      message: "Inisialisasi Ledger Smart Contract berhasil dilakukan!",
    });
  } catch (error) {
    console.error("❌ Gagal inisialisasi Ledger:", error);
    res.status(500).json({
      message: "Gagal memproses inisialisasi Ledger: " + error.message,
    });
  }
};

const genericInvoke = async (req, res) => {
  const invokerStakeholderID = req.user.stakeholderID;
  const { functionName, args } = req.body;
  const contractType = "KurbanTraceability";

  if (!functionName || !Array.isArray(args)) {
    return res.status(400).json({
      message:
        "Payload tidak valid. Body harus berisi 'functionName' (string) dan 'args' (array string).",
    });
  }

  try {
    console.log(
      `📝 Memanggil fungsi INVOKE generik: ${functionName} dengan args: ${args.join(
        ", "
      )}`
    );

    const response = await invokeTransaction(
      `KurbanContract:${functionName}`,
      args,
      invokerStakeholderID
    );

    await updateSCExecutionTime(contractType);

    console.log(`✅ Fungsi INVOKE ${functionName} berhasil dieksekusi.`);
    res.status(200).json({
      status: "Success",
      message: `Fungsi Smart Contract INVOKE berhasil: ${functionName}.`,
      data: response,
    });
  } catch (error) {
    console.error(
      `❌ Gagal menjalankan INVOKE generik ${functionName}:`,
      error
    );
    res
      .status(500)
      .json({ message: "Gagal memproses INVOKE generik: " + error.message });
  }
};

const genericQuery = async (req, res) => {
  const invokerStakeholderID = req.user.stakeholderID;
  const { functionName, args } = req.query;
  const contractType = "KurbanTraceability";

  let argArray = [];
  if (args) {
    argArray = args.split(",");
  }

  if (!functionName) {
    return res
      .status(400)
      .json({ message: "Query parameter 'functionName' wajib diisi." });
  }

  try {
    console.log(
      `🔍 Memanggil fungsi QUERY generik: ${functionName} dengan args: ${argArray.join(
        ", "
      )}`
    );

    const response = await query(functionName, argArray, invokerStakeholderID);

    await updateSCExecutionTime(contractType);

    let parsedResponse;
    try {
      parsedResponse = JSON.parse(response);
    } catch (e) {
      parsedResponse = response;
    }

    console.log(`✅ Fungsi QUERY ${functionName} berhasil dieksekusi.`);
    res.status(200).json({
      status: "Success",
      message: `Fungsi Smart Contract QUERY berhasil: ${functionName}.`,
      data: parsedResponse,
    });
  } catch (error) {
    console.error(`❌ Gagal menjalankan QUERY generik ${functionName}:`, error);
    res
      .status(500)
      .json({ message: "Gagal memproses QUERY generik: " + error.message });
  }
};

module.exports = {
  initLedger,
  genericInvoke,
  genericQuery,
};
