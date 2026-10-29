'use strict';
const { columns } = require('../utils/migrationColumns');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const c = columns(queryInterface, Sequelize);
    await queryInterface.createTable(
      'workflows',
      {
        id: c.id(),
        business_id: c.fk('businesses', 'CASCADE'),
        created_by_user_id: c.fk('users', 'SET NULL'),
        name: { type: Sequelize.STRING(150), allowNull: false },
        description: { type: Sequelize.STRING(500), allowNull: true },
        status: { type: Sequelize.ENUM('draft', 'published', 'paused'), allowNull: false, defaultValue: 'draft' },
        trigger_type: { type: Sequelize.STRING(40), allowNull: true },
        trigger_config: { type: Sequelize.JSON, allowNull: true },
        definition: { type: Sequelize.JSON, allowNull: false },
        published_at: c.date(),
        execution_count: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
        is_demo: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
        ...c.timestamps(),
      },
      c.tableOptions
    );
    await queryInterface.addIndex('workflows', ['business_id', 'status', 'trigger_type'], { name: 'workflows_business_status_trigger_idx' });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('workflows');
  },
};
