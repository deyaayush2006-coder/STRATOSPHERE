const mongoose = require("mongoose");

/* Images live in Mongo as bytes rather than on disk: the API is meant for
   hosts with an ephemeral filesystem (Render, Railway), where anything
   written to disk disappears on the next deploy.
   The browser downscales before upload, so a stored image is tens of KB,
   well under the 16MB document ceiling. */
const mediaSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true, trim: true, maxlength: 200 },
    contentType: { type: String, required: true },
    size: { type: Number, required: true },
    width: Number,
    height: Number,
    /* select:false so listing the library does not drag every image
       through memory — only GET /api/media/:id asks for the bytes. */
    data: { type: Buffer, required: true, select: false },
    alt: { type: String, trim: true, maxlength: 300, default: "" },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

mediaSchema.methods.toPublic = function toPublic() {
  return {
    id: this._id,
    url: `/api/media/${this._id}`,
    filename: this.filename,
    contentType: this.contentType,
    size: this.size,
    width: this.width,
    height: this.height,
    alt: this.alt,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model("Media", mediaSchema);
