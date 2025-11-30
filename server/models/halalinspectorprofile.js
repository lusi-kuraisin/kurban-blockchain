"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class HalalInspectorProfile extends Model {
    static associate(models) {
      HalalInspectorProfile.belongsTo(models.Stakeholder, {
        foreignKey: "stakeholderId",
        targetKey: "stakeholderID",
        as: "stakeholder",
      });

      HalalInspectorProfile.hasMany(models.SlaughterProcess, {
        foreignKey: "supervisorId",
        as: "supervisedSlaughterProcesses",
      });

      HalalInspectorProfile.hasMany(models.HalalCertificate, {
        foreignKey: "inspectorId",
        as: "issuedHalalCertificates",
      });
    }
  }

  HalalInspectorProfile.init(
    {
      stakeholderId: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
      },
      certificationLevel: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      authorizedBy: {
        type: DataTypes.STRING(150),
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "HalalInspectorProfile",
      tableName: "HalalInspectorProfiles",
    }
  );

  return HalalInspectorProfile;
};
