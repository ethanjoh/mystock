import React, { useState, useEffect, useRef } from 'react';
import { StockChart } from './components/StockChart';
import { SearchBar } from './components/SearchBar';
import { ExchangeRateBar } from './components/ExchangeRateBar';
import { LineChart, Briefcase, Cloud, LogOut, User, X } from 'lucide-react';
import { PortfolioModal } from './components/PortfolioModal';
import { LoginModal } from './components/LoginModal';
import { useFirebaseSync } from './hooks/useFirebaseSync';

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
  const [selectedExchangeRate, setSelectedExchangeRate] = useState<{ ticker: string; title: string } | null>(null);

  const {
    accessToken,
    userProfile,
    isSyncing,
    isAuthInitialized,
    error: syncError,
    lastSyncTime,
    login: googleLogin,
    logout: googleLogout,
    syncToFirebase,
    loadFromFirebase,
    logEvent,
  } = useFirebaseSync();

  // Reference to avoid initial auto-sync during restoration
  const isRestoringRef = useRef(false);

  useEffect(() => {
    localStorage.setItem('watchlist', JSON.stringify(customTickers));
  }, [customTickers]);

  useEffect(() => {
    localStorage.setItem('portfolio', JSON.stringify(portfolio));
  }, [portfolio]);

  // Firebase: Check and restore backup silently once logged in and Auth is initialized
  useEffect(() => {
    if (accessToken && isAuthInitialized) {
      const restoreBackup = async () => {
        isRestoringRef.current = true;
        try {
          const driveData = await loadFromFirebase();
          if (driveData) {
            if (driveData.watchlist) {
              setCustomTickers(driveData.watchlist);
            }
            if (driveData.portfolio) {
              setPortfolio(driveData.portfolio);
            }
          }
        } catch (err) {
          console.error("Backup restore failed:", err);
        } finally {
          isRestoringRef.current = false;
        }
      };
      restoreBackup();
    }
  }, [accessToken, isAuthInitialized]);

  const handleAddTicker = (ticker: string) => {
    if (customTickers.includes(ticker)) return;
    setCustomTickers([...customTickers, ticker]);
    logEvent('watchlist_add', { ticker });
  };

  const handleRemoveTicker = (ticker: string) => {
    setCustomTickers(customTickers.filter(t => t !== ticker));
    logEvent('watchlist_remove', { ticker });
  };

  const handleLogout = () => {
    googleLogout();
    setCustomTickers([]);
    setPortfolio({});
  };

  const handleManualBackup = async () => {
    const ok = await syncToFirebase(customTickers, portfolio);
    if (ok) {
      alert("클라우드 백업이 정상적으로 완료되었습니다!");
    }
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
      {syncError && (
        <div className="error-banner" style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', padding: '10px 20px', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{syncError}</span>
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
              onClick={handleManualBackup}
              className="portfolio-btn glass sync-btn"
              disabled={isSyncing}
              title={lastSyncTime ? `마지막 백업: ${lastSyncTime}` : '클라우드에 백업'}
              style={{ padding: '0.5rem 0.85rem' }}
            >
              <Cloud size={16} color={isSyncing ? 'var(--text-secondary)' : '#4285F4'} className={isSyncing ? 'sync-spin' : ''} />
              <span style={{ fontSize: '0.82rem' }}>{isSyncing ? '백업 중...' : '클라우드 백업'}</span>
            </button>
          )}

          {/* Login / Logout Button */}
          {userProfile ? (
            <button onClick={handleLogout} className="portfolio-btn glass logout-btn" style={{ padding: '0.5rem 0.85rem' }}>
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
          {userProfile && (
            <button 
              onClick={() => setIsModalOpen(true)}
              className="portfolio-btn glass"
              style={{ padding: '0.5rem 0.85rem' }}
            >
              <Briefcase size={16} />
              <span style={{ fontSize: '0.82rem' }}>My Portfolio</span>
            </button>
          )}
        </div>
      </header>

      <ExchangeRateBar onRateClick={(ticker, title) => setSelectedExchangeRate({ ticker, title })} />

      <SearchBar onAddTicker={handleAddTicker} />

      <div className="dashboard-grid">
        {/* Render default indices */}
        {defaultIndices.map((idx) => (
          <StockChart
            key={idx.ticker}
            ticker={idx.ticker}
            title={idx.title}
            color={idx.color}
            onAddToPortfolio={userProfile ? handleAddToPortfolio : undefined}
            onRemoveFromPortfolio={userProfile ? handleRemoveFromPortfolio : undefined}
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
            onAddToPortfolio={userProfile ? handleAddToPortfolio : undefined}
            onRemoveFromPortfolio={userProfile ? handleRemoveFromPortfolio : undefined}
            isInPortfolio={portfolio[ticker] !== undefined}
          />
        ))}
      </div>

      {userProfile && isModalOpen && (
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

      {selectedExchangeRate && (
        <div className="modal-backdrop" onClick={() => setSelectedExchangeRate(null)}>
          <div className="modal-content exchange-rate-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '750px', height: '600px' }}>
            <button className="modal-close-btn" onClick={() => setSelectedExchangeRate(null)} aria-label="Close modal">
              <X size={20} />
            </button>
            <div className="modal-header">
              <h2>{selectedExchangeRate.title} 상세 차트</h2>
            </div>
            <div className="modal-body" style={{ flex: 1, minHeight: 0, marginTop: '1rem' }}>
              <StockChart
                ticker={selectedExchangeRate.ticker}
                title={selectedExchangeRate.title}
                color="var(--accent-color)"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
