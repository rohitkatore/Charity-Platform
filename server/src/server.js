require("dotenv").config();

// Global unhandled rejection handler — prevent silent process crashes.
process.on("unhandledRejection", (reason) => {
  // eslint-disable-next-line no-console
  console.error("Unhandled promise rejection:", reason);
});

const { createApp } = require("./app");
const { env } = require("./config/env");
const { seedDemoSubscriber } = require("./scripts/seedDemoSubscriber");
const { ensureAdminSeed } = require("./services/adminSeed.service");

const app = createApp();

if (env.autoSeedDemo) {
  const demo = seedDemoSubscriber();
  // eslint-disable-next-line no-console
  console.log("Demo subscriber seeded:", demo.email, "plan:", demo.planId);
}

if (env.autoSeedAdmin) {
  const admin = ensureAdminSeed();
  // eslint-disable-next-line no-console
  console.log("Admin seeded:", admin.email);
}

app.listen(env.apiPort, () => {
  // eslint-disable-next-line no-console
  console.log(`API listening on http://localhost:${env.apiPort}`);
});