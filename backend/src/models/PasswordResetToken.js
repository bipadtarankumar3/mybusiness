'use strict';
const { Model } = require('sequelize');
const cols = require('./_columns');

module.exports = (sequelize, DataTypes) => {
  const c = cols(DataTypes);
  class PasswordResetToken extends Model {
    static associate(m) {
      PasswordResetToken.belongsTo(m.User, { foreignKey: 'userId', as: 'user', onDelete: 'CASCADE' });
    }
  }
  PasswordResetToken.init(
    {
      id: c.id(),
      userId: c.fk(),
      tokenHash: { type: DataTypes.CHAR(64), allowNull: false },
      expiresAt: c.date(false),
      usedAt: c.date(),
      ...c.timestamps({ updatedAt: false }),
    },
    {
      sequelize,
      modelName: 'PasswordResetToken',
      tableName: 'password_reset_tokens',
      underscored: true,
      updatedAt: false,
      indexes: [
        { unique: true, fields: ['token_hash'], name: 'prt_token_hash_uq' },
        { fields: ['user_id'], name: 'prt_user_idx' },
      ],
    }
  );
  return PasswordResetToken;
};
