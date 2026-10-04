import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  updateDoc, 
  onSnapshot, 
  query 
} from 'firebase/firestore';
import { DailyReport } from '../types/cucom';

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDXK22phiazERzbFOZrYR4HhEJQrpSXGH0",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "engineering-work-portal.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "engineering-work-portal",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "engineering-work-portal.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "38777137883",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:38777137883:web:5c719dd28f3fd91454bafe",
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app);

const COLLECTION_NAME = 'cucom_daily_reports';

// BroadcastChannel for instant cross-tab / multi-window synchronization
let broadcastChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    broadcastChannel = new BroadcastChannel('cucom_live_reporting_channel');
  }
} catch (e) {
  console.warn('BroadcastChannel not supported', e);
}

export function broadcastReportUpdate(report: DailyReport) {
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage({ type: 'REPORT_UPDATED', report });
    } catch (e) {
      console.warn('Broadcast failed', e);
    }
  }
}

export function onBroadcastUpdate(callback: (report: DailyReport) => void) {
  if (!broadcastChannel) return () => {};
  const handler = (event: MessageEvent) => {
    if (event.data && event.data.type === 'REPORT_UPDATED' && event.data.report) {
      callback(event.data.report);
    }
  };
  broadcastChannel.addEventListener('message', handler);
  return () => broadcastChannel?.removeEventListener('message', handler);
}

// Clean object for Firestore storage
const sanitize = <T>(obj: T): T => JSON.parse(JSON.stringify(obj));

// Cloud save
export async function syncReportToCloud(report: DailyReport): Promise<boolean> {
  try {
    const docRef = doc(db, COLLECTION_NAME, report.id);
    await setDoc(docRef, sanitize(report), { merge: true });
    return true;
  } catch (err) {
    console.warn('Cloud sync error (fallback to local active):', err);
    return false;
  }
}

// Real-time Cloud listener
export function subscribeToCloudReports(onData: (reports: DailyReport[]) => void) {
  try {
    const q = query(collection(db, COLLECTION_NAME));
    return onSnapshot(q, (snapshot) => {
      const cloudList: DailyReport[] = [];
      snapshot.forEach(docSnap => {
        cloudList.push(docSnap.data() as DailyReport);
      });
      if (cloudList.length > 0) {
        onData(cloudList);
      }
    }, (error) => {
      console.warn('Firestore subscription inactive, using local store:', error.message);
    });
  } catch (e) {
    console.warn('Cloud subscription error:', e);
    return () => {};
  }
}
