const fs = require('fs');
const https = require('https');
const querystring = require('querystring');

// Load configurations
const configPath = '/Users/prudhviraj/.config/configstore/firebase-tools.json';
if (!fs.existsSync(configPath)) {
    console.error(`Error: Configuration file not found at ${configPath}`);
    process.exit(1);
}

const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const refreshToken = config.tokens ? config.tokens.refresh_token : null;
let accessToken = config.tokens ? config.tokens.access_token : null;

if (!refreshToken && !accessToken) {
    console.error("Error: No authentication tokens found in config.");
    process.exit(1);
}

// Function to exchange refresh token for an access token
function refreshAccessToken(rToken) {
    return new Promise((resolve, reject) => {
        console.log("Refreshing Google OAuth2 Access Token...");
        const postData = querystring.stringify({
            client_id: '563577306548-58vac9th2bd9rtqbc1508269g3il7sfb.apps.googleusercontent.com',
            client_secret: 'f1i1z5fW5PnJEq6F4YxSks1y',
            refresh_token: rToken,
            grant_type: 'refresh_token'
        });

        const req = https.request({
            hostname: 'oauth2.googleapis.com',
            path: '/token',
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(postData)
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    const parsed = JSON.parse(data);
                    console.log("Access Token refreshed successfully!");
                    resolve(parsed.access_token);
                } else {
                    reject(new Error(`Token refresh failed with status ${res.statusCode}: ${data}`));
                }
            });
        });

        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

// Helper function to make JSON REST calls
function makeRequest(url, method, token, body = null) {
    return new Promise((resolve, reject) => {
        const parsedUrl = new URL(url);
        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        const options = {
            hostname: parsedUrl.hostname,
            path: parsedUrl.pathname + parsedUrl.search,
            method: method,
            headers: headers
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve(data ? JSON.parse(data) : {});
                } else {
                    reject(new Error(`HTTP Error: ${res.statusCode} on ${method} ${url}\nResponse: ${data}`));
                }
            });
        });

        req.on('error', reject);
        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
}

async function migrate() {
    try {
        console.log("Using access token from firebase-tools.json config directly...");
        if (!accessToken) {
            console.error("Error: Access token is missing in config.");
            return;
        }

        console.log("Fetching all menu items from Firestore...");
        const listUrl = "https://firestore.googleapis.com/v1/projects/famous-hd-biryani/databases/(default)/documents/menu_items?pageSize=300";
        let result;
        try {
            result = await makeRequest(listUrl, 'GET', accessToken);
        } catch (e) {
            console.error("Failed to query Firestore using current access token:", e.message);
            console.log("Attempting to get access token from gcloud or firebase login:list if possible...");
            throw e;
        }

        if (!result.documents || result.documents.length === 0) {
            console.log("No menu documents found in Firestore.");
            return;
        }

        console.log(`Retrieved ${result.documents.length} total documents. Identifying legacy documents...`);
        const legacyDocs = [];

        result.documents.forEach(doc => {
            if (!doc.fields || !doc.fields.category || !doc.fields.category.stringValue) return;
            const cat = doc.fields.category.stringValue;
            const name = doc.fields.name ? doc.fields.name.stringValue : "Unknown";
            const docPath = doc.name; // Full path like projects/famous-hd-biryani/databases/(default)/documents/menu_items/docId

            let newCat = null;
            if (cat === "Vegetarian Curries") {
                newCat = "Veg Curries";
            } else if (cat === "Breads / Naan / Roti") {
                newCat = "Breads";
            } else if (cat === "Regular Biryanis") {
                newCat = "Biryanis";
            }

            if (newCat) {
                legacyDocs.push({
                    path: docPath,
                    name: name,
                    oldCategory: cat,
                    newCategory: newCat
                });
            }
        });

        console.log(`Found ${legacyDocs.length} legacy documents that need category updates.`);

        if (legacyDocs.length === 0) {
            console.log("No legacy documents to migrate. Database is already clean!");
            return;
        }

        console.log("Starting batch updates...");
        let successCount = 0;

        for (const item of legacyDocs) {
            console.log(`Updating "${item.name}" [${item.oldCategory}] -> [${item.newCategory}]...`);
            const updateUrl = `https://firestore.googleapis.com/v1/${item.path}?updateMask.fieldPaths=category`;
            const updateBody = {
                fields: {
                    category: {
                        stringValue: item.newCategory
                    }
                }
            };

            try {
                await makeRequest(updateUrl, 'PATCH', accessToken, updateBody);
                console.log(`  Successfully updated: ${item.name}`);
                successCount++;
            } catch (err) {
                console.error(`  Failed to update: ${item.name}. Error:`, err.message);
            }
        }

        console.log(`\nMigration summary: Successfully updated ${successCount} out of ${legacyDocs.length} documents.`);
    } catch (err) {
        console.error("Migration error:", err);
    }
}

migrate();
