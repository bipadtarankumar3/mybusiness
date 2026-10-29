'use strict';
const { columns } = require('../utils/migrationColumns');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const c = columns(queryInterface, Sequelize);
    await queryInterface.createTable(
      'customer_tags',
      {
        id: c.id(),
        business_id: c.fk('businesses', 'CASCADE'),
        name: { type: Sequelize.STRING(60), allowNull: false },
        color: { type: Sequelize.STRING(9), allowNull: false, defaultValue: '#16C784' },
        ...c.timestamps(),
      },
      c.tableOptions
    );
    await queryInterface.addIndex('customer_tags', ['business_id', 'name'], { unique: true, name: 'customer_tags_business_name_uq' });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('customer_tags');
  },
};
