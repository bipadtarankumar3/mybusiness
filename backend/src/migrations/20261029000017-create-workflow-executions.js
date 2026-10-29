'use strict';
const { columns } = require('../utils/migrationColumns');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const c = columns(queryInterface, Sequelize);
    await queryInterface.createTable(
      'workflow_executions',
      {
        id: c.id(),
        business_id: c.fk('businesses', 'CASCADE'),
        workflow_id: c.fk('workflows', 'CASCADE'),
        conversation_id: c.fk('conversations', 'SET NULL'),
        customer_id: c.fk('customers', 'SET NULL'),
        trigger_type: { type: Sequelize.STRING(40), allowNull: false },
        status: { type: Sequelize.ENUM('running', 'completed', 'failed', 'skipped'), allowNull: false, defaultValue: 'running' },
        log: { type: Sequelize.JSON, allowNull: true },
        started_at: c.date(),
        finished_at: c.date(),
        ...c.timestamps(),
      },
      c.tableOptions
    );
    await queryInterface.addIndex('workflow_executions', ['workflow_id', 'created_at'], { name: 'wfe_workflow_created_idx' });
    await queryInterface.addIndex('workflow_executions', ['business_id', 'created_at'], { name: 'wfe_business_created_idx' });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('workflow_executions');
  },
};
