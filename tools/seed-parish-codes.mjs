import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, writeBatch } from 'firebase/firestore';
import XLSX from 'xlsx';
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

const rawForaneToDbId = {
  'anakkara': 'anakkara',
  'erumely': 'erumely',
  'kanjirapally': 'kanjirappally',
  'kattapana': 'kattappana',
  'kattappana': 'kattappana',
  'kumily': 'kumily',
  'mundakkayam': 'mundakayam',
  'mundakayam': 'mundakayam',
  'mundiyeruma': 'mundiyeruma',
  'pathanamthitta': 'pathanamthitta',
  'peruvamthanam': 'peruvanthanam',
  'peruvanthanam': 'peruvanthanam',
  'ponkunnam': 'ponkunnam',
  'ranni': 'ranny',
  'ranny': 'ranny',
  'upputhara': 'upputhara',
  'velichiyani': 'velichiyani'
};

function normalizeParishName(name) {
  if (!name) return '';
  return name.toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .replace(/pp/g, 'p')
    .replace(/tt/g, 't')
    .replace(/th/g, 't')
    .replace(/nn/g, 'n')
    .replace(/mm/g, 'm')
    .replace(/ll/g, 'l')
    .replace(/y$/g, 'i')
    .replace(/u$/g, '')
    .replace(/o$/g, 'a')
    .replace(/om$/g, 'am')
    .replace(/c/g, 'k')
    .trim();
}

// Manual overrides for parish name matching (excelName -> dbId)
const manualParishMatches = {
  // Anakkara
  'chellarkovil': 'chellarcovil',
  'kochera': 'kochera',
  'vadanmedu': 'vandenmedu',
  
  // Erumely
  'elivalikkara': 'elivalikara',
  'eruthuvapuzha': 'eruthuapuzha',
  'kurumpanmuzhy': 'kurumpanmoozhy',
  'ummikuppa': 'umikkuppa',
  'pazhayakoratty': 'korattyold',
  
  // Kanjirappally
  'anakallu': 'anakkallu',
  'karikattoor': 'karikkattoor',
  'thampalakadu': 'thampalackadu',
  'puthenkoratty': 'korattyputhenpally',
  
  // Kattappana
  'kizhakkemattukatta (grace valley)': 'kizhakkemattukatta',
  'nariampara': 'narianpara',
  'valiyathovala': 'valiathovala',
  
  // Kumily
  'attappallam': 'kumily',
  'keerikara': 'keerikkara',
  'nazranipuram': 'nasranipuram',
  'vallakkadavu': 'periyarvallakadavu',
  'wallardie': 'wallardy',
  
  // Mundakkayam
  'mulankunnu': 'mulamkunnu',
  'mundakkayam': 'mundakayam',
  'paloorkavu': 'paloorkkavu',
  'vadanpathal': 'vandanpathal',
  
  // Mundiyeruma
  'aniyartholu': 'anyartholu',
  'chempalam': 'chembalam',
  'ramakkalmedu': 'ramakalmedu',
  'sanyasiyod': 'sanyasiyoda',
  
  // Pathanamthitta
  'koothatttukulam': 'koothattukulam',
  'cheekalthadam': 'cheenkalthadam',
  
  // Peruvanthanam
  'kuttikanam': 'kuttikkanam',
  'peruvamthanam': 'peruvanthanam',
  
  // Ponkunnam
  'elamgulam': 'elamdulam',
  'elikkualam': 'elikulam',
  'neyattushery': 'neyyattusery',
  
  // Ranni
  'peruthenaruvi': 'perunthenaruvi',
  'plachery': 'placherry',
  'bethani hills': 'bathanimala',
  
  // Velichiyani
  '31st  mile': 'johnpaulnagar'
};

async function run() {
  const excelPath = path.join(__dirname, '..', 'Public', 'Eparchy of Kanjirappally.xlsx');
  const workbook = XLSX.readFile(excelPath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

  // 1. Parse Foranes from Excel
  const excelForanes = [];
  let rowIndex = 0;
  for (; rowIndex < rows.length; rowIndex++) {
    const row = rows[rowIndex];
    const slNo = row['__EMPTY'];
    const name = row['forane List'] ? row['forane List'].trim() : '';
    const code = row['Code start'];

    if (typeof slNo === 'string' && (slNo.toLowerCase().includes('forane') || slNo.toLowerCase().includes('sl no') || slNo.toLowerCase().includes('parish') || slNo === '')) {
      break;
    }
    if (name && code !== undefined && code !== '') {
      excelForanes.push({ name, code: String(code).trim(), parishes: [] });
    }
  }

  // 2. Parse Parishes from Excel
  let currentForane = null;
  for (; rowIndex < rows.length; rowIndex++) {
    const row = rows[rowIndex];
    const slNo = row['__EMPTY'] ? String(row['__EMPTY']).trim() : '';
    const churchName = row['forane List'] ? String(row['forane List']).trim() : '';
    const parishName = row['Code start'] ? String(row['Code start']).trim() : '';
    const parishCode = row['__EMPTY_2'] ? String(row['__EMPTY_2']).trim() : '';

    if (!slNo && !churchName && !parishName && !parishCode) continue;

    if (slNo && !churchName && !parishName && !parishCode) {
      let cleanHeader = slNo.replace(/forane/gi, '').trim().toLowerCase();
      currentForane = excelForanes.find(f => f.name.toLowerCase().trim() === cleanHeader || rawForaneToDbId[cleanHeader] === rawForaneToDbId[f.name.toLowerCase().trim()]);
      continue;
    }

    if (slNo.toLowerCase() === 'sl no') continue;

    if (parishName && currentForane) {
      currentForane.parishes.push({
        name: parishName,
        saint: churchName,
        code: parishCode
      });
    }
  }

  // 3. Write Batch updates
  const batch = writeBatch(db);
  let operationsCount = 0;

  for (const ef of excelForanes) {
    const dbForaneId = rawForaneToDbId[ef.name.toLowerCase().trim()];
    if (!dbForaneId) {
      console.log(`WARNING: Forane "${ef.name}" not found in DB mapping!`);
      continue;
    }

    // Update Forane
    const foraneRef = doc(db, 'foranes', dbForaneId);
    batch.set(foraneRef, {
      code: ef.code
    }, { merge: true });
    operationsCount++;
    console.log(`Batch: Set forane "${dbForaneId}" code to "${ef.code}"`);

    // Fetch existing parishes in Firestore to match
    const dbParishesSnap = await getDocs(collection(db, 'foranes', dbForaneId, 'parishes'));
    const dbParishes = dbParishesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    for (const ep of ef.parishes) {
      let dbMatch = dbParishes.find(dp => {
        const idMatch = dp.id === ep.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
        const normMatch = normalizeParishName(dp.name) === normalizeParishName(ep.name);
        const manualMatch = manualParishMatches[ep.name.toLowerCase()] === dp.id;
        return idMatch || normMatch || manualMatch;
      });

      let parishRef;
      if (dbMatch) {
        // Update existing parish
        parishRef = doc(db, 'foranes', dbForaneId, 'parishes', dbMatch.id);
        batch.set(parishRef, {
          code: ep.code,
          saint: ep.saint || dbMatch.saint || null
        }, { merge: true });
        console.log(`  - Match Update: foranes/${dbForaneId}/parishes/${dbMatch.id} code="${ep.code}" saint="${ep.saint}"`);
      } else {
        // Create new parish
        const newParishId = ep.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
        parishRef = doc(db, 'foranes', dbForaneId, 'parishes', newParishId);
        batch.set(parishRef, {
          name: ep.name,
          saint: ep.saint || null,
          code: ep.code,
          createdAt: new Date()
        });
        console.log(`  - CREATE New: foranes/${dbForaneId}/parishes/${newParishId} name="${ep.name}" code="${ep.code}" saint="${ep.saint}"`);
      }
      operationsCount++;
    }
  }

  console.log(`Total operations in batch: ${operationsCount}`);
  console.log('Committing batch write...');
  await batch.commit();
  console.log('Successfully updated Firestore with codes and missing parishes!');
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
