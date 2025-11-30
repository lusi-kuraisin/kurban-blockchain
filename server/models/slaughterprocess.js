"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class SlaughterProcess extends Model {
    static associate(models) {
      SlaughterProcess.belongsTo(models.Animal, {
        foreignKey: "animalID",
        targetKey: "animalID",
        as: "animal",
      });

      SlaughterProcess.belongsTo(models.HalalInspectorProfile, {
        foreignKey: "supervisorId",
        as: "supervisor",
      });

      SlaughterProcess.belongsTo(models.Stakeholder, {
        foreignKey: "slaughtererId",
        targetKey: "stakeholderID",
        as: "slaughterer",
      });

      SlaughterProcess.hasOne(models.HalalCertificate, {
        foreignKey: "slaughterProcessId",
        as: "halalCertificate",
      });
    }
  }

  SlaughterProcess.init(
    {
      processID: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      animalID: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
      },
      slaughtererId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      slaughterTime: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      location: DataTypes.STRING(255),
      method: DataTypes.STRING(100),
      islamicCompliant: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      supervisorId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "SlaughterProcess",
      tableName: "SlaughterProcesses",
    }
  );

  return SlaughterProcess;
};
