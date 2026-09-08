const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

/* Two levels, and the gap between them is deliberate:
   - editor  — can change site content and upload media
   - admin   — the above, plus adding/removing other accounts
   There is no public sign-up route. Accounts exist only because an admin
   created one, so an unknown visitor can never end up with either role. */
const ROLES = ["editor", "admin"];

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: 2,
      maxlength: 60,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 8,
      select: false, // never return password by default on queries
    },
    role: {
      type: String,
      enum: ROLES,
      default: "editor",
    },
    /* Suspend a handed-over account instead of deleting it, so the
       "updatedBy" trail on old content still resolves to a name. */
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLoginAt: Date,
  },
  { timestamps: true }
);

// Hash the password before saving, only if it was modified
userSchema.pre("save", async function hashPassword(next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to compare a plaintext password against the stored hash
userSchema.methods.comparePassword = function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toPublic = function toPublic() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    isActive: this.isActive,
    lastLoginAt: this.lastLoginAt,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model("User", userSchema);
module.exports.ROLES = ROLES;
