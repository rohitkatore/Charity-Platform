const bcrypt = require("bcryptjs");
const { USER_ROLES } = require("../config/constants");
const { env } = require("../config/env");
const { findUserByEmail, saveUser, createSubscriber } = require("../data/store");

function ensureAdminSeed() {
  const existing = findUserByEmail(env.adminSeedEmail);
  if (!existing) {
    const user = createSubscriber({
      email: env.adminSeedEmail,
      passwordHash: bcrypt.hashSync(env.adminSeedPassword, 12),
    });
    return saveUser({ ...user, role: USER_ROLES.admin });
  }

  if (existing.role !== USER_ROLES.admin) {
    return saveUser({ ...existing, role: USER_ROLES.admin });
  }

  return existing;
}

module.exports = {
  ensureAdminSeed,
};
