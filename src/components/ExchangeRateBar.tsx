// 원/달러 및 원/엔 실시간 환율 정보를 제공하는 상단 바 컴포넌트
import React, { useState, useEffect } from 'react';
import { useRealStockData } from '../hooks/useRealStockData';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface ExchangeRateBarProps {
  onRateClick: (ticker: string, title: string) => void;
}

export const ExchangeRateBar: React.FC<ExchangeRateBarProps> = ({ onRateClick }) => {
  const usd = useRealStockData('USDKRW=X', '1d');
  const jpy = useRealStockData('JPYKRW=X', '1d');

  // open.er-api.com을 통한 안정적인 환율 폴백 데이터 (CORS 완전 지원)
  const [erRates, setErRates] = useState<{ usd: number; jpy: number } | null>(null);
  const [erLoading, setErLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchErRates = async () => {
      try {
        const res = await fetch('https://open.er-api.com/v6/latest/USD');
        if (!res.ok) return;
        const data = await res.json();
        if (isMounted && data.result === 'success' && data.rates?.KRW) {
          const usdVal = data.rates.KRW;
          const jpyVal = (data.rates.KRW / (data.rates.JPY || 1)) * 100;
          setErRates({ usd: usdVal, jpy: jpyVal });
        }
      } catch (e) {
        console.warn('Fallback exchange rate fetch failed:', e);
      } finally {
        if (isMounted) setErLoading(false);
      }
    };

    fetchErRates();
    const timer = setInterval(fetchErRates, 60000); // 1분 주기 갱신
    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, []);

  const getPercentage = (current: number, change: number) => {
    if (current === 0) return 0;
    return (change / (current - change)) * 100;
  };

  // Yahoo Finance 실시간 데이터 우선 사용 (오프라인 모드가 아닐 때), 오류 또는 오프라인 시 open.er-api 데이터 사용
  const hasUsdStockData = usd.currentValue > 0 && !usd.error && !usd.isOffline;
  const usdValue = hasUsdStockData ? usd.currentValue : (erRates?.usd ?? 0);
  const usdChange = hasUsdStockData ? usd.change : 0;
  const usdPercentage = getPercentage(usdValue, usdChange);
  const isUsdPositive = usdChange >= 0;

  const hasJpyStockData = jpy.currentValue > 0 && !jpy.error && !jpy.isOffline;
  const jpyValue = hasJpyStockData ? (jpy.currentValue * 100) : (erRates?.jpy ?? 0);
  const jpyChange = hasJpyStockData ? (jpy.change * 100) : 0;
  const jpyPercentage = getPercentage(jpyValue, jpyChange);
  const isJpyPositive = jpyChange >= 0;

  const isUsdLoading = usd.loading && erLoading;
  const isUsdError = usd.error && !erRates;

  const isJpyLoading = jpy.loading && erLoading;
  const isJpyError = jpy.error && !erRates;

  return (
    <div className="exchange-rate-bar glass">
      <div className="rate-item" onClick={() => onRateClick('USDKRW=X', '원/달러 (USD/KRW)')}>
        <span className="rate-flag-icon">💵</span>
        <span className="rate-label">원/달러 (USD/KRW)</span>
        {isUsdLoading ? (
          <span className="rate-loading">로딩 중...</span>
        ) : isUsdError ? (
          <span className="rate-error">에러</span>
        ) : (
          <div className="rate-values">
            <span className="rate-price">
              {usdValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}원
            </span>
            {hasUsdStockData ? (
              <span className={`rate-change ${isUsdPositive ? 'change-positive' : 'change-negative'}`}>
                {isUsdPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                <span>
                  {isUsdPositive ? '+' : ''}
                  {usdChange.toFixed(0)} ({isUsdPositive ? '+' : ''}
                  {usdPercentage.toFixed(2)}%)
                </span>
              </span>
            ) : (
              <span className="rate-live-badge" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginLeft: '4px' }}>
                (실시간 기준)
              </span>
            )}
          </div>
        )}
      </div>

      <div className="rate-divider"></div>

      <div className="rate-item" onClick={() => onRateClick('JPYKRW=X', '원/100엔 (JPY/KRW)')}>
        <span className="rate-flag-icon">💴</span>
        <span className="rate-label">원/100엔 (JPY/KRW)</span>
        {isJpyLoading ? (
          <span className="rate-loading">로딩 중...</span>
        ) : isJpyError ? (
          <span className="rate-error">에러</span>
        ) : (
          <div className="rate-values">
            <span className="rate-price">
              {jpyValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}원
            </span>
            {hasJpyStockData ? (
              <span className={`rate-change ${isJpyPositive ? 'change-positive' : 'change-negative'}`}>
                {isJpyPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                <span>
                  {isJpyPositive ? '+' : ''}
                  {jpyChange.toFixed(0)} ({isJpyPositive ? '+' : ''}
                  {jpyPercentage.toFixed(2)}%)
                </span>
              </span>
            ) : (
              <span className="rate-live-badge" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginLeft: '4px' }}>
                (실시간 기준)
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
