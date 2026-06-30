// 원/달러 및 원/엔 실시간 환율 정보를 제공하는 상단 바 컴포넌트
import React from 'react';
import { useRealStockData } from '../hooks/useRealStockData';
import { TrendingUp, TrendingDown } from 'lucide-react';

export const ExchangeRateBar: React.FC = () => {
  const usd = useRealStockData('USDKRW=X', '1d');
  const jpy = useRealStockData('JPYKRW=X', '1d');

  const getPercentage = (current: number, change: number) => {
    if (current === 0) return 0;
    return (change / (current - change)) * 100;
  };

  const usdValue = usd.currentValue;
  const usdChange = usd.change;
  const usdPercentage = getPercentage(usdValue, usdChange);
  const isUsdPositive = usdChange >= 0;

  // JPYKRW=X는 1엔당 가격이므로 100엔당 가격으로 환산하여 표시
  const jpyValue = jpy.currentValue * 100;
  const jpyChange = jpy.change * 100;
  const jpyPercentage = getPercentage(jpyValue, jpyChange);
  const isJpyPositive = jpyChange >= 0;

  return (
    <div className="exchange-rate-bar glass">
      <div className="rate-item">
        <span className="rate-flag-icon">💵</span>
        <span className="rate-label">원/달러 (USD/KRW)</span>
        {usd.loading ? (
          <span className="rate-loading">로딩 중...</span>
        ) : usd.error ? (
          <span className="rate-error">에러</span>
        ) : (
          <div className="rate-values">
            <span className="rate-price">
              {usdValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}원
            </span>
            <span className={`rate-change ${isUsdPositive ? 'change-positive' : 'change-negative'}`}>
              {isUsdPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              <span>
                {isUsdPositive ? '+' : ''}
                {usdChange.toFixed(2)} ({isUsdPositive ? '+' : ''}
                {usdPercentage.toFixed(2)}%)
              </span>
            </span>
          </div>
        )}
      </div>

      <div className="rate-divider"></div>

      <div className="rate-item">
        <span className="rate-flag-icon">💴</span>
        <span className="rate-label">원/100엔 (JPY/KRW)</span>
        {jpy.loading ? (
          <span className="rate-loading">로딩 중...</span>
        ) : jpy.error ? (
          <span className="rate-error">에러</span>
        ) : (
          <div className="rate-values">
            <span className="rate-price">
              {jpyValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}원
            </span>
            <span className={`rate-change ${isJpyPositive ? 'change-positive' : 'change-negative'}`}>
              {isJpyPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              <span>
                {isJpyPositive ? '+' : ''}
                {jpyChange.toFixed(2)} ({isJpyPositive ? '+' : ''}
                {jpyPercentage.toFixed(2)}%)
              </span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
