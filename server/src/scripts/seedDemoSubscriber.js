const bcrypt = require("bcryptjs");
const { PLANS } = require("../config/constants");
const {
  createSubscriber,
  findUserByEmail,
  findSubscriptionByUserId,
  listCharities,
} = require("../data/store");
const { createOrActivateSubscription } = require("../services/subscription.service");
const { setUserCharityPreference } = require("../services/charity.service");

const DEMO_SUBSCRIBER = {
  email: "demo.subscriber@golfcharity.local",
  password: "DemoPass123!",
};

function seedDemoSubscriber() {
  let user = findUserByEmail(DEMO_SUBSCRIBER.email);
  if (!user) {
    const passwordHash = bcrypt.hashSync(DEMO_SUBSCRIBER.password, 12);
    user = createSubscriber({ email: DEMO_SUBSCRIBER.email, passwordHash });
  }

  const subscription = findSubscriptionByUserId(user.id);
  if (!subscription || subscription.status !== "active") {
    createOrActivateSubscription({
      userId: user.id,
      planId: PLANS.monthly.id,
    });
  }

  const charities = listCharities();
  if (charities.length > 0) {
    setUserCharityPreference({
      userId: user.id,
      charityId: charities[0].id,
      contributionPercentage: 10,
    });
  }

  return {
    email: DEMO_SUBSCRIBER.email,
    password: DEMO_SUBSCRIBER.password,
    planId: PLANS.monthly.id,
  };
}

module.exports = {
  seedDemoSubscriber,
  DEMO_SUBSCRIBER,
};