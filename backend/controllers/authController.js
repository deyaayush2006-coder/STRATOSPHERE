const jwt = require("jsonwebtoken");
const User = require("../models/User");

function generateToken(user) {
  return jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "12h",
  });
}

/* There is no register endpoint. This backend sits behind an unlisted admin
   panel, so accounts are created two ways only: `npm run seed` for the first
   admin, and POST /api/users for everyone after that. A public sign-up route
   would hand anyone who found the URL an account. */

// @route  POST /api/auth/login
// @desc   Authenticate an editor/admin and return a token
// @access Public (rate limited in server.js)
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // .select("+password") because the schema excludes it by default
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select("+password");

    /* Same message for "no such user" and "wrong password": telling them
       apart lets someone enumerate which addresses have accounts. */
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: "This account has been suspended" });
    }

    user.lastLoginAt = new Date();
    await user.save({ validateBeforeSave: false });

    return res.status(200).json({
      message: "Logged in successfully",
      token: generateToken(user),
      user: user.toPublic(),
    });
  } catch (error) {
    return next(error);
  }
};

// @route  GET /api/auth/me
// @desc   The signed-in account; the dashboard calls this on load to
//         check a stored token is still good before rendering anything.
// @access Private
exports.getMe = async (req, res) => {
  return res.status(200).json({ user: req.user.toPublic() });
};

// @route  POST /api/auth/password
// @desc   Change your own password
// @access Private
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.userId).select("+password");
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    user.password = newPassword; // hashed by the pre-save hook
    await user.save();

    /* The old token stays valid until it expires — it is bound to the user
       id, not the password. Hand back a fresh one so the client at least
       stops carrying the pre-change token around. */
    return res.status(200).json({
      message: "Password changed",
      token: generateToken(user),
    });
  } catch (error) {
    return next(error);
  }
};
