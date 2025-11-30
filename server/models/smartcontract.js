"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class SmartContract extends Model {
    static associate(models) {
      /*
        SmartContract.belongsTo(models.Stakeholder, {
            foreignKey: 'creatorId',
            as: 'deployer'
        });
        */
    }
  }

  SmartContract.init(
    {
      contractID: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      contractType: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      conditions: DataTypes.TEXT,
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      creator: {
        type: DataTypes.STRING(150),
        allowNull: false,
      },
      lastExecutedAt: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "SmartContract",
      tableName: "SmartContracts",
    }
  );

  return SmartContract;
};
