"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("DistributorProfiles", {
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
      companyName: {
        type: Sequelize.STRING(150),
        allowNull: false,
      },
      licenseNumber: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
      },
      vehicleInfo: {
        type: Sequelize.STRING(255),
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
    await queryInterface.dropTable("DistributorProfiles");
  },
};
