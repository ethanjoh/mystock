import React, { useState, useEffect } from 'react';
import { ArrowLeft, TrendingUp, TrendingDown } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface PortfolioAnalysisProps {
  portfolio: { [ticker: string]: number };
  exchangeRate: number;
  onBack: () => void;
}

interface BacktrackPoint {
  time: string;
  value: number;
}

type SimulationRange = '10y' | '7y' | '5y' | '3y' | '1y' | '6mo';

export const PortfolioAnalysis: React.FC<PortfolioAnalysisProps> = ({
  portfolio,
  onBack
}) => {
  const [selectedRange, setSelectedRange] = useState<SimulationRange>('5y');
  const [simData, setSimData] = useState<BacktrackPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistoricalData = async (ticker: string) => {
    // Fetch 10 years of weekly data
    const isDev = import.meta.env.DEV;
    const baseUrl = isDev 
      ? '/api/finance' 
      : 'https://corsproxy.io/?https://query1.finance.yahoo.com/v8/finance';

    const response = await fetch(`${baseUrl}/chart/${encodeURIComponent(ticker)}?interval=1wk&range=10y`);
    if (!response.ok) {
      throw new Error(`Failed to fetch historical data for ${ticker}`);
    }
    const json = await response.json();
    if (json.chart?.error) {
      throw new Error(json.chart.error.description || 'Unknown API error');
    }
    return json.chart.result?.[0];
  };

  const getPriceAtTimestamp = (result: any, t: number) => {
    const timestamps: number[] = result.timestamp || [];
    const closes: (number | null)[] = result.indicators?.quote?.[0]?.close || [];
    
    if (timestamps.length === 0) return 0;
    if (t < timestamps[0]) return 0; // Not yet listed
    
    // Find the last index where timestamps[idx] <= t
    let low = 0;
    let high = timestamps.length - 1;
    let idx = 0;
    
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      if (timestamps[mid] <= t) {
        idx = mid;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }
    
    // Forward fill if the close price is null
    let price = closes[idx];
    let fillIdx = idx;
    while (price === null && fillIdx >= 0) {
      price = closes[fillIdx];
      fillIdx--;
    }
    return price || 0;
  };

  const getRateAtTimestamp = (usdKrwResult: any, t: number) => {
    const price = getPriceAtTimestamp(usdKrwResult, t);
    return price || 1350; // fallback exchange rate
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString([], { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  useEffect(() => {
    const runSimulation = async () => {
      setLoading(true);
      setError(null);
      try {
        const tickers = Object.keys(portfolio);
        if (tickers.length === 0) return;

        // Fetch USD/KRW and all tickers in parallel
        const results = await Promise.all([
          fetchHistoricalData('USDKRW=X'),
          ...tickers.map(ticker => fetchHistoricalData(ticker))
        ]);

        const usdKrwResult = results[0];
        const stockResults = results.slice(1);

        const baseTimestamps: number[] = usdKrwResult.timestamp || [];
        if (baseTimestamps.length === 0) {
          throw new Error('Base timeline has no data points');
        }

        const simulationPoints: BacktrackPoint[] = [];

        // Run weekly simulation over 10 years
        for (let i = 0; i < baseTimestamps.length; i++) {
          const t = baseTimestamps[i];
          let totalValueKRW = 0;

          for (let j = 0; j < tickers.length; j++) {
            const ticker = tickers[j];
            const qty = portfolio[ticker];
            const price = getPriceAtTimestamp(stockResults[j], t);
            
            const isKorean = ticker.endsWith('.KS') || ticker.endsWith('.KQ') || ticker === '^KS11' || ticker === '^KQ11';
            
            if (isKorean) {
              totalValueKRW += qty * price;
            } else {
              const rate = getRateAtTimestamp(usdKrwResult, t);
              totalValueKRW += qty * price * rate;
            }
          }

          simulationPoints.push({
            time: formatTimestamp(t),
            value: Number(totalValueKRW.toFixed(0))
          });
        }

        setSimData(simulationPoints);
      } catch (err: any) {
        console.error('Simulation error:', err);
        setError(err.message || 'Failed to complete simulation');
      } finally {
        setLoading(false);
      }
    };

    runSimulation();
  }, [portfolio]);

  // Dynamic slicing based on chosen range (weekly data points)
  const getSlicedData = () => {
    const weeksInYear = 52;
    switch (selectedRange) {
      case '10y':
        return simData;
      case '7y':
        return simData.slice(-(7 * weeksInYear));
      case '5y':
        return simData.slice(-(5 * weeksInYear));
      case '3y':
        return simData.slice(-(3 * weeksInYear));
      case '1y':
        return simData.slice(-weeksInYear);
      case '6mo':
        return simData.slice(-26);
      default:
        return simData.slice(-(5 * weeksInYear));
    }
  };

  const slicedData = getSlicedData();

  // Metrics calculations
  const getMetrics = () => {
    if (slicedData.length < 2) return { startVal: 0, currentVal: 0, gain: 0, pct: 0 };
    
    const startVal = slicedData[0].value;
    const currentVal = slicedData[slicedData.length - 1].value;
    const gain = currentVal - startVal;
    const pct = startVal !== 0 ? (gain / startVal) * 100 : 0;
    
    return { startVal, currentVal, gain, pct };
  };

  const { startVal, currentVal, gain, pct } = getMetrics();
  const isPositive = gain >= 0;

  const ranges: SimulationRange[] = ['10y', '7y', '5y', '3y', '1y', '6mo'];

  const CustomSimTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="label">{label}</p>
          <p className="value" style={{ color: 'var(--accent-color)' }}>
            ₩{payload[0].value.toLocaleString()}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="portfolio-analysis-container">
      <div className="modal-header">
        <button className="back-btn" onClick={onBack} aria-label="Back to portfolio list">
          <ArrowLeft size={20} />
        </button>
        <h2>Portfolio Analysis</h2>
      </div>

      {loading ? (
        <div className="analysis-loading-wrapper">
          <div className="spinner" style={{ width: '32px', height: '32px', borderRadius: '50%', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--accent-color)', animation: 'spin 1s linear infinite' }} />
          <p style={{ marginTop: '12px' }}>Running 10-Year Backtracking Simulation...</p>
        </div>
      ) : error ? (
        <div className="analysis-error-wrapper">
          <p style={{ color: 'var(--color-sp500)' }}>{error}</p>
          <button className="search-button" style={{ marginTop: '16px' }} onClick={onBack}>
            Back to Holdings
          </button>
        </div>
      ) : simData.length === 0 ? (
        <div className="empty-portfolio">
          <p>No historical data was computed.</p>
        </div>
      ) : (
        <>
          <div className="analysis-metrics-row glass">
            <div className="metric-card">
              <span className="metric-label">Current Evaluation</span>
              <span className="metric-value">₩{currentVal.toLocaleString()}</span>
            </div>
            
            <div className="metric-card">
              <span className="metric-label">Initial Value ({selectedRange.toUpperCase()})</span>
              <span className="metric-value-secondary">₩{startVal.toLocaleString()}</span>
            </div>

            <div className="metric-card">
              <span className="metric-label">Total Gain / Loss</span>
              <span className={`metric-change ${isPositive ? 'change-positive' : 'change-negative'}`}>
                {isPositive ? <TrendingUp size={16} style={{ marginRight: '4px' }} /> : <TrendingDown size={16} style={{ marginRight: '4px' }} />}
                <span>
                  {isPositive ? '+' : ''}{gain.toLocaleString()} ({isPositive ? '+' : ''}{pct.toFixed(2)}%)
                </span>
              </span>
            </div>
          </div>

          <div className="range-selector-row" style={{ marginTop: '1.5rem', marginBottom: '1rem' }}>
            {ranges.map((r) => (
              <button
                key={r}
                className={`range-btn ${selectedRange === r ? 'active' : ''}`}
                onClick={() => setSelectedRange(r)}
                style={selectedRange === r ? { borderColor: 'var(--accent-color)', color: 'var(--accent-color)', boxShadow: '0 0 8px rgba(59, 130, 246, 0.2)' } : {}}
              >
                {r.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="analysis-chart-wrapper">
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={slicedData} margin={{ top: 10, right: 0, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="color-portfolio" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent-color)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--accent-color)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis 
                  dataKey="time" 
                  stroke="var(--text-secondary)" 
                  tick={{ fontSize: 10 }} 
                  tickLine={false}
                  axisLine={false}
                  minTickGap={40}
                />
                <YAxis 
                  domain={['auto', 'auto']}
                  stroke="var(--text-secondary)" 
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => '₩' + (val / 10000).toLocaleString(undefined, { maximumFractionDigits: 0 }) + '만'}
                />
                <Tooltip content={<CustomSimTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="var(--accent-color)" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#color-portfolio)" 
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
};
