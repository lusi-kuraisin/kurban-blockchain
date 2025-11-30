"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class FarmerProfile extends Model {
    static associate(models) {
      FarmerProfile.belongsTo(models.Stakeholder, {
        foreignKey: "stakeholderId",
        targetKey: "stakeholderID",
        as: "stakeholder",
      });

      FarmerProfile.hasMany(models.Animal, {
        foreignKey: "farmerProfileId",
        as: "animals",
      });
    }
  }

  FarmerProfile.init(
    {
      stakeholderId: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
      },
      farmAddress: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      farmCertification: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "FarmerProfile",
      tableName: "FarmerProfiles",
    }
  );

  return FarmerProfile;
};
