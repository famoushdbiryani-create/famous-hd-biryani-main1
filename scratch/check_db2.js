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
    const d1 = await getDoc(doc(db, 'menu_items', 'adSgLUEgS6RcPcytwQla'));
    console.log("Doc 1:", d1.data());
    
    const d2 = await getDoc(doc(db, 'menu_items', 'p02Zkk8tMDAifWJDXjBu'));
    console.log("Doc 2:", d2.data());
}

check().then(() => process.exit(0));
