import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, writeBatch } from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyBVVrUJgA7sZF_v4Qv5IdsuRD2XIplw6X8",
    authDomain: "famous-hd-biryani-new.firebaseapp.com",
    projectId: "famous-hd-biryani-new",
    storageBucket: "famous-hd-biryani-new.firebasestorage.app",
    messagingSenderId: "192509334649",
    appId: "1:192509334649:web:7d7e50ada7bdbb1a6430a8"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function cleanCollection(collectionName) {
    const qs = await getDocs(collection(db, collectionName));
    const itemsByName = {};
    
    qs.forEach(d => {
        const data = d.data();
        if (!itemsByName[data.name]) itemsByName[data.name] = [];
        
        let updateTime = 0;
        if (data.updatedAt) {
            updateTime = data.updatedAt.seconds || 0;
        } else if (data.createdAt) {
            updateTime = data.createdAt.seconds || 0;
        }
        
        itemsByName[data.name].push({
            id: d.id,
            visible: data.visible,
            updateTime: updateTime
        });
    });
    
    let deleteCount = 0;
    
    let batch = writeBatch(db);
    let opCount = 0;
    
    for (const name in itemsByName) {
        const list = itemsByName[name];
        if (list.length > 1) {
            // Sort descending by updateTime so the newest is first
            list.sort((a, b) => b.updateTime - a.updateTime);
            
            // Keep the first (newest), delete the rest
            const toKeep = list[0];
            for (let i = 1; i < list.length; i++) {
                batch.delete(doc(db, collectionName, list[i].id));
                deleteCount++;
                opCount++;
                
                if (opCount >= 450) {
                    await batch.commit();
                    batch = writeBatch(db);
                    opCount = 0;
                }
            }
        }
    }
    
    if (opCount > 0) {
        await batch.commit();
    }
    
    console.log(`Cleaned ${deleteCount} duplicates from ${collectionName}`);
}

async function run() {
    console.log("Signing in...");
    await signInWithEmailAndPassword(auth, "famoushdbiryanii@gmail.com", "FamousHDBiryaniAdmin2026!");
    console.log("Signed in. Cleaning databases...");
    await cleanCollection('menu_items');
    await cleanCollection('menu_items_live');
}

run().then(() => process.exit(0)).catch(console.error);
