import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, where } from "firebase/firestore";
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

async function run() {
    await signInWithEmailAndPassword(auth, "famoushdbiryanii@gmail.com", "FamousHDBiryaniAdmin2026!");
    
    // Check how many hidden items are in draft vs live
    const draftHidden = await getDocs(query(collection(db, 'menu_items'), where('visible', '==', false)));
    const liveHidden = await getDocs(query(collection(db, 'menu_items_live'), where('visible', '==', false)));
    const liveVisible = await getDocs(query(collection(db, 'menu_items_live'), where('visible', '==', true)));

    console.log("=== DRAFT (menu_items) ===");
    console.log("Hidden items:", draftHidden.size);
    draftHidden.forEach(d => console.log(" - HIDDEN:", d.data().name));

    console.log("\n=== LIVE (menu_items_live) ===");
    console.log("Hidden items:", liveHidden.size);
    liveHidden.forEach(d => console.log(" - HIDDEN:", d.data().name));
    console.log("Visible items:", liveVisible.size);
}

run().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
