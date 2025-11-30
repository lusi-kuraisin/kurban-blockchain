"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class BlockchainRecord extends Model {
    static associate(models) {
      /*
        BlockchainRecord.belongsTo(models.Stakeholder, {
            foreignKey: 'signerId',
            as: 'signer' // Aktor yang menandatangani transaksi
        });
        */
    }
  }

  BlockchainRecord.init(
    {
      transactionID: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      timestamp: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      blockHash: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      previousHash: DataTypes.STRING(255),
      transactionDataHash: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
      },
      digitalSignature: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      entityType: {
        type: DataTypes.ENUM(
          "Animal",
          "HealthRecord",
          "Vaccination",
          "HalalCertificate",
          "SupplyChainMovement",
          "QualityCheck",
          "SlaughterProcess"
        ),
        allowNull: false,
      },
      entityID: {
        type: DataTypes.UUID,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "BlockchainRecord",
      tableName: "BlockchainRecords",
    }
  );

  return BlockchainRecord;
};
