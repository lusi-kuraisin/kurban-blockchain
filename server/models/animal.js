"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Animal extends Model {
    static associate(models) {
      Animal.belongsTo(models.FarmerProfile, {
        foreignKey: "farmerProfileId",
        as: "owner",
      });

      Animal.hasMany(models.HealthRecord, {
        foreignKey: "animalID",
        as: "healthRecords",
      });

      Animal.hasMany(models.Vaccination, {
        foreignKey: "animalID",
        as: "vaccinations",
      });

      Animal.hasOne(models.HalalCertificate, {
        foreignKey: "animalID",
        as: "halalCertificate",
      });

      Animal.hasMany(models.SupplyChainMovement, {
        foreignKey: "animalID",
        as: "movements",
      });

      Animal.hasMany(models.QualityCheck, {
        foreignKey: "animalID",
        as: "qualityChecks",
      });

      Animal.hasOne(models.SlaughterProcess, {
        foreignKey: "animalID",
        as: "slaughterProcess",
      });
    }
  }

  Animal.init(
    {
      animalID: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      qrCode: {
        type: DataTypes.TEXT,
        allowNull: false,
        unique: true,
      },
      species: {
        type: DataTypes.ENUM("Sapi", "Kambing", "Domba"),
        allowNull: false,
      },
      birthDate: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      breed: DataTypes.STRING(100),
      gender: {
        type: DataTypes.ENUM("Jantan", "Betina"),
        allowNull: false,
      },
      weight: DataTypes.FLOAT,
      healthStatus: {
        type: DataTypes.ENUM(
          "Sehat",
          "Sakit",
          "Observasi",
          "Fit for Sacrifice"
        ),
        defaultValue: "Sehat",
        allowNull: false,
      },
      currentLocation: DataTypes.STRING(255),
      status: {
        type: DataTypes.STRING(50),
        defaultValue: "Di Peternak",
        allowNull: false,
      },
      farmerProfileId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "Animal",
      tableName: "Animals",
    }
  );

  return Animal;
};
