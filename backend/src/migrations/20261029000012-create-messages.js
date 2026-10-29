'use strict';
const { columns } = require('../utils/migrationColumns');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const c = columns(queryInterface, Sequelize);
    await queryInterface.createTable(
      'messages',
      {
        id: c.id(),
        business_id: c.fk('businesses', 'CASCADE'),
        conversation_id: c.fk('conversations', 'CASCADE'),
        template_id: c.fk('message_templates', 'SET NULL'),
        sent_by_user_id: c.fk('users', 'SET NULL'),
        direction: { type: Sequelize.ENUM('inbound', 'outbound'), allowNull: false },
        type: { type: Sequelize.ENUM('text', 'template', 'note'), allowNull: false, defaultValue: 'text' },
        body: { type: Sequelize.TEXT, allowNull: true },
        status: {
          type: Sequelize.ENUM('simulated', 'queued', 'accepted', 'sent', 'delivered', 'read', 'failed', 'received'),
          allowNull: false,
        },
        provider_message_id: { type: Sequelize.STRING(128), allowNull: true },
        error_message: { type: Sequelize.STRING(500), allowNull: true },
        status_updated_at: c.date(),
        metadata: { type: Sequelize.JSON, allowNull: true },
        ...c.timestamps(),
      },
      c.tableOptions
    );
    await queryInterface.addIndex('messages', ['provider_message_id'], { unique: true, name: 'messages_provider_msg_uq' });
    await queryInterface.addIndex('messages', ['conversation_id', 'created_at'], { name: 'messages_conv_created_idx' });
    await queryInterface.addIndex('messages', ['business_id', 'created_at'], { name: 'messages_business_created_idx' });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('messages');
  },
};
