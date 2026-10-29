'use strict';
const { columns } = require('../utils/migrationColumns');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const c = columns(queryInterface, Sequelize);
    await queryInterface.createTable(
      'follow_up_reminders',
      {
        id: c.id(),
        business_id: c.fk('businesses', 'CASCADE'),
        customer_id: c.fk('customers', 'CASCADE'),
        assigned_to_user_id: c.fk('users', 'SET NULL'),
        created_by_user_id: c.fk('users', 'SET NULL'),
        title: { type: Sequelize.STRING(200), allowNull: false },
        notes: { type: Sequelize.TEXT, allowNull: true },
        due_at: c.date(false),
        status: { type: Sequelize.ENUM('pending', 'completed', 'cancelled'), allowNull: false, defaultValue: 'pending' },
        completed_at: c.date(),
        ...c.timestamps(),
      },
      c.tableOptions
    );
    await queryInterface.addIndex('follow_up_reminders', ['business_id', 'status', 'due_at'], { name: 'fur_business_status_due_idx' });
    await queryInterface.addIndex('follow_up_reminders', ['customer_id'], { name: 'fur_customer_idx' });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('follow_up_reminders');
  },
};
