const { env } = require("./config/env");

function bootstrap() {
  // Placeholder entry point for backend scaffolding.
  return {
    appName: "golf-charity-subscription-platform",
    mode: env.nodeEnv,
  };
}

module.exports = { bootstrap };