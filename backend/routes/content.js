const express = require("express");
const { getAll, getOne, replace, reset } = require("../controllers/contentController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

/* Reads are public — this is what the club site itself fetches on load.
   Writes need an account. */
router.get("/", getAll);
router.get("/:key", getOne);

router.put("/:key", requireAuth, replace);
router.delete("/:key", requireAuth, reset);

module.exports = router;
