const express = require("express");
const { body } = require("express-validator");
const { login, getMe, changePassword } = require("../controllers/authController");
const { requireAuth } = require("../middleware/auth");
const validate = require("../middleware/validate");

const router = express.Router();

/* No POST /register here on purpose — see controllers/authController.js.
   Accounts come from `npm run seed` or POST /api/users. */

router.post(
  "/login",
  [
    /* No normalizeEmail(): it strips dots from gmail addresses, so an account
       seeded as first.last@gmail.com would fail to match at login. The model
       lowercases and trims, which is all the normalising that is wanted. */
    body("email").trim().isEmail().withMessage("A valid email is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  validate,
  login
);

router.get("/me", requireAuth, getMe);

router.post(
  "/password",
  requireAuth,
  [
    body("currentPassword").notEmpty().withMessage("Current password is required"),
    body("newPassword")
      .isLength({ min: 8 })
      .withMessage("New password must be at least 8 characters long"),
  ],
  validate,
  changePassword
);

module.exports = router;
