const Media = require("../models/Media");

// @route  POST /api/media
// @desc   Store one uploaded image. multer holds it in memory; nothing
//         touches disk, which the deploy targets wipe on every restart.
// @access Private
exports.upload = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file was received" });
    }

    const { width, height, alt } = req.body;

    const doc = await Media.create({
      filename: req.file.originalname || "upload",
      contentType: req.file.mimetype,
      size: req.file.size,
      // sent by the browser after it downscales the image
      width: Number(width) || undefined,
      height: Number(height) || undefined,
      alt: (alt || "").slice(0, 300),
      data: req.file.buffer,
      uploadedBy: req.userId,
    });

    return res.status(201).json({ message: "Uploaded", media: doc.toPublic() });
  } catch (error) {
    return next(error);
  }
};

// @route  GET /api/media
// @desc   The media library listing. Bytes are excluded by the schema.
// @access Private
exports.list = async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 60, 200);
    const skip = Math.max(Number(req.query.skip) || 0, 0);

    const [items, total] = await Promise.all([
      Media.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
      Media.countDocuments(),
    ]);

    return res.status(200).json({
      items: items.map((m) => m.toPublic()),
      total,
      skip,
      limit,
    });
  } catch (error) {
    return next(error);
  }
};

// @route  GET /api/media/:id
// @desc   Serve the bytes. Public: these are the images on the public site.
// @access Public
exports.serve = async (req, res, next) => {
  try {
    const doc = await Media.findById(req.params.id).select("+data");
    if (!doc) {
      return res.status(404).json({ message: "Image not found" });
    }

    /* The id is content-addressed in practice — a re-upload gets a new id —
       so the bytes at a given URL never change and can cache forever. */
    res.set("Content-Type", doc.contentType);
    res.set("Content-Length", String(doc.data.length));
    res.set("Cache-Control", "public, max-age=31536000, immutable");
    res.set("Cross-Origin-Resource-Policy", "cross-origin");
    return res.send(doc.data);
  } catch (error) {
    /* A malformed ObjectId throws in findById; that is a 404, not a 500. */
    if (error.name === "CastError") {
      return res.status(404).json({ message: "Image not found" });
    }
    return next(error);
  }
};

// @route  DELETE /api/media/:id
// @access Private
exports.remove = async (req, res, next) => {
  try {
    const doc = await Media.findByIdAndDelete(req.params.id);
    if (!doc) {
      return res.status(404).json({ message: "Image not found" });
    }
    return res.status(200).json({ message: "Deleted" });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(404).json({ message: "Image not found" });
    }
    return next(error);
  }
};
