const { Router } = require("express");
const {
  searchAndFilterCharities,
  getFeaturedCharity,
  getCharityProfile,
  createIndependentDonationIntent,
} = require("../../services/charity.service");

const publicRouter = Router();

publicRouter.get("/meta", (req, res) => {
  res.json({
    message: "Public API available",
  });
});

publicRouter.get("/charities", (req, res) => {
  const charities = searchAndFilterCharities({
    search: req.query.search,
    featured: req.query.featured,
  });
  res.json({ charities });
});

publicRouter.get("/charities/featured", (req, res) => {
  const charity = getFeaturedCharity();
  res.json({ charity });
});

publicRouter.get("/charities/:charityId", (req, res, next) => {
  try {
    const charity = getCharityProfile(req.params.charityId);
    return res.json({ charity });
  } catch (error) {
    return next(error);
  }
});

publicRouter.post("/charities/:charityId/independent-donations", (req, res, next) => {
  try {
    const donation = createIndependentDonationIntent({
      charityId: req.params.charityId,
      donorEmail: req.body?.donorEmail,
      amount: req.body?.amount,
    });
    return res.status(201).json({
      donation,
      note: "Independent donation intent recorded. Payment execution is intentionally not implemented in current PRD scope.",
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = { publicRouter };