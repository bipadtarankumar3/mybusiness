'use strict';
const { Model } = require('sequelize');
const cols = require('./_columns');

module.exports = (sequelize, DataTypes) => {
  const c = cols(DataTypes);
  class User extends Model {
    static associate(m) {
      User.hasMany(m.BusinessMember, { foreignKey: 'userId', as: 'memberships' });
      User.hasMany(m.PasswordResetToken, { foreignKey: 'userId', as: 'passwordResetTokens' });
    }

    /** Never serialize the password hash. */
    toJSON() {
      const v = { ...this.get() };
      delete v.passwordHash;
      return v;
    }
  }
  User.init(
    {
      id: c.id(),
      name: { type: DataTypes.STRING(120), allowNull: false },
      email: {
        type: DataTypes.STRING(191),
        allowNull: false,
        set(v) {
          this.setDataValue('email', typeof v === 'string' ? v.trim().toLowerCase() : v);
        },
      },
      passwordHash: { type: DataTypes.STRING(255), allowNull: true },
      googleId: { type: DataTypes.STRING(191), allowNull: true },
      avatarUrl: { type: DataTypes.STRING(500), allowNull: true },
      isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      emailVerifiedAt: c.date(),
      lastLoginAt: c.date(),
      ...c.timestamps(),
    },
    {
      sequelize,
      modelName: 'User',
      tableName: 'users',
      underscored: true,
      indexes: [
        { unique: true, fields: ['email'], name: 'users_email_uq' },
        { unique: true, fields: ['google_id'], name: 'users_google_id_uq' },
      ],
    }
  );
  return User;
};
