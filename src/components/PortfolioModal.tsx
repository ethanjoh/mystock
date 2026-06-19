import React, { useState } from 'react';
import { X, Trash2, TrendingUp, Briefcase } from 'lucide-react';
import { useRealStockData } from '../hooks/useRealStockData';
import { PortfolioAnalysis } from './PortfolioAnalysis';

interface PortfolioModalProps {
  portfolio: { [ticker: string]: number };
  onClose: () => void;
  onUpdateQuantity: (ticker: string, qty: number) => void;
  onRemoveTicker: (ticker: string) => void;
}

interface PortfolioItemProps {
  ticker: string;
  quantity: number;
  exchangeRate: number;
  onUpdateQuantity: (qty: number) => void;
  onRemove: () => void;
}

const PortfolioItem: React.FC<PortfolioItemProps> = ({ 
  ticker, 
  quantity, 
  exchangeRate, 
  onUpdateQuantity, 
  onRemove 
}) => {
  const { currentValue, companyName, loading } = useRealStockData(ticker, '1d');
  const isKorean = ticker.endsWith('.KS') || ticker.endsWith('.KQ') || ticker === '^KS11' || ticker === '^KQ11';
  
  const priceInKRW = isKorean ? currentValue : currentValue * exchangeRate;
  const totalValueInKRW = priceInKRW * quantity;

  return (
    <div className="portfolio-item glass">
      <div className="item-info">
        <div className="item-name" title={companyName || ticker}>
          {loading ? 'Loading...' : (companyName || ticker)}
        </div>
        <div className="item-ticker">{ticker}</div>
      </div>
      
      <div className="item-price-wrapper">
        <span className="item-label">Price</span>
        <span className="item-value">
          {loading ? '---' : (isKorean 
            ? `₩${Math.round(currentValue).toLocaleString()}` 
            : `$${currentValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
          )}
        </span>
      </div>

      <div className="item-total-wrapper">
        <span className="item-label">Total Value (KRW)</span>
        <span className="item-value-krw">
          {loading ? '---' : `₩${Math.round(totalValueInKRW).toLocaleString()}`}
        </span>
      </div>

      <div className="item-qty-wrapper">
        <span className="item-label">Quantity</span>
        <input 
          type="number" 
          value={quantity === 0 ? '' : quantity} 
          onChange={(e) => onUpdateQuantity(Math.max(0, Number(e.target.value)))} 
          className="item-qty-input"
          min="0"
          placeholder="0"
        />
      </div>

      <button onClick={onRemove} className="item-delete-btn" title="Remove stock">
        <Trash2 size={16} />
      </button>
    </div>
  );
};

export const PortfolioModal: React.FC<PortfolioModalProps> = ({
  portfolio,
  onClose,
  onUpdateQuantity,
  onRemoveTicker
}) => {
  const [showAnalysis, setShowAnalysis] = useState(false);
  
  // Fetch dynamic exchange rate
  const usdKrw = useRealStockData('USDKRW=X', '1d');
  const exchangeRate = usdKrw.currentValue || 1350;


  return (
    <div className="modal-backdrop">
      <div className="modal-content glass">
        <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
          <X size={20} />
        </button>

        {showAnalysis ? (
          <PortfolioAnalysis 
            portfolio={portfolio} 
            exchangeRate={exchangeRate} 
            onBack={() => setShowAnalysis(false)} 
          />
        ) : (
          <>
            <div className="modal-header">
              <Briefcase size={24} color="var(--accent-color)" />
              <h2>My Portfolio</h2>
            </div>

            <div className="exchange-rate-banner glass">
              <span>Exchange Rate: 1 USD = <strong>{exchangeRate.toLocaleString(undefined, { minimumFractionDigits: 2 })} KRW</strong></span>
            </div>

            {Object.keys(portfolio).length === 0 ? (
              <div className="empty-portfolio">
                <p>Your portfolio is currently empty.</p>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  Click "+ Portfolio" on any stock chart to add it.
                </p>
              </div>
            ) : (
              <>
                <div className="portfolio-list">
                  {Object.keys(portfolio).map((ticker) => (
                    <PortfolioItem
                      key={ticker}
                      ticker={ticker}
                      quantity={portfolio[ticker]}
                      exchangeRate={exchangeRate}
                      onUpdateQuantity={(qty) => onUpdateQuantity(ticker, qty)}
                      onRemove={() => onRemoveTicker(ticker)}
                    />
                  ))}
                </div>

                <div className="modal-footer">
                  <button 
                    className="analysis-trigger-btn"
                    onClick={() => setShowAnalysis(true)}
                  >
                    <TrendingUp size={18} />
                    <span>Portfolio Analysis</span>
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};
