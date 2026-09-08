const jwt = require("jsonwebtoken");
const User = require("../models/User");

/* Verifies "Authorization: Bearer <token>" and loads the account behind it.
   The account is re-read on every request on purpose: a suspended or deleted
   user is locked out immediately, instead of staying in until their token
   expires days later. */
async function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";

  if (!header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authorization token is missing" });
  }

  const token = header.slice(7).trim();

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }

  try {
    const user = await User.findById(payload.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({ message: "This account is no longer active" });
    }

    req.user = user;
    req.userId = user._id;
    return next();
  } catch (error) {
    return next(error);
  }
}

// Mount after requireAuth. Gates the account-management routes.
function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "This action needs an admin account" });
  }
  return next();
}

module.exports = requireAuth;
module.exports.requireAuth = requireAuth;
module.exports.requireAdmin = requireAdmin;
