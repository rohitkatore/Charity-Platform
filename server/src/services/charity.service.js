const {
  MIN_CHARITY_CONTRIBUTION_PERCENTAGE,
} = require("../config/constants");
const {
  listCharities,
  findCharityById,
  createCharity,
  updateCharity,
  deleteCharity,
  findCharityPreferenceByUserId,
  saveCharityPreference,
  createIndependentDonation,
} = require("../data/store");

function validateContributionPercentage(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < MIN_CHARITY_CONTRIBUTION_PERCENTAGE) {
    const error = new Error(`Contribution percentage must be at least ${MIN_CHARITY_CONTRIBUTION_PERCENTAGE}%`);
    error.status = 400;
    throw error;
  }

  return numeric;
}

function normalizeList(values) {
  if (!Array.isArray(values)) {
    return [];
  }

  return values.map((item) => String(item)).filter((item) => item.trim().length > 0);
}

function searchAndFilterCharities({ search = "", featured } = {}) {
  const term = String(search || "").trim().toLowerCase();
  const featuredMode = String(featured || "all").toLowerCase();

  return listCharities().filter((charity) => {
    if (featuredMode === "featured" && !charity.isFeatured) {
      return false;
    }

    if (featuredMode === "non-featured" && charity.isFeatured) {
      return false;
    }

    if (!term) {
      return true;
    }

    return (
      charity.name.toLowerCase().includes(term) ||
      charity.description.toLowerCase().includes(term)
    );
  });
}

function getFeaturedCharity() {
  return listCharities().find((charity) => charity.isFeatured) || null;
}

function getCharityProfile(charityId) {
  const charity = findCharityById(charityId);
  if (!charity) {
    const error = new Error("Charity not found");
    error.status = 404;
    throw error;
  }

  return charity;
}

function setUserCharityPreference({ userId, charityId, contributionPercentage }) {
  const charity = findCharityById(charityId);
  if (!charity) {
    const error = new Error("Selected charity does not exist");
    error.status = 400;
    throw error;
  }

  const normalizedPercentage = validateContributionPercentage(contributionPercentage);
  const now = new Date().toISOString();
  return saveCharityPreference({
    userId,
    charityId,
    contributionPercentage: normalizedPercentage,
    createdAt: now,
    updatedAt: now,
  });
}

function getUserCharityPreference(userId) {
  return findCharityPreferenceByUserId(userId);
}

function createIndependentDonationIntent({ charityId, donorEmail, amount }) {
  const charity = findCharityById(charityId);
  if (!charity) {
    const error = new Error("Charity not found");
    error.status = 404;
    throw error;
  }

  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    const error = new Error("Donation amount must be greater than 0");
    error.status = 400;
    throw error;
  }

  return createIndependentDonation({
    charityId,
    donorEmail: donorEmail || null,
    amount: numericAmount,
    status: "recorded",
  });
}

function validateCharityPayload(payload) {
  const name = String(payload?.name || "").trim();
  const description = String(payload?.description || "").trim();
  if (!name || !description) {
    const error = new Error("Charity name and description are required");
    error.status = 400;
    throw error;
  }

  return {
    name,
    description,
    images: normalizeList(payload.images),
    upcomingEvents: normalizeList(payload.upcomingEvents),
    isFeatured: Boolean(payload.isFeatured),
  };
}

function createCharityRecord(payload) {
  const validated = validateCharityPayload(payload);
  return createCharity(validated);
}

function updateCharityRecord(charityId, payload) {
  const validated = validateCharityPayload(payload);
  const updated = updateCharity(charityId, validated);
  if (!updated) {
    const error = new Error("Charity not found");
    error.status = 404;
    throw error;
  }
  return updated;
}

function deleteCharityRecord(charityId) {
  const ok = deleteCharity(charityId);
  if (!ok) {
    const error = new Error("Charity not found");
    error.status = 404;
    throw error;
  }
}

module.exports = {
  MIN_CHARITY_CONTRIBUTION_PERCENTAGE,
  validateContributionPercentage,
  searchAndFilterCharities,
  getFeaturedCharity,
  getCharityProfile,
  setUserCharityPreference,
  getUserCharityPreference,
  createIndependentDonationIntent,
  createCharityRecord,
  updateCharityRecord,
  deleteCharityRecord,
};