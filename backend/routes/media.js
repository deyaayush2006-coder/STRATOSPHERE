const express = require("express");
const multer = require("multer");
const { upload, list, serve, remove } = require("../controllers/mediaController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];

/* Memory storage, not disk: the bytes go straight into Mongo. The 4MB cap is
   a backstop — the dashboard downscales to roughly 1600px before uploading,
   which puts a normal photo well under 400KB. */
const uploader = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * 1024 * 1024, files: 1 },
  fileFilter(_req, file, cb) {
    if (!ALLOWED_TYPES.includes(file.mimetype)) {
      return cb(new Error(`Unsupported image type: ${file.mimetype}`));
    }
    return cb(null, true);
  },
});

// Public: these URLs are the <img src> on the live site.
router.get("/:id", serve);

router.get("/", requireAuth, list);
router.post("/", requireAuth, uploader.single("file"), upload);
router.delete("/:id", requireAuth, remove);

module.exports = router;
