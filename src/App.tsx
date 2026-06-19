import React, { useState, useEffect, useRef } from 'react';
import { StockChart } from './components/StockChart';
import { SearchBar } from './components/SearchBar';
import { LineChart, Briefcase, Cloud, LogOut, User } from 'lucide-react';
import { PortfolioModal } from './components/PortfolioModal';
import { LoginModal } from './components/LoginModal';
import { useGoogleDriveSync } from './hooks/useGoogleDriveSync';

const App: React.FC = () => {
  const [customTickers, setCustomTickers] = useState<string[]>(() => {
    const saved = localStorage.getItem('watchlist');
    return saved ? JSON.parse(saved) : [];
  });

  const [portfolio, setPortfolio] = useState<{ [ticker: string]: number }>(() => {
    const saved = localStorage.getItem('portfolio');
    return saved ? JSON.parse(saved) : {};
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [hasCheckedBackup, setHasCheckedBackup] = useState(false);

  const {
    accessToken,
    userProfile,
    isSyncing,
    error: googleError,
    lastSyncTime,
    login: googleLogin,
    logout: googleLogout,
    initializeGAS,
    syncToDrive,
    loadFromDrive,
    logEvent,
  } = useGoogleDriveSync();

  // Reference to avoid initial auto-sync during restoration
  const isRestoringRef = useRef(false);

  useEffect(() => {
    localStorage.setItem('watchlist', JSON.stringify(customTickers));
  }, [customTickers]);

  useEffect(() => {
    localStorage.setItem('portfolio', JSON.stringify(portfolio));
  }, [portfolio]);

  // Google Drive: Check and restore backup once logged in
  useEffect(() => {
    if (accessToken) {
      const checkAndRestore = async () => {
        isRestoringRef.current = true;
        try {
          const initOk = await initializeGAS(accessToken);
          if (initOk) {
            const driveData = await loadFromDrive();
            if (driveData) {
              const confirmLoad = window.confirm(
                "구글 드라이브에 기존 백업 데이터가 있습니다. 불러오시겠습니까?\n(취소하면 현재 브라우저 정보로 덮어씁니다.)"
              );
              if (confirmLoad) {
                if (driveData.watchlist) {
                  setCustomTickers(driveData.watchlist);
                }
                if (driveData.portfolio) {
                  setPortfolio(driveData.portfolio);
                }
                alert("구글 드라이브 데이터를 정상적으로 불러왔습니다!");
              } else {
                // Overwrite Drive with current local data
                await syncToDrive(customTickers, portfolio);
              }
            } else {
              // No file exists, sync current local data to Drive
              await syncToDrive(customTickers, portfolio);
            }
          }
        } catch (err) {
          console.error("Backup check failed:", err);
        } finally {
          setHasCheckedBackup(true);
          isRestoringRef.current = false;
        }
      };
      checkAndRestore();
    } else {
      setHasCheckedBackup(false);
    }
  }, [accessToken]);

  // Google Drive: Auto-sync on watchlist or portfolio change
  useEffect(() => {
    if (accessToken && hasCheckedBackup && !isRestoringRef.current) {
      const timer = setTimeout(() => {
        syncToDrive(customTickers, portfolio);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [customTickers, portfolio, accessToken, hasCheckedBackup]);

  const handleAddTicker = (ticker: string) => {
    if (customTickers.includes(ticker)) return;
    setCustomTickers([...customTickers, ticker]);
    logEvent('watchlist_add', { ticker });
  };

  const handleRemoveTicker = (ticker: string) => {
    setCustomTickers(customTickers.filter(t => t !== ticker));
    logEvent('watchlist_remove', { ticker });
  };

  const handleAddToPortfolio = (ticker: string) => {
    setPortfolio(prev => {
      if (prev[ticker] !== undefined) {
        setIsModalOpen(true);
        return prev;
      }
      const updated = { ...prev, [ticker]: 1 };
      setIsModalOpen(true);
      logEvent('portfolio_add', { ticker, qty: 1 });
      return updated;
    });
  };

  const handleUpdateQuantity = (ticker: string, qty: number) => {
    setPortfolio(prev => ({
      ...prev,
      [ticker]: qty
    }));
    logEvent('portfolio_update_qty', { ticker, qty });
  };

  const handleRemoveFromPortfolio = (ticker: string) => {
    setPortfolio(prev => {
      const updated = { ...prev };
      delete updated[ticker];
      logEvent('portfolio_remove', { ticker });
      return updated;
    });
  };

  // Preset default indices
  const defaultIndices = [
    { ticker: '^KS11', title: 'KOSPI', color: 'var(--color-kospi)' },
    { ticker: '^KQ11', title: 'KOSDAQ', color: 'var(--color-kosdaq)' },
    { ticker: '^IXIC', title: 'NASDAQ', color: 'var(--color-nasdaq)' },
    { ticker: '^GSPC', title: 'S&P 500', color: 'var(--color-sp500)' },
  ];

  return (
    <div className="app-container">
      {googleError && (
        <div className="error-banner" style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', padding: '10px 20px', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{googleError}</span>
        </div>
      )}

      <header className="app-header glass">
        <div className="header-title-container">
          <LineChart size={32} color="var(--accent-color)" />
          <h1>Global Markets Dashboard</h1>
        </div>
        
        <div className="header-actions-container">
          {/* User Profile Badge (Google) */}
          {userProfile && (
            <div className="user-profile-badge glass" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 10px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)' }}>
              <img src={userProfile.picture} alt={userProfile.name} className="user-avatar" style={{ width: '24px', height: '24px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.1)' }} referrerPolicy="no-referrer" />
              <div className="user-details" style={{ display: 'flex', flexDirection: 'column' }}>
                <span className="user-name" style={{ fontSize: '0.78rem', fontWeight: 600 }}>{userProfile.name}</span>
                <span className="user-email" style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>{userProfile.email}</span>
              </div>
            </div>
          )}

          {/* Cloud Sync Backup Button */}
          {userProfile && (
            <button 
              onClick={() => syncToDrive(customTickers, portfolio)}
              className="portfolio-btn glass sync-btn"
              disabled={isSyncing}
              title={lastSyncTime ? `마지막 백업: ${lastSyncTime}` : '구글 드라이브에 백업'}
              style={{ padding: '0.5rem 0.85rem' }}
            >
              <Cloud size={16} color={isSyncing ? 'var(--text-secondary)' : '#4285F4'} className={isSyncing ? 'sync-spin' : ''} />
              <span style={{ fontSize: '0.82rem' }}>{isSyncing ? '백업 중...' : '드라이브 백업'}</span>
            </button>
          )}

          {/* Login / Logout Button */}
          {userProfile ? (
            <button onClick={googleLogout} className="portfolio-btn glass logout-btn" style={{ padding: '0.5rem 0.85rem' }}>
              <LogOut size={16} />
              <span style={{ fontSize: '0.82rem' }}>로그아웃</span>
            </button>
          ) : (
            <button onClick={() => setIsLoginModalOpen(true)} className="portfolio-btn glass login-btn" style={{ padding: '0.5rem 0.85rem' }}>
              <User size={16} color="#4285F4" />
              <span style={{ fontSize: '0.82rem' }}>Google 로그인</span>
            </button>
          )}

          {/* My Portfolio Button */}
          <button 
            onClick={() => setIsModalOpen(true)}
            className="portfolio-btn glass"
            style={{ padding: '0.5rem 0.85rem' }}
          >
            <Briefcase size={16} />
            <span style={{ fontSize: '0.82rem' }}>My Portfolio</span>
          </button>
        </div>
      </header>

      <SearchBar onAddTicker={handleAddTicker} />

      <div className="dashboard-grid">
        {/* Render default indices */}
        {defaultIndices.map((idx) => (
          <StockChart
            key={idx.ticker}
            ticker={idx.ticker}
            title={idx.title}
            color={idx.color}
            onAddToPortfolio={handleAddToPortfolio}
            onRemoveFromPortfolio={handleRemoveFromPortfolio}
            isInPortfolio={portfolio[idx.ticker] !== undefined}
          />
        ))}

        {/* Render custom user searched tickers */}
        {customTickers.map((ticker) => (
          <StockChart
            key={ticker}
            ticker={ticker}
            title={ticker}
            color="var(--accent-color)"
            onRemove={() => handleRemoveTicker(ticker)}
            onAddToPortfolio={handleAddToPortfolio}
            onRemoveFromPortfolio={handleRemoveFromPortfolio}
            isInPortfolio={portfolio[ticker] !== undefined}
          />
        ))}
      </div>

      {isModalOpen && (
        <PortfolioModal
          portfolio={portfolio}
          onClose={() => setIsModalOpen(false)}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveTicker={handleRemoveFromPortfolio}
        />
      )}

      {isLoginModalOpen && (
        <LoginModal
          onClose={() => setIsLoginModalOpen(false)}
          onLogin={googleLogin}
        />
      )}
    </div>
  );
};

export default App;
