"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class HealthRecord extends Model {
    static associate(models) {
      HealthRecord.belongsTo(models.Animal, {
        foreignKey: "animalID",
        targetKey: "animalID",
        as: "animal",
      });

      HealthRecord.belongsTo(models.VetProfile, {
        foreignKey: "vetId",
        as: "examiner",
      });
    }
  }

  HealthRecord.init(
    {
      recordID: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      animalID: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      vetId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      examinationDate: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      temperature: DataTypes.FLOAT,
      heartRate: DataTypes.INTEGER,
      weight: DataTypes.FLOAT,
      fitForSacrifice: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      diagnosis: DataTypes.TEXT,
      treatment: DataTypes.TEXT,
      remarks: DataTypes.TEXT,
      vetSignature: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "HealthRecord",
      tableName: "HealthRecords",
    }
  );

  return HealthRecord;
};
