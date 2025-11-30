"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class VetProfile extends Model {
    static associate(models) {
      VetProfile.belongsTo(models.Stakeholder, {
        foreignKey: "stakeholderId",
        targetKey: "stakeholderID",
        as: "stakeholder",
      });

      VetProfile.hasMany(models.HealthRecord, {
        foreignKey: "vetId",
        as: "healthRecords",
      });

      VetProfile.hasMany(models.Vaccination, {
        foreignKey: "administeringVetId",
        as: "administeredVaccinations",
      });
    }
  }

  VetProfile.init(
    {
      stakeholderId: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
      },
      licenseNumber: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
      },
      specialization: DataTypes.STRING(100),
    },
    {
      sequelize,
      modelName: "VetProfile",
      tableName: "VetProfiles",
    }
  );

  return VetProfile;
};
