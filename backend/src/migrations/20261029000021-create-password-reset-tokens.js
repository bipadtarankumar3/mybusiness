'use strict';
const { columns } = require('../utils/migrationColumns');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const c = columns(queryInterface, Sequelize);
    await queryInterface.createTable(
      'password_reset_tokens',
      {
        id: c.id(),
        user_id: c.fk('users', 'CASCADE'),
        token_hash: { type: Sequelize.CHAR(64), allowNull: false },
        expires_at: c.date(false),
        used_at: c.date(),
        ...c.timestamps({ updatedAt: false }),
      },
      c.tableOptions
    );
    await queryInterface.addIndex('password_reset_tokens', ['token_hash'], { unique: true, name: 'prt_token_hash_uq' });
    await queryInterface.addIndex('password_reset_tokens', ['user_id'], { name: 'prt_user_idx' });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('password_reset_tokens');
  },
};
