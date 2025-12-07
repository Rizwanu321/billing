const mongoose = require("mongoose");
const StockHistory = require("../server/models/StockHistory");
require("dotenv").config({ path: "./server/.env" });

const fixReturns = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to MongoDB");

        const result = await StockHistory.updateMany(
            { type: "return" },
            { $set: { type: "adjustment" } }
        );

        console.log(`Updated ${result.modifiedCount} records from 'return' to 'adjustment'.`);

        // Verify
        const remainingReturns = await StockHistory.countDocuments({ type: "return" });
        console.log(`Remaining 'return' records: ${remainingReturns}`);

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await mongoose.disconnect();
    }
};

fixReturns();
