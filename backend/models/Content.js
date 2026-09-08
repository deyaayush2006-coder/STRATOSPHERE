const mongoose = require("mongoose");
const { SECTION_KEYS } = require("../config/sections");

/* One document per site section, with the payload kept as Mixed.
   Deliberate: the shapes here are page content, not domain records, and a
   strict schema would mean a migration every time a card grows a field.
   Validation lives at the route instead. */
const contentSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      enum: SECTION_KEYS,
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true, minimize: false }
);

module.exports = mongoose.model("Content", contentSchema);
