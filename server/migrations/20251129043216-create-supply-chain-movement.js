"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("SupplyChainMovements", {
      movementiD: {
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
      fromLocation: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      toLocation: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      movementTime: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      transportConditions: {
        type: Sequelize.TEXT,
      },
      responsiblePartyId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "DistributorProfiles",
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
    await queryInterface.dropTable("SupplyChainMovements");
  },
};
