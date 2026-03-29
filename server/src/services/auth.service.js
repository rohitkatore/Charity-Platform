const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { env } = require("../config/env");

function signAuthToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      role: user.role,
    },
    env.jwtSecret,
    { expiresIn: env.jwtTtl }
  );
}

function verifyAuthToken(token) {
  return jwt.verify(token, env.jwtSecret);
}

function parseJwtTtlToMs(ttl) {
  const match = String(ttl).match(/^(\d+)(h|m|d)$/);
  if (!match) return 8 * 60 * 60 * 1000; // default 8 hours
  const value = Number(match[1]);
  const unit = match[2];
  if (unit === "h") return value * 60 * 60 * 1000;
  if (unit === "m") return value * 60 * 1000;
  if (unit === "d") return value * 24 * 60 * 60 * 1000;
  return 8 * 60 * 60 * 1000;
}

function setAuthCookie(res, token) {
  res.cookie(env.jwtCookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.secureCookies,
    path: "/",
    maxAge: parseJwtTtlToMs(env.jwtTtl),
  });
}

function clearAuthCookie(res) {
  res.clearCookie(env.jwtCookieName, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.secureCookies,
    path: "/",
  });
}

function hashPassword(rawPassword) {
  return bcrypt.hash(rawPassword, 12);
}

function verifyPassword(rawPassword, passwordHash) {
  return bcrypt.compare(rawPassword, passwordHash);
}

module.exports = {
  signAuthToken,
  verifyAuthToken,
  setAuthCookie,
  clearAuthCookie,
  hashPassword,
  verifyPassword,
};