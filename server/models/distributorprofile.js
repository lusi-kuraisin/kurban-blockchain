"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class DistributorProfile extends Model {
    static associate(models) {
      DistributorProfile.belongsTo(models.Stakeholder, {
        foreignKey: "stakeholderId",
        targetKey: "stakeholderID",
        as: "stakeholder",
      });

      DistributorProfile.hasMany(models.SupplyChainMovement, {
        foreignKey: "responsiblePartyId",
        as: "movementsHandled",
      });
    }
  }

  DistributorProfile.init(
    {
      stakeholderId: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
      },
      companyName: {
        type: DataTypes.STRING(150),
        allowNull: false,
      },
      licenseNumber: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
      },
      vehicleInfo: DataTypes.STRING(255),
    },
    {
      sequelize,
      modelName: "DistributorProfile",
      tableName: "DistributorProfiles",
    }
  );

  return DistributorProfile;
};
