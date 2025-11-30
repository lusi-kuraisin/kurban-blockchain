"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class QualityCheck extends Model {
    static associate(models) {
      QualityCheck.belongsTo(models.Animal, {
        foreignKey: "animalID",
        targetKey: "animalID",
        as: "animal",
      });

      QualityCheck.belongsTo(models.CommitteeProfile, {
        foreignKey: "committeeId",
        as: "authorizer",
      });
    }
  }

  QualityCheck.init(
    {
      checkID: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      animalID: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      checkType: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      checkDate: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      parameters: DataTypes.TEXT,
      results: DataTypes.TEXT,
      passed: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      inspector: DataTypes.STRING(150),
      committeeId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "QualityCheck",
      tableName: "QualityChecks",
    }
  );

  return QualityCheck;
};
