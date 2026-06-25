import { useState, useEffect, useCallback } from 'react';
import { auth, db, googleProvider, isFirebaseConfigured } from '../firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, addDoc } from 'firebase/firestore';

export interface UserProfile {
  name: string;
  email: string;
  picture: string;
}

export interface DriveData {
  watchlist: string[];
  portfolio: { [ticker: string]: number };
}

export const useFirebaseSync = () => {
  const [accessToken, setAccessToken] = useState<string | null>(() => {
    return sessionStorage.getItem('google_drive_sync_access_token');
  });

  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    const saved = sessionStorage.getItem('google_drive_sync_user_profile');
    return saved ? JSON.parse(saved) : null;
  });

  const [isMock, setIsMock] = useState<boolean>(() => {
    return sessionStorage.getItem('google_drive_sync_is_mock') === 'true';
  });

  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(() => {
    return localStorage.getItem('google_drive_sync_last_sync');
  });

  // Persist session state
  useEffect(() => {
    if (accessToken) {
      sessionStorage.setItem('google_drive_sync_access_token', accessToken);
    } else {
      sessionStorage.removeItem('google_drive_sync_access_token');
    }
  }, [accessToken]);

  useEffect(() => {
    if (userProfile) {
      sessionStorage.setItem('google_drive_sync_user_profile', JSON.stringify(userProfile));
    } else {
      sessionStorage.removeItem('google_drive_sync_user_profile');
    }
  }, [userProfile]);

  useEffect(() => {
    sessionStorage.setItem('google_drive_sync_is_mock', String(isMock));
  }, [isMock]);

  // Firebase Auth State Listener
  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      console.warn("Firebase is not configured. Running useFirebaseSync in local mock fallback mode.");
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setAccessToken(user.uid);
        setUserProfile({
          name: user.displayName || 'Google User',
          email: user.email || '',
          picture: user.photoURL || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y',
        });
        setIsMock(false);
      } else {
        // Only clear if we are not running as mock
        if (!sessionStorage.getItem('google_drive_sync_is_mock') || sessionStorage.getItem('google_drive_sync_is_mock') !== 'true') {
          setAccessToken(null);
          setUserProfile(null);
          setIsMock(false);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Login Handler (defaults to false for real OAuth)
  const login = useCallback(async (runAsMock: boolean = false) => {
    setError(null);

    // Force mock or if Firebase is not configured
    if (runAsMock || !isFirebaseConfigured || !auth) {
      setIsMock(true);
      setAccessToken('mock-access-token-123456');
      setUserProfile({
        name: '테스트 사용자',
        email: 'test@gmail.com',
        picture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80',
      });
      return;
    }

    // Real Firebase Auth login
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      setAccessToken(user.uid);
      setUserProfile({
        name: user.displayName || 'Google User',
        email: user.email || '',
        picture: user.photoURL || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y',
      });
      setIsMock(false);
    } catch (err: any) {
      console.error(err);
      setError(`구글 로그인 실패: ${err.message}`);
    }
  }, []);

  // Logout Handler
  const logout = useCallback(async () => {
    setError(null);
    setLastSyncTime(null);
    sessionStorage.removeItem('google_drive_sync_access_token');
    sessionStorage.removeItem('google_drive_sync_user_profile');
    sessionStorage.removeItem('google_drive_sync_is_mock');
    localStorage.removeItem('google_drive_sync_last_sync');

    setAccessToken(null);
    setUserProfile(null);
    setIsMock(false);

    if (isFirebaseConfigured && auth) {
      try {
        await signOut(auth);
      } catch (err: any) {
        console.error(err);
      }
    }
  }, []);

  // Sync watchlist & portfolio to Firestore (or local mock file)
  const syncToFirebase = async (watchlist: string[], portfolio: { [ticker: string]: number }): Promise<boolean> => {
    if (!accessToken) {
      setError('로그인이 필요합니다.');
      return false;
    }
    setIsSyncing(true);
    setError(null);

    const data: DriveData = { watchlist, portfolio };

    if (isMock || !isFirebaseConfigured || !db) {
      // Mock flow
      await new Promise((resolve) => setTimeout(resolve, 300)); // Simulate minor delay
      localStorage.setItem('mock_google_drive_file', JSON.stringify(data));
      const syncTime = new Date().toLocaleString();
      setLastSyncTime(syncTime);
      localStorage.setItem('google_drive_sync_last_sync', syncTime);
      setIsSyncing(false);
      return true;
    }

    // Real Firestore Sync
    try {
      const userDocRef = doc(db, 'users', accessToken);
      await setDoc(userDocRef, {
        watchlist,
        portfolio,
        updatedAt: new Date().toISOString()
      });

      const syncTime = new Date().toLocaleString();
      setLastSyncTime(syncTime);
      localStorage.setItem('google_drive_sync_last_sync', syncTime);
      setIsSyncing(false);
      return true;
    } catch (err: any) {
      console.error(err);
      setError(`Firebase 동기화 실패: ${err.message}`);
      setIsSyncing(false);
      return false;
    }
  };

  // Load watchlist & portfolio from Firestore (or local mock file)
  const loadFromFirebase = async (): Promise<DriveData | null> => {
    if (!accessToken) {
      setError('로그인이 필요합니다.');
      return null;
    }
    setIsSyncing(true);
    setError(null);

    if (isMock || !isFirebaseConfigured || !db) {
      // Mock flow
      await new Promise((resolve) => setTimeout(resolve, 200));
      const saved = localStorage.getItem('mock_google_drive_file');
      setIsSyncing(false);
      return saved ? JSON.parse(saved) : null;
    }

    // Real Firestore Load
    try {
      const userDocRef = doc(db, 'users', accessToken);
      const userDocSnap = await getDoc(userDocRef);
      
      setIsSyncing(false);
      if (userDocSnap.exists()) {
        const docData = userDocSnap.data();
        return {
          watchlist: docData.watchlist || [],
          portfolio: docData.portfolio || {}
        };
      }
      return null;
    } catch (err: any) {
      console.error(err);
      setError(`Firebase 데이터 로드 실패: ${err.message}`);
      setIsSyncing(false);
      return null;
    }
  };

  // Log events to Firestore collection (or console for mock)
  const logEvent = useCallback(async (eventType: string, details: any) => {
    if (!accessToken) return;

    const logData = {
      type: eventType,
      ...details,
      ts: new Date().toISOString()
    };

    if (isMock || !isFirebaseConfigured || !db) {
      console.log(`[Mock Event Log] type: ${eventType}, details:`, details);
      return;
    }

    try {
      const eventsCollectionRef = collection(db, 'events');
      await addDoc(eventsCollectionRef, {
        uid: accessToken,
        email: userProfile?.email || '',
        ...logData
      });
    } catch (err: any) {
      console.error(`Failed to log event (${eventType}) to Firebase:`, err);
    }
  }, [accessToken, isMock, userProfile]);

  return {
    accessToken,
    userProfile,
    isMock,
    isSyncing,
    error,
    lastSyncTime,
    login,
    logout,
    syncToFirebase,
    loadFromFirebase,
    logEvent,
  };
};
