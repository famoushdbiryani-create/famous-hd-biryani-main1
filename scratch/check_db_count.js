import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";

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

async function check() {
    const qs = await getDocs(collection(db, 'menu_items'));
    console.log("Total menu_items:", qs.size);
    const qs2 = await getDocs(collection(db, 'menu_items_live'));
    console.log("Total menu_items_live:", qs2.size);
}

check().then(() => process.exit(0));
