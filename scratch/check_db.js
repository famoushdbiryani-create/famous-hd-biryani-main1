import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

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

async function check() {
    const liveSnapshot = await getDocs(collection(newDb, 'menu_items_live'));
    let found = false;
    liveSnapshot.forEach(doc => {
        const data = doc.data();
        if (data.name && data.name.includes('Aloo')) {
            console.log('LIVE:', data.name, data.category);
            found = true;
        }
    });

    const draftSnapshot = await getDocs(collection(newDb, 'menu_items'));
    draftSnapshot.forEach(doc => {
        const data = doc.data();
        if (data.name && data.name.includes('Aloo')) {
            console.log('DRAFT:', data.name, data.category);
        }
    });

    process.exit(0);
}
check();
