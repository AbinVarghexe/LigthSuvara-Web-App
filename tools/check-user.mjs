import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

const app = initializeApp(config);
const db = getFirestore(app);

async function run() {
  const snapshot = await getDocs(collection(db, 'marks'));
  console.log(`Total marks documents found: ${snapshot.docs.length}`);
  snapshot.docs.forEach(doc => {
    const data = doc.data();
    console.log(`Doc ID: ${doc.id} | Year Field: ${data.year} | Sunday School: ${data.sundaySchool} | Parish: ${data.parish} | Animator: ${data.animatorName}`);
  });
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
