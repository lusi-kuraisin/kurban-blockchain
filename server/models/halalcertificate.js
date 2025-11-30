"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class HalalCertificate extends Model {
    static associate(models) {
      HalalCertificate.belongsTo(models.Animal, {
        foreignKey: "animalID",
        targetKey: "animalID",
        as: "animal",
      });

      HalalCertificate.belongsTo(models.HalalInspectorProfile, {
        foreignKey: "inspectorId",
        as: "inspector",
      });

      HalalCertificate.belongsTo(models.SlaughterProcess, {
        foreignKey: "slaughterProcessId",
        targetKey: "processID",
        as: "slaughterProcessDocumented",
      });
    }
  }

  HalalCertificate.init(
    {
      certificatelD: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      animalID: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
      },
      inspectorId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      issueDate: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      expiryDate: DataTypes.DATE,
      slaughterMethod: DataTypes.STRING(100),
      qiblaDirection: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      tasmiyahRecited: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      slaughtererID: DataTypes.STRING(50),
      status: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: "Issued",
      },
      inspectorSignature: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      slaughterProcessId: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
      },
    },
    {
      sequelize,
      modelName: "HalalCertificate",
      tableName: "HalalCertificates",
    }
  );

  return HalalCertificate;
};
