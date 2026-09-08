const express = require("express");
const { body } = require("express-validator");
const { list, create, update, remove } = require("../controllers/userController");
const { requireAuth, requireAdmin } = require("../middleware/auth");
const validate = require("../middleware/validate");

const router = express.Router();

// Every route here is admin-only; editors never see this tab.
router.use(requireAuth, requireAdmin);

router.get("/", list);

router.post(
  "/",
  [
    body("name").trim().isLength({ min: 2 }).withMessage("Name is required"),
    body("email").trim().isEmail().withMessage("A valid email is required"),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters long"),
    body("role").optional().isIn(["editor", "admin"]).withMessage("Role must be editor or admin"),
  ],
  validate,
  create
);

router.patch(
  "/:id",
  [
    body("name").optional().trim().isLength({ min: 2 }).withMessage("Name is too short"),
    body("role").optional().isIn(["editor", "admin"]).withMessage("Role must be editor or admin"),
    body("password")
      .optional()
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters long"),
  ],
  validate,
  update
);

router.delete("/:id", remove);

module.exports = router;
