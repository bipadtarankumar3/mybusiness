'use strict';
const { columns } = require('../utils/migrationColumns');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const c = columns(queryInterface, Sequelize);
    await queryInterface.createTable(
      'business_integrations',
      {
        id: c.id(),
        business_id: c.fk('businesses', 'CASCADE'),
        provider: { type: Sequelize.STRING(40), allowNull: false },
        status: { type: Sequelize.ENUM('not_configured', 'configured', 'error'), allowNull: false, defaultValue: 'not_configured' },
        external_account_id: { type: Sequelize.STRING(64), allowNull: true },
        credentials_encrypted: { type: Sequelize.TEXT, allowNull: true },
        config: { type: Sequelize.JSON, allowNull: true },
        last_error: { type: Sequelize.STRING(500), allowNull: true },
        ...c.timestamps(),
      },
      c.tableOptions
    );
    await queryInterface.addIndex('business_integrations', ['business_id', 'provider'], { unique: true, name: 'bi_business_provider_uq' });
    await queryInterface.addIndex('business_integrations', ['provider', 'external_account_id'], { name: 'bi_provider_external_idx' });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('business_integrations');
  },
};
