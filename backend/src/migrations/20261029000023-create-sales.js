'use strict';
const { columns } = require('../utils/migrationColumns');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const c = columns(queryInterface, Sequelize);
    await queryInterface.createTable(
      'sales',
      {
        id: c.id(),
        business_id: c.fk('businesses', 'CASCADE'),
        customer_id: c.fk('customers', 'CASCADE'),
        recorded_by_user_id: c.fk('users', 'SET NULL'),
        amount: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
        currency: { type: Sequelize.STRING(3), allowNull: false, defaultValue: 'INR' },
        note: { type: Sequelize.STRING(255), allowNull: true },
        recorded_at: c.date(false),
        is_demo: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
        ...c.timestamps(),
      },
      c.tableOptions
    );
    await queryInterface.addIndex('sales', ['business_id', 'recorded_at'], { name: 'sales_business_recorded_idx' });
    await queryInterface.addIndex('sales', ['customer_id'], { name: 'sales_customer_idx' });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('sales');
  },
};
