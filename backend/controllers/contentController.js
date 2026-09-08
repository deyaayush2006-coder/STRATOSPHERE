const Content = require("../models/Content");
const { SECTION_KEYS, SECTIONS, isValidKey, shapeOf } = require("../config/sections");

/* Payload ceiling per section. Content is text and image *references*, never
   image bytes, so anything past this is a mistake or an attack. */
const MAX_SECTION_BYTES = 512 * 1024;

// @route  GET /api/content
// @desc   Every stored section in one call, keyed by section name.
//         Sections never edited are simply absent — the site falls back to
//         its bundled defaults for those, so a fresh database still renders.
// @access Public
exports.getAll = async (_req, res, next) => {
  try {
    const docs = await Content.find({ key: { $in: SECTION_KEYS } }).lean();

    const content = {};
    let updatedAt = null;
    for (const doc of docs) {
      content[doc.key] = doc.value;
      if (!updatedAt || doc.updatedAt > updatedAt) updatedAt = doc.updatedAt;
    }

    /* no-cache means "revalidate", not "do not store". Express already puts an
       ETag on the body, so an unchanged site costs a 304 with no payload while
       an edit shows up on the very next page load.
       A max-age here instead would leave the admin reloading the site, seeing
       yesterday's copy, and concluding the save did not work. */
    res.set("Cache-Control", "no-cache");
    return res.status(200).json({ content, updatedAt });
  } catch (error) {
    return next(error);
  }
};

// @route  GET /api/content/:key
// @access Public
exports.getOne = async (req, res, next) => {
  try {
    const { key } = req.params;
    if (!isValidKey(key)) {
      return res.status(404).json({ message: `Unknown section "${key}"` });
    }

    const doc = await Content.findOne({ key }).populate("updatedBy", "name email").lean();
    if (!doc) {
      return res.status(404).json({ message: `Section "${key}" has not been saved yet` });
    }

    return res.status(200).json({
      key: doc.key,
      value: doc.value,
      updatedAt: doc.updatedAt,
      updatedBy: doc.updatedBy || null,
    });
  } catch (error) {
    return next(error);
  }
};

// @route  PUT /api/content/:key
// @desc   Replace a whole section. The dashboard always sends the complete
//         section, so a partial merge would leave deleted items behind.
// @access Private
exports.replace = async (req, res, next) => {
  try {
    const { key } = req.params;
    if (!isValidKey(key)) {
      return res.status(404).json({ message: `Unknown section "${key}"` });
    }

    const { value } = req.body;
    if (value === undefined) {
      return res.status(400).json({ message: "Request body needs a \"value\" field" });
    }

    const expected = SECTIONS[key];
    const actual = shapeOf(value);
    if (actual !== expected) {
      return res.status(400).json({
        message: `Section "${key}" must be ${expected === "array" ? "a list" : "an object"}, got ${actual}`,
      });
    }

    if (Buffer.byteLength(JSON.stringify(value), "utf8") > MAX_SECTION_BYTES) {
      return res.status(413).json({
        message: "That section is too large to save. Upload images to the media library instead of pasting them in.",
      });
    }

    const doc = await Content.findOneAndUpdate(
      { key },
      { key, value, updatedBy: req.userId },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({
      message: "Saved",
      key: doc.key,
      value: doc.value,
      updatedAt: doc.updatedAt,
    });
  } catch (error) {
    return next(error);
  }
};

// @route  DELETE /api/content/:key
// @desc   Drop the stored override so the section falls back to the
//         bundled defaults. The dashboard exposes this as "Reset section".
// @access Private
exports.reset = async (req, res, next) => {
  try {
    const { key } = req.params;
    if (!isValidKey(key)) {
      return res.status(404).json({ message: `Unknown section "${key}"` });
    }

    await Content.deleteOne({ key });
    return res.status(200).json({ message: `Section "${key}" reset to defaults` });
  } catch (error) {
    return next(error);
  }
};
