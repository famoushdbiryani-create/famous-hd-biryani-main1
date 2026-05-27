import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, where } from "firebase/firestore";

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
    const qs = await getDocs(query(collection(db, 'menu_items'), where('name', '==', 'Cut Mirchi')));
    console.log("Draft Cut Mirchi:", qs.docs.map(d => ({id: d.id, visible: d.data().visible})));
    
    const qs2 = await getDocs(query(collection(db, 'menu_items_live'), where('name', '==', 'Cut Mirchi')));
    console.log("Live Cut Mirchi:", qs2.docs.map(d => ({id: d.id, visible: d.data().visible})));

    const qs3 = await getDocs(query(collection(db, 'menu_items'), where('name', '==', 'Mirapakaya Bajji')));
    console.log("Draft Mirapakaya Bajji:", qs3.docs.map(d => ({id: d.id, visible: d.data().visible})));
}

check().then(() => process.exit(0));
