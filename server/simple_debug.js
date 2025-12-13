const fs = require('fs');
const path = require('path');
console.log('Running simple debug...');
try {
    fs.writeFileSync(path.join(__dirname, 'test_output.txt'), 'Hello World');
    console.log('File written successfully');
} catch (err) {
    console.error('Error writing file:', err);
}
