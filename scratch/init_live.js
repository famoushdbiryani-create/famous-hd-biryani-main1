import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, setDoc, doc } from "firebase/firestore";
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
        const items = [];
        snapshot.forEach(doc => items.push({ id: doc.id, ...doc.data() }));

        console.log(`Copying ${items.length} items to menu_items_live...`);
        for (const item of items) {
            const { id, ...data } = item;
            await setDoc(doc(newDb, 'menu_items_live', id), data);
        }
        
        console.log("Migration complete!");
        process.exit(0);
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
}

migrate();
