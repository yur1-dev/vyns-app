// scripts/migrate-username-prefix.ts
// Run once: npx ts-node scripts/migrate-username-prefix.ts
// This normalizes all Username documents to store without @ prefix

import connectDB from "@/lib/db/mongodb";
import { Username } from "@/models";

async function migrate() {
  await connectDB();

  // Find all documents where username starts with @
  const withAt = (await Username.find({
    username: { $regex: /^@/ },
  }).lean()) as any[];

  console.log(`Found ${withAt.length} documents with @ prefix to migrate`);

  let fixed = 0;
  let skipped = 0;

  for (const doc of withAt) {
    const stripped = (doc.username as string).replace(/^@/, "");

    // Check if a clean version already exists (avoid duplicates)
    const alreadyExists = await Username.findOne({
      username: stripped,
      _id: { $ne: doc._id },
    });

    if (alreadyExists) {
      // Duplicate — remove the @ version since the clean one exists
      await Username.deleteOne({ _id: doc._id });
      console.log(`  Removed duplicate @${stripped} (clean version exists)`);
      skipped++;
      continue;
    }

    // Rename: remove the @ prefix
    await Username.updateOne(
      { _id: doc._id },
      { $set: { username: stripped } },
    );
    console.log(`  Migrated @${stripped} → ${stripped}`);
    fixed++;
  }

  console.log(`\nDone. Fixed: ${fixed}, Removed duplicates: ${skipped}`);
  process.exit(0);
}

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});
