'use strict';
const { columns } = require('../utils/migrationColumns');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const c = columns(queryInterface, Sequelize);
    await queryInterface.createTable(
      'campaign_recipients',
      {
        id: c.id(),
        business_id: c.fk('businesses', 'CASCADE'),
        campaign_id: c.fk('campaigns', 'CASCADE'),
        customer_id: c.fk('customers', 'CASCADE'),
        message_id: c.fk('messages', 'SET NULL'),
        phone: { type: Sequelize.STRING(20), allowNull: false },
        status: {
          type: Sequelize.ENUM('queued', 'accepted', 'sent', 'delivered', 'read', 'failed', 'skipped'),
          allowNull: false,
          defaultValue: 'queued',
        },
        error_message: { type: Sequelize.STRING(500), allowNull: true },
        ...c.timestamps(),
      },
      c.tableOptions
    );
    await queryInterface.addIndex('campaign_recipients', ['campaign_id', 'customer_id'], { unique: true, name: 'cr_campaign_customer_uq' });
    await queryInterface.addIndex('campaign_recipients', ['campaign_id', 'status'], { name: 'cr_campaign_status_idx' });
    await queryInterface.addIndex('campaign_recipients', ['customer_id'], { name: 'cr_customer_idx' });
    await queryInterface.addIndex('campaign_recipients', ['message_id'], { name: 'cr_message_idx' });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('campaign_recipients');
  },
};
