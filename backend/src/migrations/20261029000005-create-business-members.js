'use strict';
const { columns } = require('../utils/migrationColumns');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const c = columns(queryInterface, Sequelize);
    await queryInterface.createTable(
      'business_members',
      {
        id: c.id(),
        business_id: c.fk('businesses', 'CASCADE'),
        user_id: c.fk('users', 'CASCADE'),
        team_id: c.fk('teams', 'SET NULL'),
        role: { type: Sequelize.ENUM('owner', 'admin', 'agent'), allowNull: false, defaultValue: 'agent' },
        status: { type: Sequelize.ENUM('active', 'invited', 'disabled'), allowNull: false, defaultValue: 'active' },
        ...c.timestamps(),
      },
      c.tableOptions
    );
    await queryInterface.addIndex('business_members', ['business_id', 'user_id'], { unique: true, name: 'bm_business_user_uq' });
    await queryInterface.addIndex('business_members', ['user_id'], { name: 'bm_user_idx' });
    await queryInterface.addIndex('business_members', ['team_id'], { name: 'bm_team_idx' });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('business_members');
  },
};
