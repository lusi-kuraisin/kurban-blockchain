"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("SlaughterProcesses", {
      processID: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
      },
      animalID: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true,
        references: {
          model: "Animals",
          key: "animalID",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      slaughtererId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "Stakeholders",
          key: "stakeholderID",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      slaughterTime: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      location: {
        type: Sequelize.STRING(255),
      },
      method: {
        type: Sequelize.STRING(100),
      },
      islamicCompliant: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      supervisorId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "HalalInspectorProfiles",
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
    await queryInterface.dropTable("SlaughterProcesses");
  },
};
