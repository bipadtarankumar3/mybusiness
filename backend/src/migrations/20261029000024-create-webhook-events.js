'use strict';
const { columns } = require('../utils/migrationColumns');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const c = columns(queryInterface, Sequelize);
    await queryInterface.createTable(
      'webhook_events',
      {
        id: c.id(),
        business_id: c.fk('businesses', 'SET NULL'),
        provider: { type: Sequelize.STRING(40), allowNull: false },
        event_id: { type: Sequelize.STRING(191), allowNull: false },
        event_type: { type: Sequelize.STRING(40), allowNull: false },
        processed_at: c.date(),
        ...c.timestamps({ updatedAt: false }),
      },
      c.tableOptions
    );
    await queryInterface.addIndex('webhook_events', ['provider', 'event_id'], { unique: true, name: 'webhook_provider_event_uq' });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('webhook_events');
  },
};
