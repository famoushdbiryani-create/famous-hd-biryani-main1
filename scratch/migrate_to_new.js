import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, setDoc, doc } from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

// Old Firebase Config
const oldConfig = {
    apiKey: "AIzaSyD4hyezwxIoRaxoeJbR1CGXujFSFn9qaYM",
    authDomain: "famous-hd-biryani.firebaseapp.com",
    projectId: "famous-hd-biryani",
    storageBucket: "famous-hd-biryani.firebasestorage.app",
    messagingSenderId: "321047092003",
    appId: "1:321047092003:web:62653cf6823a615fe94a96"
};

// New Firebase Config
const newConfig = {
    apiKey: "AIzaSyBVVrUJgA7sZF_v4Qv5IdsuRD2XIplw6X8",
    authDomain: "famous-hd-biryani-new.firebaseapp.com",
    projectId: "famous-hd-biryani-new",
    storageBucket: "famous-hd-biryani-new.firebasestorage.app",
    messagingSenderId: "192509334649",
    appId: "1:192509334649:web:7d7e50ada7bdbb1a6430a8"
};

const oldApp = initializeApp(oldConfig, "old");
const oldDb = getFirestore(oldApp);

const newApp = initializeApp(newConfig, "new");
const newDb = getFirestore(newApp);
const newAuth = getAuth(newApp);

async function migrate() {
    try {
        console.log("Signing in to new database...");
        await signInWithEmailAndPassword(newAuth, "famoushdbiryanii@gmail.com", "FamousHDBiryaniAdmin2026!");
        console.log("Signed in successfully.");

        console.log("Fetching menu items from old database...");
        const snapshot = await getDocs(collection(oldDb, 'menu_items'));
        const items = [];
        snapshot.forEach(doc => {
            items.push({ id: doc.id, ...doc.data() });
        });
        console.log(`Found ${items.length} menu items.`);

        for (const item of items) {
            console.log(`Migrating: ${item.name}`);
            const { id, ...data } = item;
            await setDoc(doc(newDb, 'menu_items', id), data);
        }
        
        console.log("Migration complete!");
        process.exit(0);
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
}

migrate();
