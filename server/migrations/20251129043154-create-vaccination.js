"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Vaccinations", {
      vaccinationID: {
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
      vaccineType: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      vaccinationDate: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      nextDueDate: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      batchNumber: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      administeringVetId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "VetProfiles",
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
    await queryInterface.dropTable("Vaccinations");
  },
};
