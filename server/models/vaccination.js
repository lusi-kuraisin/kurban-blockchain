"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Vaccination extends Model {
    static associate(models) {
      Vaccination.belongsTo(models.Animal, {
        foreignKey: "animalID",
        targetKey: "animalID",
        as: "animal",
      });

      Vaccination.belongsTo(models.VetProfile, {
        foreignKey: "administeringVetId",
        as: "administeringVet",
      });
    }
  }

  Vaccination.init(
    {
      vaccinationID: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      animalID: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      vaccineType: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      vaccinationDate: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      nextDueDate: DataTypes.DATE,
      batchNumber: DataTypes.STRING(50),
      administeringVetId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "Vaccination",
      tableName: "Vaccinations",
    }
  );

  return Vaccination;
};
