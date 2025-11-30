"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("HealthRecords", {
      recordID: {
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
      vetId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "VetProfiles",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      examinationDate: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      temperature: {
        type: Sequelize.FLOAT,
      },
      heartRate: {
        type: Sequelize.INTEGER,
      },
      weight: {
        type: Sequelize.FLOAT,
      },
      fitForSacrifice: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      diagnosis: {
        type: Sequelize.TEXT,
      },
      treatment: {
        type: Sequelize.TEXT,
      },
      remarks: {
        type: Sequelize.TEXT,
      },
      vetSignature: {
        type: Sequelize.STRING,
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
    await queryInterface.dropTable("HealthRecords");
  },
};
