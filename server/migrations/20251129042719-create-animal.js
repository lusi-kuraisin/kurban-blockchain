"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Animals", {
      animalID: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
      },
      qrCode: {
        type: Sequelize.TEXT,
        allowNull: false,
        unique: true,
      },
      species: {
        type: Sequelize.ENUM("Sapi", "Kambing", "Domba"),
        allowNull: false,
      },
      birthDate: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      breed: {
        type: Sequelize.STRING(100),
      },
      gender: {
        type: Sequelize.ENUM("Jantan", "Betina"),
        allowNull: false,
      },
      weight: {
        type: Sequelize.FLOAT,
      },
      healthStatus: {
        type: Sequelize.ENUM(
          "Sehat",
          "Sakit",
          "Observasi",
          "Fit for Sacrifice"
        ),
        defaultValue: "Sehat",
        allowNull: false,
      },
      currentLocation: {
        type: Sequelize.STRING(255),
      },
      status: {
        type: Sequelize.STRING(50),
        defaultValue: "Di Peternak",
        allowNull: false,
      },
      farmerProfileId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "FarmerProfiles",
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
    await queryInterface.dropTable("Animals");
  },
};
