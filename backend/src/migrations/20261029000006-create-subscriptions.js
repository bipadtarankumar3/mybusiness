'use strict';
const { columns } = require('../utils/migrationColumns');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const c = columns(queryInterface, Sequelize);
    await queryInterface.createTable(
      'subscriptions',
      {
        id: c.id(),
        business_id: c.fk('businesses', 'CASCADE'),
        plan_id: c.fk('plans', 'RESTRICT'),
        status: {
          type: Sequelize.ENUM('trialing', 'active', 'past_due', 'cancelled'),
          allowNull: false,
          defaultValue: 'active',
        },
        billing_cycle: { type: Sequelize.ENUM('monthly', 'yearly'), allowNull: false, defaultValue: 'monthly' },
        current_period_start: c.date(),
        current_period_end: c.date(),
        cancelled_at: c.date(),
        ...c.timestamps(),
      },
      c.tableOptions
    );
    await queryInterface.addIndex('subscriptions', ['business_id'], { unique: true, name: 'subscriptions_business_uq' });
    await queryInterface.addIndex('subscriptions', ['plan_id'], { name: 'subscriptions_plan_idx' });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('subscriptions');
  },
};
