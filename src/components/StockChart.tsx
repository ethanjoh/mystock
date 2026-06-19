import React, { useState } from 'react';
import { ComposedChart, Area, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Activity, X } from 'lucide-react';
import { useRealStockData } from '../hooks/useRealStockData';
import type { TimeRange } from '../hooks/useRealStockData';

interface StockChartProps {
  ticker: string;
  title: string;
  color: string;
  onRemove?: () => void;
  onAddToPortfolio?: (ticker: string) => void;
  onRemoveFromPortfolio?: (ticker: string) => void;
  isInPortfolio?: boolean;
}

const CustomTooltip = ({ active, payload, label, chartType, ticker }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const isKoreanMarket = ticker.endsWith('.KS') || ticker.endsWith('.KQ') || ticker === '^KS11' || ticker === '^KQ11';
    
    if (chartType === 'candle') {
      const isUp = data.close >= data.open;
      const upColor = isKoreanMarket ? 'var(--color-sp500)' : 'var(--color-nasdaq)';
      const downColor = isKoreanMarket ? 'var(--color-kospi)' : 'var(--color-sp500)';
      const colorStyle = { color: isUp ? upColor : downColor, fontWeight: 700 };

      return (
        <div className="custom-tooltip">
          <p className="label">{label}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.85rem' }}>
            <div>Open: <span style={{ fontWeight: 600 }}>{data.open.toLocaleString()}</span></div>
            <div>High: <span style={{ fontWeight: 600, color: 'var(--color-nasdaq)' }}>{data.high.toLocaleString()}</span></div>
            <div>Low: <span style={{ fontWeight: 600, color: 'var(--color-sp500)' }}>{data.low.toLocaleString()}</span></div>
            <div>Close: <span style={colorStyle}>{data.close.toLocaleString()}</span></div>
          </div>
        </div>
      );
    }
    
    return (
      <div className="custom-tooltip">
        <p className="label">{label}</p>
        <p className="value" style={{ color: payload[0].color || 'var(--accent-color)' }}>
          {payload[0].value.toFixed(2)}
        </p>
      </div>
    );
  }
  return null;
};


export const StockChart: React.FC<StockChartProps> = ({ 
  ticker, 
  title, 
  color, 
  onRemove, 
  onAddToPortfolio, 
  onRemoveFromPortfolio, 
  isInPortfolio 
}) => {
  const [selectedRange, setSelectedRange] = useState<TimeRange>('5y');
  const [chartType, setChartType] = useState<'line' | 'candle'>('line');
  const { data, currentValue, change, loading, error, companyName } = useRealStockData(ticker, selectedRange);
  
  const isPositive = change >= 0;
  const changePercentage = currentValue !== 0 ? (change / (currentValue - change)) * 100 : 0;

  // Determine domain for Y axis to make chart look better
  const minVal = data.length > 0 ? Math.min(...data.map(d => d.low)) : 0;
  const maxVal = data.length > 0 ? Math.max(...data.map(d => d.high)) : 100;
  const padding = (maxVal - minVal) * 0.1 || 10;

  const ranges: TimeRange[] = ['5y', '3y', '1y', '6mo', '1mo', '1w', '1d', '1h'];

  // Localized color logic
  const getCandleColor = (entry: any) => {
    const isKoreanMarket = ticker.endsWith('.KS') || ticker.endsWith('.KQ') || ticker === '^KS11' || ticker === '^KQ11';
    const isUp = entry.close >= entry.open;
    const upColor = isKoreanMarket ? 'var(--color-sp500)' : 'var(--color-nasdaq)';
    const downColor = isKoreanMarket ? 'var(--color-kospi)' : 'var(--color-sp500)';
    return isUp ? upColor : downColor;
  };

  // Map data to range format that Recharts understands for custom bar positioning
  const chartData = data.map(d => ({
    ...d,
    openClose: [Math.min(d.open, d.close), Math.max(d.open, d.close)],
    highLow: [d.low, d.high]
  }));

  return (
    <div className="chart-card glass">
      {onRemove && (
        <button onClick={onRemove} className="remove-chart-btn" aria-label="Remove stock chart">
          <X size={16} />
        </button>
      )}
      <div className="chart-header">
        <div className="chart-header-left">
          <h2 className="chart-title">
            <Activity size={20} color={color} />
            <span className="title-text chart-title-text">
              {loading ? title : (companyName || title)}
            </span>
            <span className="ticker-label" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginLeft: '6px', fontWeight: 'normal' }}>
              ({ticker})
            </span>
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px', flexWrap: 'wrap' }}>
            <div className="chart-value">
              {loading ? '---' : currentValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            {onAddToPortfolio && !loading && !error && (
              isInPortfolio ? (
                <button 
                  onClick={() => onRemoveFromPortfolio?.(ticker)}
                  className="remove-from-portfolio-btn"
                  title="Remove from Portfolio"
                >
                  포트폴리오에서 삭제
                </button>
              ) : (
                <button 
                  onClick={() => onAddToPortfolio(ticker)}
                  className="add-to-portfolio-btn"
                  title="Add to Portfolio"
                >
                  포트폴리오에 담기
                </button>
              )
            )}
          </div>
        </div>
        
        <div className="chart-header-right">
          {!loading && !error && (
            <div className={`chart-change ${isPositive ? 'change-positive' : 'change-negative'}`}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                {isPositive ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                <span>{isPositive ? '+' : ''}{change.toFixed(2)} ({isPositive ? '+' : ''}{changePercentage.toFixed(2)}%)</span>
              </div>
            </div>
          )}
          
          <div className="chart-type-selector">
            <button 
              className={`type-btn ${chartType === 'line' ? 'active' : ''}`}
              onClick={() => setChartType('line')}
            >
              Line
            </button>
            <button 
              className={`type-btn ${chartType === 'candle' ? 'active' : ''}`}
              onClick={() => setChartType('candle')}
            >
              Candle
            </button>
          </div>
        </div>
      </div>

      <div className="range-selector-row">
        {ranges.map((r) => (
          <button
            key={r}
            className={`range-btn ${selectedRange === r ? 'active' : ''}`}
            onClick={() => setSelectedRange(r)}
            style={selectedRange === r ? { borderColor: color, color: color, boxShadow: `0 0 8px ${color}33` } : {}}
          >
            {r.toUpperCase()}
          </button>
        ))}
      </div>
      
      <div className="chart-body" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '10px' }}>
        {loading ? (
          <div style={{ color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <div className="spinner" style={{ width: '24px', height: '24px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.1)', borderTopColor: color, animation: 'spin 1s linear infinite' }} />
            <span>Loading...</span>
          </div>
        ) : error ? (
          <div style={{ color: 'var(--color-sp500)', fontSize: '0.9rem', textAlign: 'center', padding: '1rem' }}>
            {error}
          </div>
        ) : chartData.length === 0 ? (
          <div style={{ color: 'var(--text-secondary)' }}>No data available</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart barGap="-100%" data={chartData} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id={`color-${title}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={color} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis 
                dataKey="time" 
                stroke="var(--text-secondary)" 
                tick={{ fontSize: 11 }} 
                tickLine={false}
                axisLine={false}
                minTickGap={40}
              />
              <YAxis 
                domain={[minVal - padding, maxVal + padding]} 
                stroke="var(--text-secondary)" 
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => val.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              />
              <Tooltip content={<CustomTooltip chartType={chartType} ticker={ticker} />} />
              {chartType === 'line' ? (
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke={color} 
                  strokeWidth={2.5}
                  fillOpacity={1} 
                  fill={`url(#color-${title})`} 
                  isAnimationActive={false}
                />
              ) : (
                [
                  /* Wick (High-Low) */
                  <Bar
                    key="wick"
                    dataKey="highLow"
                    barSize={2}
                    isAnimationActive={false}
                  >
                    {chartData.map((entry, idx) => (
                      <Cell key={`wick-${idx}`} fill={getCandleColor(entry)} />
                    ))}
                  </Bar>,
                  /* Body (Open-Close) */
                  <Bar
                    key="body"
                    dataKey="openClose"
                    barSize={8}
                    isAnimationActive={false}
                  >
                    {chartData.map((entry, idx) => (
                      <Cell key={`body-${idx}`} fill={getCandleColor(entry)} />
                    ))}
                  </Bar>
                ]
              )}
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
