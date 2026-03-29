const { env } = require("../config/env");
const { findUserById } = require("../data/store");

let nodemailer = null;

function canUseSmtp() {
  return Boolean(env.smtpHost && env.smtpFrom);
}

function getTransport() {
  if (!nodemailer) {
    nodemailer = require("nodemailer");
  }

  if (canUseSmtp()) {
    return nodemailer.createTransport({
      host: env.smtpHost,
      port: env.smtpPort,
      secure: env.smtpSecure,
      auth: env.smtpUser ? { user: env.smtpUser, pass: env.smtpPass || "" } : undefined,
    });
  }

  return nodemailer.createTransport({ jsonTransport: true });
}

async function sendEmail({ to, subject, text }) {
  if (!to) {
    return { skipped: true, reason: "missing-recipient" };
  }

  const transport = getTransport();
  const info = await transport.sendMail({
    from: env.smtpFrom || "no-reply@golf-charity.local",
    to,
    subject,
    text,
  });

  return {
    delivered: true,
    provider: canUseSmtp() ? "smtp" : "json-transport",
    messageId: info.messageId || null,
  };
}

async function sendSystemUpdateEmail({ userEmail, action, details }) {
  return sendEmail({
    to: userEmail,
    subject: `Platform Update: ${action}`,
    text: `${action}\n\n${details}`,
  });
}

async function sendDrawResultNotifications(draw) {
  const participants = Array.isArray(draw?.participants) ? draw.participants : [];
  const emails = new Map();

  for (const participant of participants) {
    const user = findUserById(participant.userId);
    if (user?.email) {
      emails.set(participant.userId, user.email);
    }
  }

  const tasks = [];
  for (const participant of participants) {
    const email = emails.get(participant.userId);
    if (!email) {
      continue;
    }

    const isWinner = Boolean(participant.tier && Number(participant.winningAmount || 0) > 0);
    const subject = isWinner
      ? `Winner Alert: Draw ${draw.drawMonth}`
      : `Draw Results: ${draw.drawMonth}`;

    const text = [
      `Draw Month: ${draw.drawMonth}`,
      `Draw Numbers: ${(draw.drawNumbers || []).join(", ")}`,
      `Your Match Count: ${participant.matchCount}`,
      `Tier: ${participant.tier || "none"}`,
      `Winning Amount: ${participant.winningAmount || 0}`,
    ].join("\n");

    tasks.push(sendEmail({ to: email, subject, text }));
  }

  return Promise.allSettled(tasks);
}

module.exports = {
  sendEmail,
  sendSystemUpdateEmail,
  sendDrawResultNotifications,
};
