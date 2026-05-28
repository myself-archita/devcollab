const crypto = require("crypto");
const bcrypt = require("bcryptjs");

const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS || 12);
const SESSION_TTL_DAYS = Number(process.env.SESSION_TTL_DAYS || 7);

function createToken() {
  return crypto.randomBytes(24).toString("hex");
}

function createId(prefix) {
  return `${prefix}${Date.now().toString(36)}${crypto.randomBytes(4).toString("hex")}`;
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function isPasswordHash(value) {
  return typeof value === "string" && /^\$2[aby]\$\d{2}\$/.test(value);
}

async function hashPassword(password) {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

async function verifyPassword(password, passwordHash) {
  if (!passwordHash) return false;
  if (isPasswordHash(passwordHash)) return bcrypt.compare(password, passwordHash);
  return password === passwordHash;
}

function createSessionExpiry() {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_TTL_DAYS);
  return expiresAt.toISOString();
}

module.exports = {
  SESSION_TTL_DAYS,
  createId,
  createSessionExpiry,
  createToken,
  hashPassword,
  hashToken,
  isPasswordHash,
  verifyPassword
};
