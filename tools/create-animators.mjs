import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read .env file
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
const apiKey = config.apiKey;

const animators = [
  { sl: 1, name: "Thomaskutty Dominic", houseName: "Poothakkuzhi", phone: "9495445330", email: "thomaskuttyp@suvara.com", password: "peter@suvara" },
  { sl: 2, name: "Shaji Jacob", houseName: "Edathil", phone: "8606505457", email: "shajie@suvara.com", password: "paul@suvara" },
  { sl: 3, name: "Bino P. Jose", houseName: "Perunthottam", phone: "9495445328", email: "binop@suvara.com", password: "johnbaptist@suvara" },
  { sl: 4, name: "Monson", houseName: "Vettikkatt", phone: "9745779275", email: "monsonv@suvara.com", password: "mary@suvara" },
  { sl: 5, name: "Jomon", houseName: "Chavarrappuzha", phone: "9288409276", email: "jomonc@suvara.com", password: "joseph@suvara" },
  { sl: 6, name: "Shijo", houseName: "Thoniyankal", phone: "9496158497", email: "shijot@suvara.com", password: "michael@suvara" },
  { sl: 7, name: "Jose", houseName: "Vadakkel", phone: "9447980850", email: "josev@suvara.com", password: "andrew@suvara" },
  { sl: 8, name: "Johnson", houseName: "Panachikkal", phone: "9446159505", email: "johnsonp@suvara.com", password: "james@suvara" },
  { sl: 9, name: "Mathews", houseName: "Madukkakkuzhi", phone: "9446714317", email: "mathewsm@suvara.com", password: "philip@suvara" },
  { sl: 10, name: "Sunil Jacob", houseName: "Vadakkenath", phone: "7560808622", email: "sunilv@suvara.com", password: "thomas@suvara" },
  { sl: 11, name: "Saju Joseph", houseName: "Kochuveettil", phone: "9495848213", email: "sajuk@suvara.com", password: "matthew@suvara" },
  { sl: 12, name: "Benny", houseName: "Kochukarimbanal", phone: "9447314572", email: "bennykochukarimbanal@suvara.com", password: "mark@suvara" },
  { sl: 13, name: "Sr. Theres Jose", houseName: "FCC", phone: "8281697631", email: "theresj@suvara.com", password: "luke@suvara" },
  { sl: 14, name: "Sr. Josny", houseName: "CMC", phone: "8548065110", email: "josnycmc@suvara.com", password: "jude@suvara" },
  { sl: 15, name: "Sr. Elsy Tom", houseName: "SH", phone: "9446393713", email: "elsyt@suvara.com", password: "stephen@suvara" },
  { sl: 16, name: "Sr. Tess Maria", houseName: "SABS", phone: "9495564917", email: "tessm@suvara.com", password: "george@suvara" },
  { sl: 17, name: "Sebastian", houseName: "Thannikkal", phone: "9446204698", email: "sebastiant@suvara.com", password: "sebastian@suvara" },
  { sl: 18, name: "Jomon", houseName: "Kallarackal", phone: "9447379420", email: "jomonk@suvara.com", password: "christopher@suvara" },
  { sl: 19, name: "Sr. Lincy", houseName: "FCC", phone: "7560867219", email: "lincyfcc@suvara.com", password: "nicholas@suvara" },
  { sl: 20, name: "Sr. Merin", houseName: "Thakidipurathu SABS", phone: "9497782959", email: "merint@suvara.com", password: "lucy@suvara" },
  { sl: 21, name: "George", houseName: "Thayyil", phone: "9447420929", email: "georget@suvara.com", password: "patrick@suvara" },
  { sl: 22, name: "Bineesh", houseName: "Kalappurackal", phone: "7025821225", email: "bineeshk@suvara.com", password: "augustine@suvara" },
  { sl: 23, name: "Sr. Rita Maria", houseName: "FCC", phone: "8281976270", email: "ritam@suvara.com", password: "jerome@suvara" },
  { sl: 24, name: "Sr. Treesa", houseName: "SH", phone: "8281976270", email: "treesash@suvara.com", password: "rita@suvara" },
  { sl: 25, name: "Jojo", houseName: "Kulangara", phone: "9447661749", email: "jojok@suvara.com", password: "david@suvara" },
  { sl: 26, name: "Benny", houseName: "Kaippananickal", phone: "9447135594", email: "bennykaippananickal@suvara.com", password: "benedict@suvara" },
  { sl: 27, name: "Thomas", houseName: "Neeranakkunnel", phone: "9447126983", email: "thomasn@suvara.com", password: "simon@suvara" },
  { sl: 28, name: "Abin", houseName: "Valiyakkulathil", phone: "9947591771", email: "abinv@suvara.com", password: "francis@suvara" },
  { sl: 29, name: "Shiny", houseName: "Chennatt", phone: "9446757430", email: "shinyc@suvara.com", password: "clare@suvara" },
  { sl: 30, name: "Sini", houseName: "Thannikkathottiyil", phone: "8075074218", email: "sinit@suvara.com", password: "dominic@suvara" },
  { sl: 31, name: "Bincy Antony", houseName: "Kattipparayil", phone: "8075825969", email: "bincyk@suvara.com", password: "rose@suvara" },
  { sl: 32, name: "Lisby", houseName: "Elayanithottam", phone: "9446221807", email: "lisbye@suvara.com", password: "anthony@suvara" },
  { sl: 33, name: "Harry C. Joseph", houseName: "Cheeramkunnel", phone: "8606276049", email: "harryc@suvara.com", password: "leo@suvara" },
  { sl: 34, name: "Jose Joseph", houseName: "Alappatt", phone: "9847643332", email: "josea@suvara.com", password: "catherine@suvara" },
  { sl: 35, name: "Ajesh P. Jose", houseName: "Panaykkal", phone: "9446759246", email: "ajeshp@suvara.com", password: "teresa@suvara" },
  { sl: 36, name: "V.J. Thomas", houseName: "Vellappally", phone: "9495875308", email: "thomasv@suvara.com", password: "ignatius@suvara" },
  { sl: 37, name: "Shantachan", houseName: "Kolathamvayalil", phone: "9446025109", email: "shantachank@suvara.com", password: "francisxavier@suvara" },
  { sl: 38, name: "Cyriac", houseName: "Narithookkil", phone: "9946637680", email: "cyriacn@suvara.com", password: "vincent@suvara" },
  { sl: 39, name: "Reeby Martin", houseName: "Pezhumvayalil", phone: "9656606506", email: "reebyp@suvara.com", password: "johnbosco@suvara" },
  { sl: 40, name: "K.C. Thomas", houseName: "Kottadikkunnel", phone: "9495329883", email: "thomask@suvara.com", password: "albert@suvara" },
  { sl: 41, name: "Shaji", houseName: "Kannamkuzhiyil", phone: "9495601491", email: "shajik@suvara.com", password: "therese@suvara" },
  { sl: 42, name: "P.J. Lukose", houseName: "Pulimmoottil", phone: "9947929542", email: "lukosep@suvara.com", password: "blaise@suvara" },
  { sl: 43, name: "Thomas", houseName: "Alencherry", phone: "9446718011", email: "thomasa@suvara.com", password: "louis@suvara" },
  { sl: 44, name: "Sr. Mariyat", houseName: "SH", phone: "8281976270", email: "mariyats@suvara.com", password: "faustina@suvara" },
  { sl: 45, name: "Joseph Mathew", houseName: "Pathippallil", phone: "9061214856", email: "josephp@suvara.com", password: "motherteresa@suvara" },
  { sl: 46, name: "Varghese", houseName: "Kochukunnel", phone: "9447137188", email: "varghesek@suvara.com", password: "johnpaul@suvara" },
  { sl: 47, name: "Joby Joseph", houseName: "Palapulikkal", phone: "9447128096", email: "jobyp@suvara.com", password: "carloacutis@suvara" }
];

async function createAuthUser(email, password, displayName) {
  const signUpUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`;
  const res = await fetch(signUpUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password,
      returnSecureToken: true
    })
  });

  const data = await res.json();
  if (res.ok) {
    // Update display name
    const updateUrl = `https://identitytoolkit.googleapis.com/v1/accounts:update?key=${apiKey}`;
    await fetch(updateUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idToken: data.idToken,
        displayName: displayName,
        returnSecureToken: true
      })
    });
    return { uid: data.localId, newlyCreated: true };
  }

  if (data?.error?.message === 'EMAIL_EXISTS') {
    // Attempt sign in with password to obtain uid
    const signInUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`;
    const signInRes = await fetch(signInUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        returnSecureToken: true
      })
    });
    const signInData = await signInRes.json();
    if (signInRes.ok) {
      // Update display name just in case
      const updateUrl = `https://identitytoolkit.googleapis.com/v1/accounts:update?key=${apiKey}`;
      await fetch(updateUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idToken: signInData.idToken,
          displayName: displayName,
          returnSecureToken: true
        })
      });
      return { uid: signInData.localId, newlyCreated: false };
    } else {
      throw new Error(`Email already exists in Auth but sign in failed: ${signInData?.error?.message || 'Unknown error'}`);
    }
  }

  throw new Error(`Failed to create Auth user: ${data?.error?.message || JSON.stringify(data)}`);
}

async function run() {
  console.log(`Starting account creation for ${animators.length} animators...`);
  
  const results = [];
  let successCount = 0;
  let failCount = 0;

  for (const item of animators) {
    try {
      console.log(`[${item.sl}/${animators.length}] Creating Auth user for ${item.name} (${item.email})...`);
      const { uid, newlyCreated } = await createAuthUser(item.email, item.password, item.name);
      console.log(`  -> Auth UID: ${uid} (newlyCreated: ${newlyCreated})`);

      // Write to Firestore: users collection
      const userDocRef = doc(db, 'users', uid);
      await setDoc(userDocRef, {
        id: uid,
        uid: uid,
        name: item.name,
        email: item.email,
        role: 'animator',
        phoneNumber: item.phone,
        address: item.houseName,
        parishId: '',
        parishName: '',
        profileImageUrl: null,
        createdAt: serverTimestamp(),
        createdBy: '3UGASbTKCyVT4vR1n7j0YEv2PC53'
      }, { merge: true });

      // Write to Firestore: animator_assignments collection
      const assignmentDocRef = doc(db, 'animator_assignments', uid);
      const assignmentSnap = await getDoc(assignmentDocRef);
      if (!assignmentSnap.exists()) {
        await setDoc(assignmentDocRef, {
          animatorName: item.name,
          animatorEmail: item.email,
          assignments: []
        });
      } else {
        await setDoc(assignmentDocRef, {
          animatorName: item.name,
          animatorEmail: item.email
        }, { merge: true });
      }

      console.log(`  -> Firestore records created/updated.`);
      successCount++;
      results.push({ sl: item.sl, name: item.name, email: item.email, uid, status: 'SUCCESS' });
    } catch (err) {
      console.error(`  -> ERROR for ${item.email}:`, err.message);
      failCount++;
      results.push({ sl: item.sl, name: item.name, email: item.email, status: 'FAILED', error: err.message });
    }
    // Small delay to prevent rate limits
    await new Promise(r => setTimeout(r, 200));
  }

  console.log('\n================== SUMMARY ==================');
  console.log(`Total: ${animators.length}`);
  console.log(`Success: ${successCount}`);
  console.log(`Failed: ${failCount}`);
  console.log('=============================================');

  if (failCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

run().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

