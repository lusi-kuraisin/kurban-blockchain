"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("HalalCertificates", {
      certificatelD: {
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
      inspectorId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "HalalInspectorProfiles",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      issueDate: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      expiryDate: {
        type: Sequelize.DATE,
      },
      slaughterMethod: {
        type: Sequelize.STRING(100),
      },
      qiblaDirection: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      tasmiyahRecited: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      slaughtererID: {
        type: Sequelize.STRING(50),
      },
      status: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: "Issued",
      },
      inspectorSignature: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      slaughterProcessId: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true,
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
    await queryInterface.dropTable("HalalCertificates");
  },
};
