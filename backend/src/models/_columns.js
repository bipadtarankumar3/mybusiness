'use strict';

/** Shared attribute helpers for models (mirror src/utils/migrationColumns.js). */
module.exports = (DataTypes) => ({
  id: () => ({ type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true, allowNull: false }),
  fk: (allowNull = false) => ({ type: DataTypes.BIGINT.UNSIGNED, allowNull }),
  date: (allowNull = true) => ({ type: DataTypes.DATE(3), allowNull }),
  timestamps: ({ updatedAt = true, deletedAt = false } = {}) => {
    const t = { createdAt: { type: DataTypes.DATE(3), allowNull: false } };
    if (updatedAt) t.updatedAt = { type: DataTypes.DATE(3), allowNull: false };
    if (deletedAt) t.deletedAt = { type: DataTypes.DATE(3), allowNull: true };
    return t;
  },
  /** DECIMAL getter returning a fixed-precision string (e.g. "1499.00") on every dialect. */
  money: (precision, scale, allowNull = false, extra = {}) => ({
    type: DataTypes.DECIMAL(precision, scale),
    allowNull,
    ...extra,
  }),
});

module.exports.decimalGetter = (field, scale = 2) =>
  function get() {
    const v = this.getDataValue(field);
    return v === null || v === undefined ? null : Number(v).toFixed(scale);
  };
