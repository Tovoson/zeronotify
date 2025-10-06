'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('Admin', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      nom: {
        type: Sequelize.STRING,
        allowNull: false
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      active: {
        type: Sequelize.BOOLEAN,
        allowNull: false
      },
      mot_de_passe : {
        type: Sequelize.STRING,
        allowNull: false
      },
      entreprise: {
        type: Sequelize.STRING,
        allowNull: true
      }
   });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('Admin');
  }
};
