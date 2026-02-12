import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();
const db = admin.firestore();

// Example: HTTPS function to get a profile by uid
export const getProfile = functions.https.onRequest(async (req, res) => {
  try {
    const uid = req.query.uid as string;
    if (!uid) return res.status(400).json({ error: 'uid is required' });
    const doc = await db.collection('profiles').doc(uid).get();
    if (!doc.exists) return res.status(404).json({ error: 'Profile not found' });
    return res.json({ id: doc.id, ...doc.data() });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'internal' });
  }
});
