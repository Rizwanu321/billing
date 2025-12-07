const mongoose = require('mongoose');
const StockHistory = require('./models/StockHistory');
require('dotenv').config();

console.log('Starting script...');
console.log('URI:', process.env.MONGO_URI ? 'Defined' : 'Undefined');

(async () => {
    try {
        console.log('Connecting...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const history = await StockHistory.find({ type: 'return' })
            .sort({ timestamp: -1 })
            .limit(5)
            .lean();

        console.log('Found records:', history.length);
        const fs = require('fs');
        const path = require('path');
        const outputPath = path.join(__dirname, 'stock_output.txt');
        fs.writeFileSync(outputPath, JSON.stringify(history, null, 2));
        console.log('Output written successfully');

    } catch (err) {
        console.error('Error:', err);
    } finally {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
            console.log('Disconnected');
        }
    }
})();
