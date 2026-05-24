import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, writeBatch } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read .env file manually
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const config = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const value = parts.slice(1).join('=').trim().replace(/['"]/g, '');
    if (key.startsWith('VITE_FIREBASE_')) {
      const dbKey = key.replace('VITE_FIREBASE_', '').toLowerCase();
      // map to camelCase key
      let camelKey = dbKey;
      if (dbKey === 'api_key') camelKey = 'apiKey';
      else if (dbKey === 'auth_domain') camelKey = 'authDomain';
      else if (dbKey === 'project_id') camelKey = 'projectId';
      else if (dbKey === 'storage_bucket') camelKey = 'storageBucket';
      else if (dbKey === 'messaging_sender_id') camelKey = 'messagingSenderId';
      else if (dbKey === 'app_id') camelKey = 'appId';
      config[camelKey] = value;
    }
  }
});

console.log('Using Firebase project:', config.projectId);

const app = initializeApp(config);
const db = getFirestore(app);

const data = [
  {
    "name": "Mundakayam",
    "parishes": [
      { "name": "Koruthodu", "saint": "St. George" },
      { "name": "Madukka", "saint": "St.Mathew" },
      { "name": "Mangapetta", "saint": "St.Thomas" },
      { "name": "Mukkulam", "saint": "St.George Church" },
      { "name": "Mulamkunnu", "saint": "Infant Jesus" },
      { "name": "Mundakayam", "saint": "Our Lady Of Dolours" },
      { "name": "Nirmalagiri", "saint": "St.Antonys" },
      { "name": "Paloorkkavu", "saint": "St.George" },
      { "name": "Punchavayal", "saint": "St.Sebastian" },
      { "name": "Thekkemala", "saint": "St.Mary" },
      { "name": "Vadakkemala", "saint": "St.Sebastian" },
      { "name": "Vandanpathal", "saint": "St.Paul" },
      { "name": "Yendayar", "saint": "St.Jude" }
    ]
  },
  {
    "name": "Kumily",
    "parishes": [
      { "name": "Amaravathy", "saint": "St.Joseph" },
      { "name": "Anavilasam", "saint": "St.George" },
      { "name": "Keerikkara", "saint": "St Antony" },
      { "name": "Kumily", "saint": "St. Thomas" },
      { "name": "Mlamala", "saint": "Fathima Matha" },
      { "name": "Nasranipuram", "saint": "St.Mathew" },
      { "name": "Periyarvallakadavu", "saint": "St.Joseph Church" },
      { "name": "Santhigiri", "saint": "St.George" },
      { "name": "Vellaramkunnu", "saint": "St.Marys" },
      { "name": "Wallardy", "saint": "Holy Cross" }
    ]
  },
  {
    "name": "Kanjirappally",
    "parishes": [
      { "name": "Anakkallu", "saint": "St.Antony's" },
      { "name": "Anchilippa", "saint": "St.Pius X" },
      { "name": "Cheruvally", "saint": "St. Mary's Church" },
      { "name": "Kanjirappally", "saint": "St.Dominic's Cathedral" },
      { "name": "Kappadu", "saint": "Holy Cross" },
      { "name": "Karikkattoor", "saint": "St. Antonys" },
      { "name": "Koovapally", "saint": "St.JOSEPH" },
      { "name": "Korattyputhenpally", "saint": "" },
      { "name": "Kunnumbhagam", "saint": "St.JOSEPH" },
      { "name": "Pazhayidam", "saint": "St.MICHALES" },
      { "name": "Thamarakunnu", "saint": "St.EPHREM" },
      { "name": "Thampalackadu", "saint": "St. THOMAS" },
      { "name": "Tharakanattukunnu", "saint": "ST ANTONY" }
    ]
  },
  {
    "name": "Anakkara",
    "parishes": [
      { "name": "Anakkara", "saint": "ST.THOMAS CHURCH" },
      { "name": "Chakkupallam", "saint": "CARMAL MATHA" },
      { "name": "Chellarcovil", "saint": "MAR SLEEVA" },
      { "name": "Cumbummettu", "saint": "" },
      { "name": "Greenvalley", "saint": "" },
      { "name": "Karunapuram", "saint": "ST.MARYS" },
      { "name": "Kochara", "saint": "ST.JOSEPH" },
      { "name": "Kuzhitholu", "saint": "ST. SEBASTIAN" },
      { "name": "Nettithozhu", "saint": "ST.ISIDORE CHURCH" },
      { "name": "Puttady", "saint": "VELAMKANNI MATHA" },
      { "name": "Vandenmedu", "saint": "ST.ANTONY" }
    ]
  },
  {
    "name": "Erumely",
    "parishes": [
      { "name": "Angelvalley", "saint": "ST.MARY" },
      { "name": "Arayanjilimannu", "saint": "" },
      { "name": "Elivalikara", "saint": "ST ANTONY" },
      { "name": "Erumely", "saint": "ASSUMPTION" },
      { "name": "Eruthuapuzha", "saint": "INFANT JESUS" },
      { "name": "Kanamala", "saint": "ST.THOMAS" },
      { "name": "Kannimala", "saint": "ST JOSEPH" },
      { "name": "Kollamula", "saint": "ST. MARIAGORETTI" },
      { "name": "Korattyold", "saint": "ST.MARYS" },
      { "name": "Kurumpanmoozhy", "saint": "ST.THOMAS" },
      { "name": "Manipuzha", "saint": "CHRIST RAJ THE KING" },
      { "name": "Mukkoottuthara", "saint": "ST.THOMAS" },
      { "name": "Niravu", "saint": "" },
      { "name": "Panapilavu", "saint": "ST.JOSEPH" },
      { "name": "Thulappally", "saint": "" },
      { "name": "Umikkuppa", "saint": "OUR LADY OF LOURDES" },
      { "name": "Vechoochira", "saint": "ST.JOSEPH CHURCH" }
    ]
  },
  {
    "name": "Ponkunnam",
    "parishes": [
      { "name": "Anickad", "saint": "ST.MARY'S" },
      { "name": "Chamampathal", "saint": "FATHIMA MATHA" },
      { "name": "Chengalam", "saint": "ST.ANTONY'S CHURCH" },
      { "name": "Chenkal", "saint": "SACRED HEART" },
      { "name": "Chennakunnu", "saint": "ST.GEORGE CHURCH" },
      { "name": "Elamdulam", "saint": "ST.MARY" },
      { "name": "Elangoi", "saint": "HOLY CROSS CHURCH" },
      { "name": "Elikulam", "saint": "INFANT JESUS" },
      { "name": "Neyyattusery", "saint": "ST:GEORGE CHURCH" },
      { "name": "Padanilam", "saint": "" },
      { "name": "Ponkunnam", "saint": "HOLY FAMILY" },
      { "name": "Pullannithakidi", "saint": "ST. REETHAS CHURCH" },
      { "name": "Thachapuzha", "saint": "ST.MARY'S" },
      { "name": "Vanchimala", "saint": "ST.ANTONYS" }
    ]
  },
  {
    "name": "Kattappana",
    "parishes": [
      { "name": "Gracemount", "saint": "GRACEMATHA CHURCH" },
      { "name": "Kalthotty", "saint": "HOLYFAMILY" },
      { "name": "Kanchiyar", "saint": "ST.MARYS" },
      { "name": "Kattappana", "saint": "ST.GEORGE" },
      { "name": "Kizhakkemattukatta", "saint": "ST.THOMAS CHURCH" },
      { "name": "Kochuthovala", "saint": "ST. JOSEPH" },
      { "name": "Marykulam", "saint": "ST.GEORGE" },
      { "name": "Mepara", "saint": "" },
      { "name": "Mettukuzhy", "saint": "" },
      { "name": "Narianpara", "saint": "HOLYCROSS" },
      { "name": "Swaraj", "saint": "ST. PAUL" },
      { "name": "Valiathovala", "saint": "CHRIST RAJ" },
      { "name": "Vallakadavu", "saint": "" }
    ]
  },
  {
    "name": "Upputhara",
    "parishes": [
      { "name": "Alampally", "saint": "" },
      { "name": "Chemmannu", "saint": "ST. THOMAS CHURCH" },
      { "name": "Chinnar", "saint": "ST:GEORGE CHURCH" },
      { "name": "Mariagiri", "saint": "ST. SEBASTIAN" },
      { "name": "Pulinkatta", "saint": "ST:GEORGE CHURCH" },
      { "name": "Pullikkanam", "saint": "ST.THOMAS" },
      { "name": "Rajagiri", "saint": "" },
      { "name": "Uluppooni", "saint": "ST. ALPHONSA CHURCH" },
      { "name": "Upputhara", "saint": "ST. MARY'S" }
    ]
  },
  {
    "name": "Ranny",
    "parishes": [
      { "name": "Bathanimala", "saint": "ST.MARYS" },
      { "name": "Chempanoly", "saint": "ST.SEBASTIAN" },
      { "name": "Edamon", "saint": "ST.MARY" },
      { "name": "Kannampally", "saint": "ST. MARY" },
      { "name": "Perunadu", "saint": "HOLY FAMILY CHURCH" },
      { "name": "Perunthenaruvi", "saint": "ST.JOSEPH" },
      { "name": "Placherry", "saint": "" },
      { "name": "Ranny", "saint": "INFANT JESUS" }
    ]
  },
  {
    "name": "Pathanamthitta",
    "parishes": [
      { "name": "Cheenkalthadam", "saint": "ST:JOSEPH CHURCH" },
      { "name": "Konni", "saint": "" },
      { "name": "Koothattukulam", "saint": "ASSUMPTION" },
      { "name": "Kozhancherry", "saint": "" },
      { "name": "Meenkuzhy", "saint": "LITTLE FLOWER" },
      { "name": "Pathanamthitta", "saint": "MARY MATHA" },
      { "name": "Pezhumpara", "saint": "SACRED HEART CHURCH" },
      { "name": "Seethathodu", "saint": "ST. GEORGE" },
      { "name": "Vakayar", "saint": "" }
    ]
  },
  {
    "name": "Velichiyani",
    "parishes": [
      { "name": "Edakkunnam", "saint": "MARY MATHA" },
      { "name": "Inchiyani", "saint": "HOLY FAMILY" },
      { "name": "Johnpaulnagar", "saint": "ST.JOHN PAUL II" },
      { "name": "Karikulam", "saint": "FATHIMA MATHA" },
      { "name": "Mangappara", "saint": "NITHYA SAHAYA MATHA CHURCH" },
      { "name": "Palampra", "saint": "GETHSAMANE" },
      { "name": "Palapra", "saint": "VIMALA MATHA CHURCH" },
      { "name": "Podimattam", "saint": "ST. MARYS" },
      { "name": "Poomattam", "saint": "" },
      { "name": "Velichiyani", "saint": "ST:THOMAS CHURCH" }
    ]
  },
  {
    "name": "Mundiyeruma",
    "parishes": [
      { "name": "Anyartholu", "saint": "ST.THOMAS" },
      { "name": "Chembalam", "saint": "ST.MARY" },
      { "name": "Chottupara", "saint": "" },
      { "name": "Mundiyeruma", "saint": "ASSUMPTION" },
      { "name": "Nirmalapuram", "saint": "HOLY FAMILY CHURCH" },
      { "name": "Pampadumpara", "saint": "" },
      { "name": "Puliyanmala", "saint": "ST. ANTONY" },
      { "name": "Ramakalmedu", "saint": "" },
      { "name": "Sanyasiyoda", "saint": "" },
      { "name": "Thirdcamp", "saint": "" }
    ]
  },
  {
    "name": "Peruvanthanam",
    "parishes": [
      { "name": "Amalagiri", "saint": "ST.THOMAS" },
      { "name": "Azhangad", "saint": "ST.ANTONY" },
      { "name": "Cheruvallikulam", "saint": "ST. GEORGE" },
      { "name": "Elappara", "saint": "ST.ALPHONSA" },
      { "name": "Kanayankavayal", "saint": "ST.MARY" },
      { "name": "Kuttikkanam", "saint": "ST.MATHEWS CHURCH" },
      { "name": "Meloram", "saint": "ST.SEBASTIANS CHURCH" },
      { "name": "Murinjapuzha", "saint": "ST:GEORGE CHURCH" },
      { "name": "Nallathanny", "saint": "HOLY FAMILY CHURCH" },
      { "name": "Peermade", "saint": "ST.MARYS" },
      { "name": "Peruvanthanam", "saint": "ST.JOSEPH" },
      { "name": "Purakkayam", "saint": "ST.JOSEPH CHURCH" }
    ]
  }
];

async function run() {
  const batch = writeBatch(db);
  for (const forane of data) {
    const foraneId = forane.name.toLowerCase();
    const foraneRef = doc(db, 'foranes', foraneId);
    batch.set(foraneRef, {
      name: forane.name,
      createdAt: new Date(),
    });

    for (const parish of forane.parishes) {
      const parishId = parish.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const parishRef = doc(collection(foraneRef, 'parishes'), parishId);
      batch.set(parishRef, {
        name: parish.name,
        saint: parish.saint || null,
        createdAt: new Date(),
      });
    }
  }

  console.log('Committing batch write...');
  await batch.commit();
  console.log('Import successful!');
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
