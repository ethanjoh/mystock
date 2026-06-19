import { useState, useEffect, useCallback } from 'react';

export interface UserProfile {
  name: string;
  email: string;
  picture: string;
}

export interface DriveData {
  watchlist: string[];
  portfolio: { [ticker: string]: number };
}

const GOOGLE_CLIENT_ID = '199422703221-6t95s4hfen00ndbqlne3i97c543grj3f.apps.googleusercontent.com';
const GAS_URL = 'https://script.google.com/macros/s/AKfycbzIoxUtSu_IFFIUEB-Fc_QjPh5oAJQOcDIWZp9gETedx8hq_dq21jN9FL5FF6w0A2nw/exec';

export const useGoogleDriveSync = () => {
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

  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [lastSyncTime, setLastSyncTime] = useState<string | null>(() => {
    return localStorage.getItem('google_drive_sync_last_sync');
  });

  // Save session states
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

  // Load User Profile from Google API using access token
  const fetchUserProfile = async (token: string) => {
    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch user profile');
      }
      const data = await response.json();
      const profile: UserProfile = {
        name: data.name || 'Google User',
        email: data.email || '',
        picture: data.picture || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y',
      };
      setUserProfile(profile);
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError('사용자 프로필을 가져오는데 실패했습니다.');
      logout();
    }
  };

  // Login Handler
  const login = useCallback((runAsMock: boolean) => {
    setError(null);

    if (runAsMock) {
      setIsMock(true);
      setAccessToken('mock-access-token-123456');
      setUserProfile({
        name: '테스트 사용자',
        email: 'test@gmail.com',
        picture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80',
      });
      return;
    }

    // Real Login Flow with drive.appdata scope
    const g = (window as any).google;
    if (!g || !g.accounts || !g.accounts.oauth2) {
      setError('구글 로그인 라이브러리가 로드되지 않았습니다. 잠시 후 다시 시도해 주세요.');
      return;
    }

    try {
      const client = g.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: 'https://www.googleapis.com/auth/drive.appdata https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
        callback: (tokenResponse: any) => {
          if (tokenResponse && tokenResponse.access_token) {
            setAccessToken(tokenResponse.access_token);
            setIsMock(false);
            fetchUserProfile(tokenResponse.access_token);
          } else if (tokenResponse && tokenResponse.error) {
            setError(`구글 로그인 실패: ${tokenResponse.error_description || tokenResponse.error}`);
          }
        },
      });
      client.requestAccessToken();
    } catch (err: any) {
      console.error(err);
      setError(`로그인 초기화 실패: ${err.message}`);
    }
  }, []);

  // Logout Handler
  const logout = useCallback(() => {
    setAccessToken(null);
    setUserProfile(null);
    setIsMock(false);
    setError(null);
    sessionStorage.removeItem('google_drive_sync_access_token');
    sessionStorage.removeItem('google_drive_sync_user_profile');
    sessionStorage.removeItem('google_drive_sync_is_mock');
  }, []);

  // Initialize GAS Files (action=init)
  const initializeGAS = async (token: string): Promise<boolean> => {
    if (isMock) return true;
    setIsSyncing(true);
    setError(null);
    try {
      const response = await fetch(`${GAS_URL}?action=init&access_token=${token}`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error(`GAS initialization request failed: ${response.statusText}`);
      }
      const data = await response.json();
      if (!data.ok) {
        throw new Error(data.error || 'Unknown GAS initialization error');
      }
      setIsSyncing(false);
      return true;
    } catch (err: any) {
      console.error(err);
      setError(`구글 앱스 스크립트 초기화 실패: ${err.message}`);
      setIsSyncing(false);
      return false;
    }
  };

  // Sync / Upload current dashboard state to GAS (action=set)
  const syncToDrive = async (watchlist: string[], portfolio: { [ticker: string]: number }) => {
    if (!accessToken) {
      setError('로그인이 필요합니다.');
      return false;
    }

    setIsSyncing(true);
    setError(null);

    const payload: DriveData = { watchlist, portfolio };

    if (isMock) {
      // Mock sync logic
      await new Promise((resolve) => setTimeout(resolve, 800));
      localStorage.setItem('mock_google_drive_file', JSON.stringify(payload));
      console.log('Mock sync saved details:', payload);
      
      const nowStr = new Date().toLocaleString();
      setLastSyncTime(nowStr);
      localStorage.setItem('google_drive_sync_last_sync', nowStr);
      setIsSyncing(false);
      return true;
    }

    try {
      // Set file content in GAS (action=set) using text/plain to avoid preflight issues
      const response = await fetch(`${GAS_URL}?action=set&access_token=${accessToken}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
        },
        body: JSON.stringify({ data: payload }),
      });
      
      if (!response.ok) {
        throw new Error(`GAS set request failed: ${response.statusText}`);
      }
      
      const data = await response.json();
      if (!data.ok) {
        throw new Error(data.error || 'Unknown GAS set error');
      }

      const nowStr = new Date().toLocaleString();
      setLastSyncTime(nowStr);
      localStorage.setItem('google_drive_sync_last_sync', nowStr);
      setIsSyncing(false);
      return true;
    } catch (err: any) {
      console.error(err);
      setError(`구글 드라이브 동기화 실패: ${err.message}`);
      setIsSyncing(false);
      return false;
    }
  };

  // Load data from GAS (action=get)
  const loadFromDrive = async (): Promise<DriveData | null> => {
    if (!accessToken) {
      setError('로그인이 필요합니다.');
      return null;
    }

    setIsSyncing(true);
    setError(null);

    if (isMock) {
      await new Promise((resolve) => setTimeout(resolve, 600));
      const saved = localStorage.getItem('mock_google_drive_file');
      setIsSyncing(false);
      return saved ? JSON.parse(saved) : null;
    }

    try {
      const response = await fetch(`${GAS_URL}?action=get&access_token=${accessToken}`, {
        method: 'GET',
      });
      if (!response.ok) {
        throw new Error(`GAS get request failed: ${response.statusText}`);
      }

      const data = await response.json();
      if (!data.ok) {
        // If not initialized, try initializing first
        if (data.error && data.error.includes('Not initialized')) {
          const initOk = await initializeGAS(accessToken);
          if (initOk) {
            setIsSyncing(false);
            return null; // Return empty since it's freshly initialized
          }
        }
        throw new Error(data.error || 'Unknown GAS get error');
      }

      // Check if user data exists inside returned structure doc.data
      // doc format in GAS: { _schema: 1, createdAt: "...", updatedAt: "...", data: { watchlist, portfolio } }
      const driveDoc = data.data;
      setIsSyncing(false);
      
      if (driveDoc && driveDoc.data) {
        return driveDoc.data;
      }
      
      return null;
    } catch (err: any) {
      console.error(err);
      setError(`구글 드라이브 데이터 로드 실패: ${err.message}`);
      setIsSyncing(false);
      return null;
    }
  };

  // Append Event to NDJSON log in GAS (action=append)
  const logEvent = useCallback(async (eventType: string, details: any) => {
    if (!accessToken) return;

    if (isMock) {
      console.log(`[Mock GAS Event Log] type: ${eventType}, details:`, details);
      return;
    }

    try {
      await fetch(`${GAS_URL}?action=append&access_token=${accessToken}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
        },
        body: JSON.stringify({
          event: {
            type: eventType,
            ...details,
            ts: new Date().toISOString(),
          },
        }),
      });
    } catch (err) {
      console.error(`Failed to log event (${eventType}) to GAS:`, err);
    }
  }, [accessToken, isMock]);

  return {
    clientId: GOOGLE_CLIENT_ID,
    accessToken,
    userProfile,
    isMock,
    isSyncing,
    error,
    lastSyncTime,
    login,
    logout,
    initializeGAS,
    syncToDrive,
    loadFromDrive,
    logEvent,
  };
};
