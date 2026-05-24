import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, writeBatch, doc } from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

const newConfig = {
    apiKey: "AIzaSyBVVrUJgA7sZF_v4Qv5IdsuRD2XIplw6X8",
    authDomain: "famous-hd-biryani-new.firebaseapp.com",
    projectId: "famous-hd-biryani-new",
    storageBucket: "famous-hd-biryani-new.firebasestorage.app",
    messagingSenderId: "192509334649",
    appId: "1:192509334649:web:7d7e50ada7bdbb1a6430a8"
};

const newApp = initializeApp(newConfig, "new");
const newDb = getFirestore(newApp);
const newAuth = getAuth(newApp);

async function migrate() {
    try {
        console.log("Signing in...");
        await signInWithEmailAndPassword(newAuth, "famoushdbiryanii@gmail.com", "FamousHDBiryaniAdmin2026!");

        console.log("Fetching menu items...");
        const snapshot = await getDocs(collection(newDb, 'menu_items'));
        const batch = writeBatch(newDb);
        
        let count = 0;
        snapshot.forEach(docSnap => {
            batch.set(doc(newDb, 'menu_items_live', docSnap.id), docSnap.data());
            count++;
        });

        console.log(`Copying ${count} items via Batch...`);
        await batch.commit();
        
        console.log("Migration complete!");
        process.exit(0);
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
}

migrate();
