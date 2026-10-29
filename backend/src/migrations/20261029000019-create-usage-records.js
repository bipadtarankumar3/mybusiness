'use strict';
const { columns } = require('../utils/migrationColumns');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const c = columns(queryInterface, Sequelize);
    await queryInterface.createTable(
      'usage_records',
      {
        id: c.id(),
        business_id: c.fk('businesses', 'CASCADE'),
        metric: { type: Sequelize.STRING(40), allowNull: false },
        quantity: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, defaultValue: 1 },
        unit_cost: { type: Sequelize.DECIMAL(10, 4), allowNull: false, defaultValue: 0 },
        period_start: { type: Sequelize.DATEONLY, allowNull: false },
        reference_type: { type: Sequelize.STRING(40), allowNull: true },
        reference_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
        ...c.timestamps({ updatedAt: false }),
      },
      c.tableOptions
    );
    await queryInterface.addIndex('usage_records', ['business_id', 'metric', 'period_start'], { name: 'usage_business_metric_period_idx' });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('usage_records');
  },
};
