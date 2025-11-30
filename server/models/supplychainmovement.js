"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class SupplyChainMovement extends Model {
    static associate(models) {
      SupplyChainMovement.belongsTo(models.Animal, {
        foreignKey: "animalID",
        targetKey: "animalID",
        as: "animal",
      });

      SupplyChainMovement.belongsTo(models.DistributorProfile, {
        foreignKey: "responsiblePartyId",
        as: "responsibleParty",
      });
    }
  }

  SupplyChainMovement.init(
    {
      movementiD: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      animalID: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      fromLocation: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      toLocation: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      movementTime: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      transportConditions: DataTypes.TEXT,
      responsiblePartyId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "SupplyChainMovement",
      tableName: "SupplyChainMovements",
    }
  );

  return SupplyChainMovement;
};
