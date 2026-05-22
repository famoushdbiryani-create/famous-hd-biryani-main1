const fs = require('fs');
const data = JSON.parse(fs.readFileSync('/Users/prudhviraj/.gemini/antigravity/brain/dc992598-9e9e-4d60-9173-026f0feedd1b/.system_generated/steps/1355/output.txt', 'utf8'));

const legacyDocs = [];
data.documents.forEach(doc => {
    if (!doc.fields || !doc.fields.category || !doc.fields.category.stringValue) return;
    const cat = doc.fields.category.stringValue;
    const name = doc.fields.name ? doc.fields.name.stringValue : "Unknown";
    const docId = doc.name.split('/').pop();
    
    if (cat === "Vegetarian Curries" || cat === "Breads / Naan / Roti" || cat === "Regular Biryanis") {
        legacyDocs.push({
            id: docId,
            name: name,
            category: cat
        });
    }
});

console.log(JSON.stringify(legacyDocs, null, 2));
console.log(`Total legacy documents found: ${legacyDocs.length}`);

