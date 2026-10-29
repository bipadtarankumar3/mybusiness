'use strict';
const { columns } = require('../utils/migrationColumns');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const c = columns(queryInterface, Sequelize);
    await queryInterface.createTable(
      'campaigns',
      {
        id: c.id(),
        business_id: c.fk('businesses', 'CASCADE'),
        template_id: c.fk('message_templates', 'SET NULL'),
        created_by_user_id: c.fk('users', 'SET NULL'),
        name: { type: Sequelize.STRING(150), allowNull: false },
        status: {
          type: Sequelize.ENUM('draft', 'scheduled', 'sending', 'completed', 'failed', 'cancelled'),
          allowNull: false,
          defaultValue: 'draft',
        },
        audience: { type: Sequelize.JSON, allowNull: true },
        scheduled_at: c.date(),
        started_at: c.date(),
        completed_at: c.date(),
        estimated_recipients: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
        estimated_cost: { type: Sequelize.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
        demo_stats: { type: Sequelize.JSON, allowNull: true },
        is_demo: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
        ...c.timestamps(),
      },
      c.tableOptions
    );
    await queryInterface.addIndex('campaigns', ['business_id', 'status'], { name: 'campaigns_business_status_idx' });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('campaigns');
  },
};
