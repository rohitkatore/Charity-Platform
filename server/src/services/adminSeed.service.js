const bcrypt = require("bcryptjs");
const { USER_ROLES } = require("../config/constants");
const { env } = require("../config/env");
const { findUserByEmail, saveUser, createSubscriber } = require("../data/store");

function ensureAdminSeed() {
  const existing = findUserByEmail(env.adminSeedEmail);
  const seededPasswordHash = bcrypt.hashSync(env.adminSeedPassword, 12);

  if (!existing) {
    const user = createSubscriber({
      email: env.adminSeedEmail,
      passwordHash: seededPasswordHash,
    });
    return saveUser({ ...user, role: USER_ROLES.admin });
  }

  return saveUser({
    ...existing,
    role: USER_ROLES.admin,
    passwordHash: seededPasswordHash,
  });
}

module.exports = {
  ensureAdminSeed,
};
