const { query } = require("../../invoke");

const readAssetOnChain = async (assetID, invokerID) => {
  const assetDetails = await query("readAsset", [assetID], invokerID);
  return JSON.parse(assetDetails);
};

const getAssetDetailsOnChain = async (req, res) => {
  const invokerStakeholderID = req.user.stakeholderID;
  const { animalID } = req.params;

  try {
    console.log(`🔍 Query status terkini aset ${animalID} dari Ledger...`);

    const assetDetails = await readAssetOnChain(animalID, invokerStakeholderID);

    console.log(`✅ Detail aset ${animalID} (On-Chain) berhasil diambil.`);

    res.status(200).json({
      status: "Success",
      message: "Status aset terkini (On-Chain) berhasil diambil.",
      data: assetDetails,
    });
  } catch (error) {
    console.error(`❌ Gagal membaca aset ${animalID} dari Blockchain:`, error);
    res.status(500).json({
      message:
        "Gagal memproses query Blockchain. Cek ID dan Jaringan: " +
        error.message,
    });
  }
};

const getAssetHistoryOnChain = async (req, res) => {
  const invokerStakeholderID = req.user.stakeholderID;
  const { assetID } = req.params;

  try {
    console.log(`🔗 Query riwayat transaksi aset ${assetID} dari Ledger...`);

    const blockchainHistory = await query(
      "getAssetHistory",
      [assetID],
      invokerStakeholderID
    );

    const parsedHistory = JSON.parse(blockchainHistory);

    console.log(`✅ Riwayat Blockchain untuk ${assetID} berhasil diambil.`);

    res.status(200).json({
      status: "Success",
      message: "Riwayat transaksi Immutable (Blockchain) berhasil diambil.",
      data: parsedHistory,
    });
  } catch (error) {
    console.error(
      `❌ Gagal mendapatkan riwayat Blockchain untuk ${assetID}:`,
      error
    );
    res.status(500).json({
      message:
        "Gagal memproses query Blockchain. Cek ID dan Jaringan: " +
        error.message,
    });
  }
};

const getTransactionDetails = async (req, res) => {
  const invokerStakeholderID = req.user.stakeholderID;
  const { txID } = req.params;

  try {
    console.log(`📄 Mencari detail transaksi ${txID} dari Ledger...`);

    const txDetails = await query(
      "queryTransaction",
      [txID],
      invokerStakeholderID
    );

    const parsedDetails = JSON.parse(txDetails);

    console.log(`✅ Detail transaksi ${txID} (On-Chain) berhasil diambil.`);

    res.status(200).json({
      status: "Success",
      message: `Detail transaksi ${txID} (Raw On-Chain Data) berhasil diambil.`,
      data: parsedDetails,
    });
  } catch (error) {
    console.error(
      `❌ Gagal mendapatkan detail transaksi ${txID} dari Blockchain:`,
      error
    );
    res.status(500).json({
      message: "Gagal memproses query transaksi Blockchain: " + error.message,
    });
  }
};

module.exports = {
  getAssetDetailsOnChain,
  getAssetHistoryOnChain,
  getTransactionDetails,
};
