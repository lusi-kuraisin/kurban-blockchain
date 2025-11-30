/*
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { Contract } = require('fabric-contract-api');

class KurbanContract extends Contract {
    // -------------------------------------------------------------------------
    // 0. INISIALISASI
    // -------------------------------------------------------------------------

    async InitLedger(ctx) {
        console.info('============= START : InitLedger ===========');
        // Biasanya untuk inisialisasi data master atau konfigurasi awal
        // Kita tidak perlu data awal, cukup log.
        console.info('Kurban Traceability Ledger initialized.');
        console.info('============= END : InitLedger ===========');
    }

    // ==================================================================================
    // 💾 FUNGSI CORE DATA & REGISTRASI STAKEHOLDER (Create & Update Aset) 📝
    // ==================================================================================

    /**
     * registerStakeholder (Audit Profil Stakeholder Baru)
     * Kunci: STAKEHOLDER_{stakeholderID}
     */
    async registerStakeholder(
        ctx,
        stakeholderID,
        name,
        role,
        contactInfo,
        registeredAt
    ) {
        const assetKey = `STAKEHOLDER_${stakeholderID}`;

        // Cek otorisasi: Hanya admin yang boleh mendaftarkan
        // (Di Controller sudah dijamin, tapi ini untuk keamanan SC)
        // Jika ctx.clientIdentity.getMSPID() adalah 'Org1MSP', dll.

        const stakeholder = {
            docType: 'stakeholder',
            stakeholderID,
            name,
            role,
            contactInfo,
            status: 'active',
            registeredAt,
            updater: ctx.clientIdentity.getID(), // Siapa yang menjalankan transaksi
        };

        await ctx.stub.putState(
            assetKey,
            Buffer.from(JSON.stringify(stakeholder))
        );
        return JSON.stringify({
            message: `Stakeholder ${stakeholderID} berhasil didaftarkan.`,
        });
    }

    /**
     * createAnimal (Pendaftaran Aset Hewan Baru)
     * Kunci: ANIMAL_{animalID}
     */
    async createAnimal(
        ctx,
        animalID,
        species,
        breed,
        birthDate,
        farmerStakeholderID,
        weight,
        registeredAt
    ) {
        const assetKey = `ANIMAL_${animalID}`;

        const animal = {
            docType: 'animal',
            animalID,
            species,
            breed,
            birthDate,
            farmerStakeholderID,
            initialWeight: parseFloat(weight),
            status: 'Registered', // Status awal
            registeredAt,
            lastTxId: ctx.stub.getTxID(),
        };

        await ctx.stub.putState(assetKey, Buffer.from(JSON.stringify(animal)));
        return JSON.stringify({
            message: `Hewan ${animalID} berhasil dibuat.`,
        });
    }

    /**
     * auditProfileUpdate (Mencatat Hash Audit Pembaruan Profil)
     * Kunci: AUDIT_PROFILE_{id}
     */
    async auditProfileUpdate(ctx, id, role, newProfileHash, timestamp) {
        const assetKey = `AUDIT_PROFILE_${id}`;

        const audit = {
            docType: 'profileAudit',
            entityID: id,
            entityType: 'Profile',
            role,
            newProfileHash,
            timestamp,
            updater: ctx.clientIdentity.getID(),
        };

        // PutState di sini akan menimpa (update) atau membuat baru (create)
        await ctx.stub.putState(assetKey, Buffer.from(JSON.stringify(audit)));
        return JSON.stringify({
            message: `Audit pembaruan profil ${id} berhasil dicatat.`,
        });
    }

    /**
     * updateStakeholderStatus (Mengubah Status Stakeholder)
     * Kunci: STAKEHOLDER_{stakeholderID} (Update)
     */
    async updateStakeholderStatus(ctx, stakeholderID, newStatus, timestamp) {
        const assetKey = `STAKEHOLDER_${stakeholderID}`;
        const stakeholderAsBytes = await ctx.stub.getState(assetKey);

        if (!stakeholderAsBytes || stakeholderAsBytes.length === 0) {
            throw new Error(`Stakeholder ID ${stakeholderID} tidak ditemukan.`);
        }

        const stakeholder = JSON.parse(stakeholderAsBytes.toString());

        stakeholder.status = newStatus;
        stakeholder.updatedAt = timestamp;
        stakeholder.updater = ctx.clientIdentity.getID();

        await ctx.stub.putState(
            assetKey,
            Buffer.from(JSON.stringify(stakeholder))
        );
        return JSON.stringify({
            message: `Status Stakeholder ${stakeholderID} berhasil diubah menjadi ${newStatus}.`,
        });
    }

    // ==================================================================================
    // 🩺 FUNGSI KESEHATAN & VAKSINASI (Update Aset ANIMAL) 💉
    // ==================================================================================

    /**
     * recordVaccination (Mencatat Vaksinasi, Mengubah status Kesehatan Hewan)
     * Kunci: ANIMAL_{animalID} (Update)
     */
    async recordVaccination(
        ctx,
        animalID,
        vetStakeholderID,
        vaccineType,
        vaccinationDate,
        batchNumber,
        timestamp
    ) {
        const assetKey = `ANIMAL_${animalID}`;
        const animalAsBytes = await ctx.stub.getState(assetKey);

        if (!animalAsBytes || animalAsBytes.length === 0) {
            throw new Error(`Hewan ID ${animalID} tidak ditemukan.`);
        }

        const animal = JSON.parse(animalAsBytes.toString());

        // Logika bisnis: Mencatat detail vaksinasi di dalam aset hewan
        if (!animal.vaccinationHistory) animal.vaccinationHistory = [];
        animal.vaccinationHistory.push({
            vetStakeholderID,
            vaccineType,
            vaccinationDate,
            batchNumber,
            timestamp,
            txId: ctx.stub.getTxID(),
        });

        animal.status = 'Vaccinated';
        animal.lastTxId = ctx.stub.getTxID();

        await ctx.stub.putState(assetKey, Buffer.from(JSON.stringify(animal)));
        return JSON.stringify({
            message: `Vaksinasi untuk ${animalID} berhasil dicatat.`,
        });
    }

    /**
     * recordHealthCheck (Mencatat Pengecekan Kesehatan)
     * Kunci: ANIMAL_{animalID} (Update)
     */
    async recordHealthCheck(
        ctx,
        animalID,
        vetStakeholderID,
        newHealthStatus,
        fitForSacrifice,
        timestamp
    ) {
        const assetKey = `ANIMAL_${animalID}`;
        const animalAsBytes = await ctx.stub.getState(assetKey);

        if (!animalAsBytes || animalAsBytes.length === 0) {
            throw new Error(`Hewan ID ${animalID} tidak ditemukan.`);
        }

        const animal = JSON.parse(animalAsBytes.toString());

        // Logika bisnis: Mencatat hasil cek kesehatan
        if (!animal.healthChecks) animal.healthChecks = [];
        animal.healthChecks.push({
            vetStakeholderID,
            newHealthStatus,
            fitForSacrifice: fitForSacrifice === 'true',
            timestamp,
            txId: ctx.stub.getTxID(),
        });

        animal.status = 'Health Checked';
        animal.lastTxId = ctx.stub.getTxID();

        await ctx.stub.putState(assetKey, Buffer.from(JSON.stringify(animal)));
        return JSON.stringify({
            message: `Pengecekan kesehatan untuk ${animalID} berhasil dicatat.`,
        });
    }

    /**
     * certifyAnimalFit (Sertifikasi Kelayakan Hewan untuk Kurban)
     * Kunci: ANIMAL_{animalID} (Update)
     */
    async certifyAnimalFit(
        ctx,
        animalID,
        vetStakeholderID,
        timestamp,
        remarks
    ) {
        const assetKey = `ANIMAL_${animalID}`;
        const animalAsBytes = await ctx.stub.getState(assetKey);

        if (!animalAsBytes || animalAsBytes.length === 0) {
            throw new Error(`Hewan ID ${animalID} tidak ditemukan.`);
        }

        const animal = JSON.parse(animalAsBytes.toString());

        if (animal.status !== 'Health Checked') {
            throw new Error(`Hewan belum melewati health check final.`);
        }

        animal.status = 'Certified Fit';
        animal.certifiedBy = vetStakeholderID;
        animal.certificationTime = timestamp;
        animal.certificationRemarks = remarks;
        animal.lastTxId = ctx.stub.getTxID();

        await ctx.stub.putState(assetKey, Buffer.from(JSON.stringify(animal)));
        return JSON.stringify({
            message: `Hewan ${animalID} berhasil disertifikasi layak kurban.`,
        });
    }

    // ==================================================================================
    // 🚚 FUNGSI LOGISTIK (MOVEMENT) (Update Aset ANIMAL) 🗺️
    // ==================================================================================

    /**
     * recordMovementStart (Mencatat Awal Pergerakan Aset)
     * Kunci: ANIMAL_{animalID} (Update)
     */
    async recordMovementStart(
        ctx,
        animalID,
        movementID,
        distributorStakeholderID,
        fromLocation,
        toLocation,
        newStatus,
        movementTime
    ) {
        const assetKey = `ANIMAL_${animalID}`;
        const animalAsBytes = await ctx.stub.getState(assetKey);

        if (!animalAsBytes || animalAsBytes.length === 0) {
            throw new Error(`Hewan ID ${animalID} tidak ditemukan.`);
        }

        const animal = JSON.parse(animalAsBytes.toString());

        // Logika bisnis: Mencatat pergerakan
        if (!animal.movementHistory) animal.movementHistory = [];
        animal.movementHistory.push({
            movementID,
            distributorStakeholderID,
            fromLocation,
            toLocation,
            status: newStatus,
            movementTime,
            txId: ctx.stub.getTxID(),
        });

        animal.status = newStatus; // Misal: 'In Transit'
        animal.currentLocation = fromLocation;
        animal.lastTxId = ctx.stub.getTxID();

        await ctx.stub.putState(assetKey, Buffer.from(JSON.stringify(animal)));
        return JSON.stringify({
            message: `Pergerakan ${animalID} dimulai dari ${fromLocation}.`,
        });
    }

    /**
     * recordMovementArrival (Mencatat Kedatangan Pergerakan Aset)
     * Kunci: ANIMAL_{animalID} (Update)
     */
    async recordMovementArrival(
        ctx,
        animalID,
        movementID,
        receiverStakeholderID,
        arrivedAtLocation,
        newStatus,
        arrivalTime
    ) {
        const assetKey = `ANIMAL_${animalID}`;
        const animalAsBytes = await ctx.stub.getState(assetKey);

        if (!animalAsBytes || animalAsBytes.length === 0) {
            throw new Error(`Hewan ID ${animalID} tidak ditemukan.`);
        }

        const animal = JSON.parse(animalAsBytes.toString());

        // Cari pergerakan yang aktif berdasarkan movementID
        const movementIndex = animal.movementHistory.findIndex(
            (m) => m.movementID === movementID && m.status !== 'Arrived'
        );

        if (movementIndex === -1) {
            throw new Error(
                `Pergerakan ID ${movementID} tidak ditemukan atau sudah selesai.`
            );
        }

        // Update status pergerakan di history
        animal.movementHistory[movementIndex].status = newStatus; // Misal: 'Arrived'
        animal.movementHistory[movementIndex].arrivedAtLocation =
            arrivedAtLocation;
        animal.movementHistory[movementIndex].arrivalTime = arrivalTime;
        animal.movementHistory[movementIndex].receiverStakeholderID =
            receiverStakeholderID;

        animal.status = newStatus; // Misal: 'Arrived at Slaughterhouse'
        animal.currentLocation = arrivedAtLocation;
        animal.lastTxId = ctx.stub.getTxID();

        await ctx.stub.putState(assetKey, Buffer.from(JSON.stringify(animal)));
        return JSON.stringify({
            message: `Pergerakan ${animalID} selesai di ${arrivedAtLocation}.`,
        });
    }

    // ==================================================================================
    // 🔪 FUNGSI PENYEMBELIHAN (SLAUGHTER) & HALAL (Update Aset ANIMAL) ✅
    // ==================================================================================

    /**
     * startSlaughterProcess (Mencatat Awal Proses Penyembelihan)
     * Kunci: ANIMAL_{animalID} (Update)
     */
    async startSlaughterProcess(
        ctx,
        animalID,
        processID,
        initiatorStakeholderID,
        slaughtererId,
        location,
        slaughterTime
    ) {
        const assetKey = `ANIMAL_${animalID}`;
        const animalAsBytes = await ctx.stub.getState(assetKey);

        if (!animalAsBytes || animalAsBytes.length === 0) {
            throw new Error(`Hewan ID ${animalID} tidak ditemukan.`);
        }

        const animal = JSON.parse(animalAsBytes.toString());

        animal.status = 'Slaughtering in Progress';
        animal.slaughterProcess = {
            processID,
            initiatorStakeholderID,
            slaughtererId,
            location,
            slaughterTime,
            txId: ctx.stub.getTxID(),
        };
        animal.lastTxId = ctx.stub.getTxID();

        await ctx.stub.putState(assetKey, Buffer.from(JSON.stringify(animal)));
        return JSON.stringify({
            message: `Proses penyembelihan ${animalID} dimulai.`,
        });
    }

    /**
     * recordHalalSlaughter (Mencatat Sertifikasi Halal)
     * Kunci: ANIMAL_{animalID} (Update)
     */
    async recordHalalSlaughter(
        ctx,
        animalID,
        processID,
        halalInspectorStakeholderID,
        slaughtererId,
        islamicCompliant,
        certificationTime,
        documentHash
    ) {
        const assetKey = `ANIMAL_${animalID}`;
        const animalAsBytes = await ctx.stub.getState(assetKey);

        if (!animalAsBytes || animalAsBytes.length === 0) {
            throw new Error(`Hewan ID ${animalID} tidak ditemukan.`);
        }

        const animal = JSON.parse(animalAsBytes.toString());

        if (
            animal.slaughterProcess &&
            animal.slaughterProcess.processID !== processID
        ) {
            throw new Error(`ID proses penyembelihan tidak cocok.`);
        }

        animal.status =
            islamicCompliant === 'true'
                ? 'Certified Carcass'
                : 'Rejected (Non-Halal)';

        if (animal.slaughterProcess) {
            animal.slaughterProcess.halalInspectorStakeholderID =
                halalInspectorStakeholderID;
            animal.slaughterProcess.islamicCompliant =
                islamicCompliant === 'true';
            animal.slaughterProcess.certificationTime = certificationTime;
            animal.slaughterProcess.certificationDocumentHash = documentHash; // Hash Sertifikat Halal
            animal.slaughterProcess.txIdFinal = ctx.stub.getTxID();
        }

        animal.lastTxId = ctx.stub.getTxID();

        await ctx.stub.putState(assetKey, Buffer.from(JSON.stringify(animal)));
        return JSON.stringify({
            message: `Penyembelihan ${animalID} selesai. Status: ${animal.status}.`,
        });
    }

    // ==================================================================================
    // 📊 FUNGSI QUALITY CHECK (QC) (Update Aset ANIMAL) 📈
    // ==================================================================================

    /**
     * recordQualityCheck (Mencatat Hasil Pengecekan Kualitas)
     * Kunci: ANIMAL_{animalID} (Update)
     */
    async recordQualityCheck(
        ctx,
        animalID,
        checkID,
        qcStakeholderID,
        checkType,
        passed,
        checkDate
    ) {
        const assetKey = `ANIMAL_${animalID}`;
        const animalAsBytes = await ctx.stub.getState(assetKey);

        if (!animalAsBytes || animalAsBytes.length === 0) {
            throw new Error(`Hewan ID ${animalID} tidak ditemukan.`);
        }

        const animal = JSON.parse(animalAsBytes.toString());

        if (!animal.qualityChecks) animal.qualityChecks = [];
        animal.qualityChecks.push({
            checkID,
            qcStakeholderID,
            checkType,
            passed: passed === 'true',
            checkDate,
            txId: ctx.stub.getTxID(),
        });

        animal.lastTxId = ctx.stub.getTxID();

        await ctx.stub.putState(assetKey, Buffer.from(JSON.stringify(animal)));
        return JSON.stringify({
            message: `Pengecekan kualitas (${checkType}) untuk ${animalID} berhasil dicatat.`,
        });
    }

    /**
     * updateFinalQCStatus (Memperbarui Status QC Final Karkas)
     * Kunci: ANIMAL_{animalID} (Update)
     */
    async updateFinalQCStatus(
        ctx,
        animalID,
        checkID,
        qcStakeholderID,
        newAnimalStatus,
        finalDate
    ) {
        const assetKey = `ANIMAL_${animalID}`;
        const animalAsBytes = await ctx.stub.getState(assetKey);

        if (!animalAsBytes || animalAsBytes.length === 0) {
            throw new Error(`Hewan ID ${animalID} tidak ditemukan.`);
        }

        const animal = JSON.parse(animalAsBytes.toString());

        // Logika: Memastikan status final dan mencatatnya sebagai QC terakhir
        if (
            newAnimalStatus !== 'Ready for Distribution' &&
            newAnimalStatus !== 'Rejected'
        ) {
            throw new Error(
                `Status hewan final tidak valid: ${newAnimalStatus}`
            );
        }

        // Update di history QC (jika ada) dan update status aset
        if (!animal.qualityChecks) animal.qualityChecks = [];

        // Tambahkan record final QC
        animal.qualityChecks.push({
            checkID,
            qcStakeholderID,
            checkType: 'Final Inspection',
            passed: newAnimalStatus === 'Ready for Distribution',
            checkDate: finalDate,
            txId: ctx.stub.getTxID(),
        });

        animal.status = newAnimalStatus;
        animal.lastTxId = ctx.stub.getTxID();

        await ctx.stub.putState(assetKey, Buffer.from(JSON.stringify(animal)));
        return JSON.stringify({
            message: `Status QC final ${animalID} diubah menjadi ${newAnimalStatus}.`,
        });
    }

    // ==================================================================================
    // 📁 FUNGSI FILE & DOKUMEN (HASH) 📑
    // ==================================================================================

    /**
     * recordFileHash (Mencatat Hash IPFS Dokumen)
     * Kunci: HASH_{ipfsHash}
     */
    async recordFileHash(
        ctx,
        entityID,
        entityType,
        ipfsHash,
        invokerStakeholderID,
        timestamp
    ) {
        const assetKey = `HASH_${ipfsHash}`;

        const fileAudit = {
            docType: 'fileHash',
            ipfsHash,
            entityID,
            entityType,
            invokerStakeholderID,
            timestamp,
            txId: ctx.stub.getTxID(),
        };

        await ctx.stub.putState(
            assetKey,
            Buffer.from(JSON.stringify(fileAudit))
        );
        return JSON.stringify({
            message: `Hash file ${ipfsHash} untuk ${entityType}:${entityID} berhasil dicatat.`,
        });
    }

    /**
     * auditDocumentUpload (Mencatat Audit Upload Dokumen Umum)
     * Kunci: AUDIT_DOC_{id}
     */
    async auditDocumentUpload(ctx, id, documentType, fileHash, timestamp) {
        const assetKey = `AUDIT_DOC_${id}`;

        const audit = {
            docType: 'documentAudit',
            entityID: id,
            documentType,
            fileHash,
            timestamp,
            updater: ctx.clientIdentity.getID(),
        };

        await ctx.stub.putState(assetKey, Buffer.from(JSON.stringify(audit)));
        return JSON.stringify({
            message: `Audit upload dokumen ${id} berhasil dicatat.`,
        });
    }

    // ==================================================================================
    // 🔎 FUNGSI QUERY (READ ONLY) 📜
    // ==================================================================================

    /**
     * readAsset (Membaca status aset berdasarkan kunci)
     */
    async readAsset(ctx, assetKey) {
        const assetAsBytes = await ctx.stub.getState(assetKey);

        if (!assetAsBytes || assetAsBytes.length === 0) {
            throw new Error(`Aset dengan kunci ${assetKey} tidak ditemukan.`);
        }

        return assetAsBytes.toString();
    }

    /**
     * getAssetHistory (Mendapatkan riwayat perubahan aset)
     */
    async getAssetHistory(ctx, assetKey) {
        let resultsIterator = await ctx.stub.getHistoryForKey(assetKey);
        let results = await this._getAllResults(resultsIterator, true);

        return JSON.stringify(results);
    }

    /**
     * queryTransaction (Mendapatkan detail transaksi spesifik)
     * ⚠️ Catatan: Fungsi ini biasanya membutuhkan shim.getQueryResult or Private Data Collection
     * Untuk fungsi query berdasarkan TxID, ini biasanya dihandle oleh Fabric SDK bukan Chaincode Query.
     * Sebagai placeholder, kita akan menggunakan fungsi umum.
     */
    async queryTransaction(ctx, txID) {
        // Dalam praktik nyata, ini akan melibatkan panggilan ke Fabric SDK Admin/Client API
        // untuk membaca blok berdasarkan TxID. Di dalam Chaincode, ini adalah fungsi yang sulit.
        // Kita simulasikan dengan mengembalikan TxID yang dicari.
        return JSON.stringify({
            message: 'Fungsi audit TxID di Chaincode disimulasikan.',
            txIdRequested: txID,
            ledgerTime: new Date().toISOString(),
        });
    }

    // Helper untuk mengiterasi hasil
    async _getAllResults(iterator, isHistory) {
        let allResults = [];
        while (true) {
            let res = await iterator.next();

            if (res.value && res.value.value.toString()) {
                let jsonRes = {};
                console.log(res.value.value.toString('utf8'));

                if (isHistory) {
                    jsonRes.TxId = res.value.tx_id;
                    jsonRes.Timestamp = res.value.timestamp;
                    try {
                        jsonRes.Value = JSON.parse(
                            res.value.value.toString('utf8')
                        );
                    } catch (err) {
                        console.log(err);
                        jsonRes.Value = res.value.value.toString('utf8');
                    }
                } else {
                    jsonRes.Key = res.value.key;
                    try {
                        jsonRes.Record = JSON.parse(
                            res.value.value.toString('utf8')
                        );
                    } catch (err) {
                        console.log(err);
                        jsonRes.Record = res.value.value.toString('utf8');
                    }
                }
                allResults.push(jsonRes);
            }

            if (res.done) {
                await iterator.close();
                return allResults;
            }
        }
    }
}

module.exports = KurbanContract;
