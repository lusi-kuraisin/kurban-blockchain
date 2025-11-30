"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class IPFSFile extends Model {
    static associate(models) {}
  }

  IPFSFile.init(
    {
      fileHash: {
        type: DataTypes.STRING(255),
        primaryKey: true,
        allowNull: false,
      },
      fileName: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      fileType: DataTypes.STRING(100),
      entityType: {
        type: DataTypes.ENUM(
          "HealthRecord",
          "HalalCertificate",
          "SlaughterProcess",
          "QualityCheck"
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
      modelName: "IPFSFile",
      tableName: "IPFSFiles",
    }
  );

  return IPFSFile;
};
