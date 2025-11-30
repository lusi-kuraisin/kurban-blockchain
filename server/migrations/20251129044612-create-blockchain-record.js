"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("BlockchainRecords", {
      transactionID: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
      },
      timestamp: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      blockHash: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      previousHash: {
        type: Sequelize.STRING(255),
      },
      transactionDataHash: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true,
      },
      digitalSignature: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      entityType: {
        type: Sequelize.ENUM(
          "Animal",
          "HealthRecord",
          "Vaccination",
          "HalalCertificate",
          "SupplyChainMovement",
          "QualityCheck",
          "SlaughterProcess"
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
    await queryInterface.addIndex("BlockchainRecords", [
      "entityType",
      "entityID",
    ]);
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("BlockchainRecords");
  },
};
