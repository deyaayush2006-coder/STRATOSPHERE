import mongoose from "mongoose";

/* Length caps are repeated from the route on purpose: the route gives a
   readable error, this is the backstop against a crafted request.
   `email` is optional — anyone who wants a reply will leave one. */
const feedbackSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      maxlength: 120,
      default: "",
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 254, // RFC 5321 maximum
      default: "",
    },
    subject: {
      type: String,
      trim: true,
      maxlength: 200,
      default: "",
    },
    phone: {
      type: String,
      trim: true,
      maxlength: 40,
      default: "",
    },
    message: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 4000,
    },
    /* where it came from, for triage */
    page: { type: String, trim: true, maxlength: 200, default: "" },

    status: {
      type: String,
      enum: ["new", "read", "actioned", "spam"],
      default: "new",
      index: true,
    },
  },
  { timestamps: true }
);

/* The inbox view: newest first. */
feedbackSchema.index({ createdAt: -1 });

export default mongoose.model("Feedback", feedbackSchema);
