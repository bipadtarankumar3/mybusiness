'use strict';

/**
 * Sequelize connection config (used by the app AND sequelize-cli via .sequelizerc).
 *
 * MySQL 8 is the only supported database for development/production.
 * `DB_DIALECT=sqlite` (+ `DB_STORAGE=:memory:` or a file path) is supported ONLY for the
 * automated test-suite and local migration smoke checks; it is rejected in production.
 */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

function build() {
  const dialect = process.env.DB_DIALECT === 'sqlite' ? 'sqlite' : 'mysql';
  if (dialect === 'sqlite') {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('DB_DIALECT=sqlite is only allowed for tests');
    }
    return {
      dialect: 'sqlite',
      storage: process.env.DB_STORAGE || ':memory:',
      logging: false,
      define: { underscored: true },
    };
  }
  return {
    dialect: 'mysql',
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    database: process.env.DB_NAME || 'chatflow',
    username: process.env.DB_USER || 'chatflow',
    password: process.env.DB_PASSWORD || '',
    timezone: '+00:00',
    logging: false,
    dialectOptions: {
      dateStrings: false,
      supportBigNumbers: true,
      bigNumberStrings: false,
      charset: 'utf8mb4',
    },
    define: {
      underscored: true,
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
    },
    pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
    migrationStorageTableName: 'sequelize_meta',
    seederStorage: 'sequelize',
    seederStorageTableName: 'sequelize_data',
  };
}

const config = build();

module.exports = {
  development: config,
  test: config,
  production: config,
};
