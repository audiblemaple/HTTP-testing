const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');

const app = express();

// -------------------- CONFIG --------------------
const AUTH_TOKEN = process.env.AUTH_TOKEN || "dev-secret-token-change-me";
const PORT = process.env.PORT || 3000;
const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;

// parse the service account
let serviceAccount;
try {
  serviceAccount = JSON.parse(serviceAccountJson);
} catch (e) {
  console.error("Could not parse FIREBASE_SERVICE_ACCOUNT env var. Did you set it?");
  process.exit(1);
}

// fix \n in private key
if (serviceAccount.private_key) {
  serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
}

// init firebase admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}
const db = admin.firestore();
const locationsColl = db.collection('locations');

// ---------- MIDDLEWARE ----------

// Allow cross-origin reads from anywhere (map viewer, local file, etc.)
app.use(cors({
  origin: '*',            // allow all origins to GET your data
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'X-Auth'],
}));

app.use(express.json({ limit: '1mb' }));

function requireAuth(req, res, next) {
  const headerToken = req.get('X-Auth');
  if (!headerToken || headerToken !== AUTH_TOKEN) {
    return res.status(401).json({ ok: false, error: 'unauthorized' });
  }
  next();
}

// ---- helper + routes below unchanged ----
function normalizeRecord(body) {
  const {
    deviceId,
    messageUUID,
    Latitude,
    Longitude,
    Accuracy,
    batteryVoltage,
    inputVoltage,
    cpuTemp,
    ambientTemp,
    timeStamp,
  } = body || {};

  if (!deviceId || !messageUUID || Latitude === undefined || Longitude === undefined) {
    return { error: 'Missing required fields (deviceId, messageUUID, Latitude, Longitude)' };
  }

  const latNum = Number(Latitude);
  const lonNum = Number(Longitude);
  if (latNum < -90 || latNum > 90 || lonNum < -180 || lonNum > 180) {
    return { error: 'Invalid lat/lon range' };
  }

  return {
    record: {
      deviceId: String(deviceId),
      messageUUID: String(messageUUID),
      Latitude: latNum,
      Longitude: lonNum,
      Accuracy: Accuracy !== undefined ? Number(Accuracy) : null,
      batteryVoltage: batteryVoltage !== undefined ? Number(batteryVoltage) : null,
      inputVoltage: inputVoltage !== undefined ? Number(inputVoltage) : null,
      cpuTemp: cpuTemp !== undefined ? String(cpuTemp) : null,
      ambientTemp: ambientTemp !== undefined ? String(ambientTemp) : null,
      timeStamp: timeStamp ? new Date(timeStamp).toISOString() : null,
      serverReceivedAt: new Date().toISOString(),
      raw: body,
    }
  };
}

// Health
app.get('/', (req, res) => {
  res.json({ ok: true, msg: 'telemetry receiver online' });
});

// Ingest
app.post('/api/v1/ingest', requireAuth, async (req, res) => {
  console.log("[INGEST] Received request");
  console.log("Headers:", req.headers);
  console.log("Body:", req.body);

  const { record, error } = normalizeRecord(req.body);

  if (error) {
    console.log("[INGEST] Invalid record:", error);
    return res.status(400).json({ ok: false, error });
  }

  console.log("[INGEST] Normalized record:", record);

  try {
    const docRef = await locationsColl.add(record);
    console.log("[INGEST] Stored document in Firestore:", docRef.id);
    res.json({ ok: true, id: docRef.id });
    console.log("[INGEST] Response sent for device:", record.deviceId);
  } catch (err) {
    console.error("[INGEST] Firestore write failed:", err);
    res.status(500).json({ ok: false, error: "DB insert failed" });
  }
});

// Last point
app.get('/api/v1/last', async (req, res) => {
  const { deviceId } = req.query;
  console.log(req.query);
  if (!deviceId) {
    return res.status(400).json({ ok: false, error: 'deviceId is required' });
  }

  try {
    const snap = await locationsColl
      .where('deviceId', '==', String(deviceId))
      .orderBy('serverReceivedAt', 'desc')
      .limit(1)
      .get();

    if (snap.empty) {
      return res.status(404).json({ ok: false, error: 'No data for deviceId' });
    }

    const doc = snap.docs[0];
    return res.json({ ok: true, data: { id: doc.id, ...doc.data() } });
  } catch (err) {
    console.error('Firestore query failed:', err);
    return res.status(500).json({ ok: false, error: 'DB query failed' });
  }
});

// History
app.get('/api/v1/history', async (req, res) => {
  const { deviceId, limit } = req.query;
  if (!deviceId) {
    return res.status(400).json({ ok: false, error: 'deviceId is required' });
  }

  const lim = Math.min(parseInt(limit || '100', 10), 1000);

  try {
    const snap = await locationsColl
      .where('deviceId', '==', String(deviceId))
      .orderBy('serverReceivedAt', 'desc')
      .limit(lim)
      .get();

    const arr = [];
    snap.forEach(d => {
      arr.push({
        id: d.id,
        ...d.data(),
      });
    });

    return res.json({ ok: true, data: arr });
  } catch (err) {
    console.error('Firestore query failed:', err);
    return res.status(500).json({ ok: false, error: 'DB query failed' });
  }
});

app.listen(PORT, () => {
  console.log(`Telemetry server listening on port ${PORT}`);
});
