"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("IPFSFiles", {
      fileHash: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.STRING(255),
      },
      fileName: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      fileType: {
        type: Sequelize.STRING(100),
      },
      entityType: {
        type: Sequelize.ENUM(
          "HealthRecord",
          "HalalCertificate",
          "SlaughterProcess",
          "QualityCheck"
        ),
        allowNull: false,
      },
      entityID: {
        type: Sequelize.UUID,
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
    await queryInterface.addIndex("IPFSFiles", ["entityType", "entityID"]);
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("IPFSFiles");
  },
};
