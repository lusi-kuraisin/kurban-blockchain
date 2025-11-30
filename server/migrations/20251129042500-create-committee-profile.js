"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("CommitteeProfiles", {
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
      committeeRole: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      organization: {
        type: Sequelize.STRING(150),
        allowNull: false,
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
    await queryInterface.dropTable("CommitteeProfiles");
  },
};
