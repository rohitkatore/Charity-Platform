const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";

async function request(path, { method = "GET", body, headers = {} } = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    const error = new Error("Unable to reach API server. Ensure backend is running and CORS origin is allowed.");
    error.status = 0;
    throw error;
  }

  if (response.status === 204) {
    return null;
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || "Request failed");
    error.status = response.status;
    throw error;
  }

  return data;
}

export const apiClient = {
  signup(payload) {
    return request("/auth/signup", { method: "POST", body: payload });
  },
  login(payload) {
    return request("/auth/login", { method: "POST", body: payload });
  },
  logout() {
    return request("/auth/logout", { method: "POST" });
  },
  getSession() {
    return request("/auth/session");
  },
  getPlans() {
    return request("/subscription/plans");
  },
  startSubscription(payload) {
    return request("/subscription/start", { method: "POST", body: payload });
  },
  createStripeCheckoutSession(payload) {
    return request("/stripe/create-checkout-session", { method: "POST", body: payload });
  },
  confirmStripeCheckoutSession(payload) {
    return request("/stripe/confirm-checkout-session", { method: "POST", body: payload });
  },
  cancelStripeSubscription() {
    return request("/stripe/cancel-subscription", { method: "POST" });
  },
  cancelSubscription() {
    return request("/subscription/cancel", { method: "POST" });
  },
  renewSubscription() {
    return request("/subscription/renew", { method: "POST" });
  },
  getSubscriberScores() {
    return request("/subscriber/scores");
  },
  getSubscriberProfile() {
    return request("/subscriber/profile");
  },
  updateSubscriberProfile(payload) {
    return request("/subscriber/profile", { method: "PATCH", body: payload });
  },
  addSubscriberScore(payload) {
    return request("/subscriber/scores", { method: "POST", body: payload });
  },
  editSubscriberScore(scoreId, payload) {
    return request(`/subscriber/scores/${scoreId}`, { method: "PATCH", body: payload });
  },
  getCharities({ search = "", featured = "all" } = {}) {
    const query = new URLSearchParams();
    if (search) {
      query.set("search", search);
    }
    if (featured && featured !== "all") {
      query.set("featured", featured);
    }
    return request(`/public/charities${query.toString() ? `?${query}` : ""}`);
  },
  getFeaturedCharity() {
    return request("/public/charities/featured");
  },
  getCharityProfile(charityId) {
    return request(`/public/charities/${charityId}`);
  },
  createIndependentDonation(charityId, payload) {
    return request(`/public/charities/${charityId}/independent-donations`, {
      method: "POST",
      body: payload,
    });
  },
  getSubscriberCharityPreference() {
    return request("/subscriber/charity-preference");
  },
  updateSubscriberCharityPreference(payload) {
    return request("/subscriber/charity-preference", { method: "PUT", body: payload });
  },
  getSubscriberWinners() {
    return request("/subscriber/winners");
  },
  getSubscriberParticipationSummary() {
    return request("/subscriber/participation-summary");
  },
  uploadWinnerProof(winnerId, payload) {
    return request(`/subscriber/winners/${winnerId}/proof`, { method: "POST", body: payload });
  },
  getAdminUsers() {
    return request("/admin/users");
  },
  updateAdminUser(userId, payload) {
    return request(`/admin/users/${userId}`, { method: "PATCH", body: payload });
  },
  getAdminUserScores(userId) {
    return request(`/admin/users/${userId}/scores`);
  },
  addAdminUserScore(userId, payload) {
    return request(`/admin/users/${userId}/scores`, { method: "POST", body: payload });
  },
  editAdminUserScore(userId, scoreId, payload) {
    return request(`/admin/users/${userId}/scores/${scoreId}`, { method: "PATCH", body: payload });
  },
  updateAdminUserSubscription(userId, payload) {
    return request(`/admin/users/${userId}/subscription`, { method: "PATCH", body: payload });
  },
  getAdminDraws() {
    return request("/admin/draws");
  },
  simulateAdminDraw(payload) {
    return request("/admin/draws/simulate", { method: "POST", body: payload });
  },
  publishAdminDraw(payload) {
    return request("/admin/draws/publish", { method: "POST", body: payload });
  },
  getAdminCharities(params = {}) {
    const query = new URLSearchParams();
    if (params.search) {
      query.set("search", params.search);
    }
    if (params.featured && params.featured !== "all") {
      query.set("featured", params.featured);
    }
    return request(`/admin/charities${query.toString() ? `?${query}` : ""}`);
  },
  createAdminCharity(payload) {
    return request("/admin/charities", { method: "POST", body: payload });
  },
  updateAdminCharity(charityId, payload) {
    return request(`/admin/charities/${charityId}`, { method: "PUT", body: payload });
  },
  deleteAdminCharity(charityId) {
    return request(`/admin/charities/${charityId}`, { method: "DELETE" });
  },
  getAdminWinners() {
    return request("/admin/winners");
  },
  reviewWinner(winnerId, payload) {
    return request(`/admin/winners/${winnerId}/review`, { method: "POST", body: payload });
  },
  markWinnerPaid(winnerId) {
    return request(`/admin/winners/${winnerId}/payment`, { method: "POST", body: { state: "paid" } });
  },
  getAdminReports() {
    return request("/admin/reports");
  },
};