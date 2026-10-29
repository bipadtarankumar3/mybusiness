'use strict';
const { columns } = require('../utils/migrationColumns');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const c = columns(queryInterface, Sequelize);
    await queryInterface.createTable(
      'notifications',
      {
        id: c.id(),
        business_id: c.fk('businesses', 'CASCADE'),
        user_id: c.fk('users', 'CASCADE', true),
        type: { type: Sequelize.STRING(60), allowNull: false },
        title: { type: Sequelize.STRING(200), allowNull: false },
        body: { type: Sequelize.STRING(500), allowNull: true },
        data: { type: Sequelize.JSON, allowNull: true },
        read_at: c.date(),
        ...c.timestamps(),
      },
      c.tableOptions
    );
    await queryInterface.addIndex('notifications', ['business_id', 'user_id', 'read_at'], { name: 'notifications_business_user_read_idx' });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('notifications');
  },
};
