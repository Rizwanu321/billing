// migrations/update-category-index.js
const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

async function migrateCategories() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    const db = mongoose.connection.db;
    const collection = db.collection("categories");

    // Drop the old unique index on name if it exists
    try {
      await collection.dropIndex("name_1");
      console.log("Dropped old unique index on name");
    } catch (error) {
      console.log("No existing unique index on name to drop");
    }

    // Create new compound index
    await collection.createIndex({ name: 1, createdBy: 1 }, { unique: true });
    console.log("Created new compound index");

    console.log("Migration completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("Migration error:", error);
    process.exit(1);
  }
}

migrateCategories();
