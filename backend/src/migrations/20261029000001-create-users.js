'use strict';
const { columns } = require('../utils/migrationColumns');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const c = columns(queryInterface, Sequelize);
    await queryInterface.createTable(
      'users',
      {
        id: c.id(),
        name: { type: Sequelize.STRING(120), allowNull: false },
        email: { type: Sequelize.STRING(191), allowNull: false },
        password_hash: { type: Sequelize.STRING(255), allowNull: true },
        google_id: { type: Sequelize.STRING(191), allowNull: true },
        avatar_url: { type: Sequelize.STRING(500), allowNull: true },
        is_active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
        email_verified_at: c.date(),
        last_login_at: c.date(),
        ...c.timestamps(),
      },
      c.tableOptions
    );
    await queryInterface.addIndex('users', ['email'], { unique: true, name: 'users_email_uq' });
    await queryInterface.addIndex('users', ['google_id'], { unique: true, name: 'users_google_id_uq' });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('users');
  },
};
