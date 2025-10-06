'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('MessageSMS', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      expediteur: {
        type: Sequelize.STRING,
        allowNull: false
      },
      destinataire: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      contenu: {
        type: Sequelize.BOOLEAN,
        allowNull: false
      },
      statut : {
        type: Sequelize.STRING,
        allowNull: false
      },
      dateEnvoi: {
        type: Sequelize.DATE,
        allowNull: false
      }
   });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('MessageSMS');
  }
};
