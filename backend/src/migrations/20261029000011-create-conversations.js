'use strict';
const { columns } = require('../utils/migrationColumns');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const c = columns(queryInterface, Sequelize);
    await queryInterface.createTable(
      'conversations',
      {
        id: c.id(),
        business_id: c.fk('businesses', 'CASCADE'),
        customer_id: c.fk('customers', 'CASCADE'),
        assigned_to_user_id: c.fk('users', 'SET NULL'),
        channel: { type: Sequelize.ENUM('whatsapp'), allowNull: false, defaultValue: 'whatsapp' },
        status: { type: Sequelize.ENUM('open', 'pending', 'resolved'), allowNull: false, defaultValue: 'open' },
        is_demo: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
        unread_count: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
        last_message_at: c.date(),
        last_message_preview: { type: Sequelize.STRING(255), allowNull: true },
        last_inbound_at: c.date(),
        ...c.timestamps(),
      },
      c.tableOptions
    );
    await queryInterface.addIndex('conversations', ['business_id', 'status', 'last_message_at'], { name: 'conv_business_status_last_idx' });
    await queryInterface.addIndex('conversations', ['customer_id'], { name: 'conv_customer_idx' });
    await queryInterface.addIndex('conversations', ['assigned_to_user_id'], { name: 'conv_assignee_idx' });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('conversations');
  },
};
