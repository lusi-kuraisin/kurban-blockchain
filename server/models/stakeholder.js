"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Stakeholder extends Model {
    static associate(models) {
      Stakeholder.hasOne(models.FarmerProfile, {
        foreignKey: "stakeholderId",
        as: "FarmerProfile",
      });

      Stakeholder.hasOne(models.VetProfile, {
        foreignKey: "stakeholderId",
        as: "VetProfile",
      });

      Stakeholder.hasOne(models.DistributorProfile, {
        foreignKey: "stakeholderId",
        as: "DistributorProfile",
      });

      Stakeholder.hasOne(models.HalalInspectorProfile, {
        foreignKey: "stakeholderId",
        as: "HalalInspectorProfile",
      });

      Stakeholder.hasOne(models.CommitteeProfile, {
        foreignKey: "stakeholderId",
        as: "CommitteeProfile",
      });
    }
  }

  Stakeholder.init(
    {
      stakeholderID: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      contactInfo: DataTypes.STRING(150),
      role: {
        type: DataTypes.ENUM(
          "Admin",
          "Farmer",
          "VeterinaryDoctor",
          "Distributor",
          "HalalInspector",
          "Committee"
        ),
        allowNull: false,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      digitalSignature: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "Stakeholder",
      tableName: "Stakeholders",
    }
  );

  return Stakeholder;
};
