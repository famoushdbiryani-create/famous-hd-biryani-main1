const fs = require('fs');
const path = require('path');

try {
    const configPath = '/Users/prudhviraj/.config/configstore/firebase-tools.json';
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    console.log("Config keys:", Object.keys(config));
    if (config.tokens) {
        console.log("Tokens keys:", Object.keys(config.tokens));
    }
    if (config.user) {
        console.log("User email:", config.user.email);
    }
} catch (err) {
    console.error("Error reading config:", err);
}
