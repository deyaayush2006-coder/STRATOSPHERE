/* First-run setup.
 *
 *   npm run seed             create the admin, fill empty content sections
 *   npm run seed -- --force  also overwrite content sections that already exist
 *
 * Content is read straight from the frontend's bundled defaults, so the
 * database starts out matching the site exactly and the dashboard opens on
 * real content instead of a set of empty forms.
 *
 * Safe to run more than once: an existing admin is left alone (its password is
 * never reset from here), and sections that have been edited are skipped
 * unless --force is passed.
 */
import "dotenv/config";
import mongoose from "mongoose";

import connectDB from "../config/db.js";
import User from "../models/User.js";
import Content from "../models/Content.js";
import { SECTION_KEYS } from "../config/sections.js";
import { DEFAULT_CONTENT } from "../../aerospaceOP/src/content/defaults.js";

const force = process.argv.includes("--force");

const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME } = process.env;

async function seedAdmin() {
  const admins = await User.countDocuments({ role: "admin" });

  if (admins > 0) {
    console.log(`• admin account: ${admins} already exist, leaving them alone`);
    return null;
  }

  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error(
      "\n! No admin account exists and ADMIN_EMAIL / ADMIN_PASSWORD are not set.\n" +
        "  Add them to backend/.env and run this again — without an admin, nobody can sign in.\n"
    );
    return null;
  }

  if (ADMIN_PASSWORD.length < 8) {
    console.error("! ADMIN_PASSWORD must be at least 8 characters long.");
    return null;
  }

  const user = await User.create({
    name: ADMIN_NAME || "Club Admin",
    email: ADMIN_EMAIL.toLowerCase().trim(),
    password: ADMIN_PASSWORD, // hashed by the model's pre-save hook
    role: "admin",
  });

  console.log(`• admin account created: ${user.email}`);
  console.log("  Change this password from the dashboard once you are in, and clear");
  console.log("  ADMIN_PASSWORD out of .env afterwards.");
  return user;
}

async function seedContent(userId) {
  const existing = new Set((await Content.find({}, "key").lean()).map((doc) => doc.key));

  let written = 0;
  let skipped = 0;

  for (const key of SECTION_KEYS) {
    if (!(key in DEFAULT_CONTENT)) {
      console.warn(`! section "${key}" has no default in the frontend — skipping`);
      continue;
    }

    if (existing.has(key) && !force) {
      skipped += 1;
      continue;
    }

    await Content.findOneAndUpdate(
      { key },
      { key, value: DEFAULT_CONTENT[key], updatedBy: userId ?? undefined },
      { upsert: true, setDefaultsOnInsert: true }
    );
    written += 1;
  }

  console.log(`• content: ${written} sections written, ${skipped} left as they are`);
  if (skipped > 0 && !force) {
    console.log("  (pass --force to overwrite edited sections with the bundled defaults)");
  }
}

async function main() {
  await connectDB();

  const admin = await seedAdmin();

  /* An existing admin is the usual case on a re-run; attribute the content to
     whoever is there so the dashboard can show a name against it. */
  const attributeTo = admin ?? (await User.findOne({ role: "admin" }).lean());

  await seedContent(attributeTo?._id);

  await mongoose.disconnect();
  console.log("\nDone.");
}

main().catch(async (error) => {
  console.error("\nSeed failed:", error.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
