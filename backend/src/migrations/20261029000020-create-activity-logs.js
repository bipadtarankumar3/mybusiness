'use strict';
const { columns } = require('../utils/migrationColumns');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const c = columns(queryInterface, Sequelize);
    await queryInterface.createTable(
      'activity_logs',
      {
        id: c.id(),
        business_id: c.fk('businesses', 'CASCADE'),
        actor_user_id: c.fk('users', 'SET NULL'),
        type: { type: Sequelize.STRING(60), allowNull: false },
        description: { type: Sequelize.STRING(500), allowNull: false },
        entity_type: { type: Sequelize.STRING(40), allowNull: true },
        entity_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
        metadata: { type: Sequelize.JSON, allowNull: true },
        ...c.timestamps({ updatedAt: false }),
      },
      c.tableOptions
    );
    await queryInterface.addIndex('activity_logs', ['business_id', 'created_at'], { name: 'activity_business_created_idx' });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('activity_logs');
  },
};
