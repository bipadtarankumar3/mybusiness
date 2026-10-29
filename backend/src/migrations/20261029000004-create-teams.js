'use strict';
const { columns } = require('../utils/migrationColumns');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const c = columns(queryInterface, Sequelize);
    await queryInterface.createTable(
      'teams',
      {
        id: c.id(),
        business_id: c.fk('businesses', 'CASCADE'),
        name: { type: Sequelize.STRING(100), allowNull: false },
        description: { type: Sequelize.STRING(255), allowNull: true },
        ...c.timestamps(),
      },
      c.tableOptions
    );
    await queryInterface.addIndex('teams', ['business_id', 'name'], { unique: true, name: 'teams_business_name_uq' });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('teams');
  },
};
