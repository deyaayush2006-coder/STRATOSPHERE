const User = require("../models/User");

// @route  GET /api/users
// @access Admin
exports.list = async (_req, res, next) => {
  try {
    const users = await User.find().sort({ createdAt: 1 });
    return res.status(200).json({ users: users.map((u) => u.toPublic()) });
  } catch (error) {
    return next(error);
  }
};

// @route  POST /api/users
// @desc   Create an editor or admin account. This is the only way an account
//         comes into existence besides the seed script.
// @access Admin
exports.create = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    const exists = await User.findOne({ email: email.toLowerCase().trim() });
    if (exists) {
      return res.status(409).json({ message: "An account with this email already exists" });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase().trim(),
      password,
      role: role === "admin" ? "admin" : "editor",
    });

    return res.status(201).json({ message: "Account created", user: user.toPublic() });
  } catch (error) {
    return next(error);
  }
};

// @route  PATCH /api/users/:id
// @desc   Rename, change role, suspend/reactivate, or reset a password.
// @access Admin
exports.update = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "Account not found" });
    }

    const { name, role, isActive, password } = req.body;
    const isSelf = String(user._id) === String(req.userId);

    /* Guard against the last way back in disappearing: an admin must not be
       able to demote or suspend themselves and leave nobody who can manage
       accounts. Another admin can still do it for them. */
    if (isSelf && (role === "editor" || isActive === false)) {
      return res.status(400).json({
        message: "You cannot remove your own admin access. Ask another admin to do it.",
      });
    }

    if (name !== undefined) user.name = name;
    if (role !== undefined) user.role = role === "admin" ? "admin" : "editor";
    if (isActive !== undefined) user.isActive = Boolean(isActive);
    if (password) user.password = password; // re-hashed by the pre-save hook

    await user.save();
    return res.status(200).json({ message: "Account updated", user: user.toPublic() });
  } catch (error) {
    return next(error);
  }
};

// @route  DELETE /api/users/:id
// @access Admin
exports.remove = async (req, res, next) => {
  try {
    if (String(req.params.id) === String(req.userId)) {
      return res.status(400).json({ message: "You cannot delete your own account" });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "Account not found" });
    }

    /* Refuse to remove the final admin, whoever is asking. Without this the
       panel can be locked permanently and only a database edit reopens it. */
    if (user.role === "admin") {
      const admins = await User.countDocuments({ role: "admin", isActive: true });
      if (admins <= 1) {
        return res.status(400).json({ message: "This is the last admin account — create another one first" });
      }
    }

    await user.deleteOne();
    return res.status(200).json({ message: "Account deleted" });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(404).json({ message: "Account not found" });
    }
    return next(error);
  }
};
