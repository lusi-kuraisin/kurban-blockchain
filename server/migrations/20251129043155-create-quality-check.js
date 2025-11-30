"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("QualityChecks", {
      checkID: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
      },
      animalID: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "Animals",
          key: "animalID",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      checkType: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      checkDate: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      parameters: {
        type: Sequelize.TEXT,
      },
      results: {
        type: Sequelize.TEXT,
      },
      passed: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      inspector: {
        type: Sequelize.STRING(150),
      },
      committeeId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "CommitteeProfiles",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("QualityChecks");
  },
};
