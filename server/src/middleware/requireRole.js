function requireRole(allowedRoles = []) {
  return function roleBoundary(req, res, next) {
    const currentRole = req.auth?.user?.role;
    if (!allowedRoles.includes(currentRole)) {
      return res.status(403).json({ error: "Role not permitted" });
    }

    return next();
  };
}

module.exports = { requireRole };