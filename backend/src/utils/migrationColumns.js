'use strict';

/**
 * Column helpers shared by migrations. Keep these STABLE: changing them changes the
 * meaning of already-applied migrations. Add new helpers instead of editing old ones.
 *
 * Usage inside a migration:
 *   const c = columns(queryInterface, Sequelize);
 *   await queryInterface.createTable('x', { id: c.id(), business_id: c.fk('businesses'), ...c.timestamps() }, c.tableOptions);
 */
function columns(queryInterface, Sequelize) {
  const dialect = queryInterface.sequelize.getDialect();
  const nowDefault = dialect === 'mysql' ? Sequelize.literal('CURRENT_TIMESTAMP(3)') : Sequelize.literal('CURRENT_TIMESTAMP');

  return {
    dialect,
    id() {
      return { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true, allowNull: false };
    },
    /**
     * Foreign key column (BIGINT UNSIGNED) with explicit ON DELETE behaviour.
     * SET NULL implies nullable.
     */
    fk(table, onDelete = 'CASCADE', allowNull = false) {
      return {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: onDelete === 'SET NULL' ? true : allowNull,
        references: { model: table, key: 'id' },
        onUpdate: 'CASCADE',
        onDelete,
      };
    },
    date(allowNull = true) {
      return { type: Sequelize.DATE(3), allowNull };
    },
    timestamps({ updatedAt = true, deletedAt = false } = {}) {
      const cols = { created_at: { type: Sequelize.DATE(3), allowNull: false, defaultValue: nowDefault } };
      if (updatedAt) cols.updated_at = { type: Sequelize.DATE(3), allowNull: false, defaultValue: nowDefault };
      if (deletedAt) cols.deleted_at = { type: Sequelize.DATE(3), allowNull: true };
      return cols;
    },
    tableOptions: dialect === 'mysql' ? { charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci', engine: 'InnoDB' } : {},
  };
}

module.exports = { columns };
