"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class CommitteeProfile extends Model {
    static associate(models) {
      CommitteeProfile.belongsTo(models.Stakeholder, {
        foreignKey: "stakeholderId",
        targetKey: "stakeholderID",
        as: "stakeholder",
      });

      CommitteeProfile.hasMany(models.QualityCheck, {
        foreignKey: "committeeId",
        as: "authorizedChecks",
      });
    }
  }

  CommitteeProfile.init(
    {
      stakeholderId: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
      },
      committeeRole: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      organization: {
        type: DataTypes.STRING(150),
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "CommitteeProfile",
      tableName: "CommitteeProfiles",
    }
  );

  return CommitteeProfile;
};
