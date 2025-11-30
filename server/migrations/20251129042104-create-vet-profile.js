"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("VetProfiles", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      stakeholderId: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true,
        references: {
          model: "Stakeholders",
          key: "stakeholderID",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      licenseNumber: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
      },
      specialization: {
        type: Sequelize.STRING(100),
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
    await queryInterface.dropTable("VetProfiles");
  },
};
