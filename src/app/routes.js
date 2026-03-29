export const USER_ROLES = {
  public: "public",
  subscriber: "subscriber",
  admin: "admin",
};

export const ROUTE_PATHS = {
  public: {
    home: "/",
    charities: "/charities",
    charityProfile: "/charities/:charityId",
    drawMechanics: "/draw-mechanics",
    subscribe: "/subscribe",
    subscribeSuccess: "/subscribe/success",
    subscribeCancelled: "/subscribe/cancelled",
    login: "/login",
    signup: "/signup",
  },
  auth: {
    signup: "/auth/signup",
    signupConfirm: "/signup/confirm",
    login: "/auth/login",
    forgotPassword: "/auth/forgot-password",
    updatePassword: "/auth/update-password",
    callback: "/auth/callback",
  },
  shared: {
    accessRestricted: "/access-restricted",
  },
  subscriber: {
    base: "/dashboard/*",
    home: "",
    subscription: "subscription",
    scores: "scores",
    charity: "charity",
    participation: "participation",
    winnings: "winnings",
    proofUpload: "winnings/proof-upload",
  },
  admin: {
    base: "/admin/*",
    home: "users",
    users: "users",
    draws: "draws",
    charities: "charities",
    winners: "winners",
    reports: "reports",
  },
};