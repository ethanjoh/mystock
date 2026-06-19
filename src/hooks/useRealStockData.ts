import { useState, useEffect } from 'react';

export type TimeRange = '5y' | '3y' | '1y' | '6mo' | '1mo' | '1w' | '1d' | '1h';

export interface DataPoint {
  time: string;
  value: number; // close price
  open: number;
  high: number;
  low: number;
  close: number;
}

export const useRealStockData = (ticker: string, range: TimeRange = '5y') => {
  const [data, setData] = useState<DataPoint[]>([]);
  const [currentValue, setCurrentValue] = useState(0);
  const [change, setChange] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [companyName, setCompanyName] = useState('');

  // Map logical range to Yahoo Finance parameters
  const getParams = () => {
    switch (range) {
      case '5y':
        return { apiRange: '5y', apiInterval: '1wk', sliceCount: null, isIntraday: false };
      case '3y':
        // Fetch 5y weekly and slice last 3 years (156 weeks)
        return { apiRange: '5y', apiInterval: '1wk', sliceCount: 156, isIntraday: false };
      case '1y':
        return { apiRange: '1y', apiInterval: '1d', sliceCount: null, isIntraday: false };
      case '6mo':
        return { apiRange: '6mo', apiInterval: '1d', sliceCount: null, isIntraday: false };
      case '1mo':
        return { apiRange: '1mo', apiInterval: '1d', sliceCount: null, isIntraday: false };
      case '1w':
        return { apiRange: '5d', apiInterval: '30m', sliceCount: null, isIntraday: true };
      case '1d':
        return { apiRange: '1d', apiInterval: '2m', sliceCount: null, isIntraday: true };
      case '1h':
        // Fetch 1d at 1m interval and slice last 60 minutes
        return { apiRange: '1d', apiInterval: '1m', sliceCount: 60, isIntraday: true };
      default:
        return { apiRange: '5y', apiInterval: '1wk', sliceCount: null, isIntraday: false };
    }
  };

  const getPollingInterval = () => {
    if (range === '1d' || range === '1h') return 10000; // 10 seconds for intraday
    if (range === '1w') return 60000; // 1 minute
    return 300000; // 5 minutes for historical
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    if (range === '1h' || range === '1d') {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    if (range === '1w') {
      return (
        date.toLocaleDateString([], { month: '2-digit', day: '2-digit' }) +
        ' ' +
        date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      );
    }
    if (range === '1mo' || range === '6mo') {
      return date.toLocaleDateString([], { month: '2-digit', day: '2-digit' });
    }
    return date.toLocaleDateString([], { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  const fetchData = async () => {
    try {
      const { apiRange, apiInterval, sliceCount } = getParams();
      
      const response = await fetch(
        `/api/finance/chart/${encodeURIComponent(ticker)}?interval=${apiInterval}&range=${apiRange}`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const json = await response.json();
      
      if (json.chart?.error) {
        throw new Error(json.chart.error.description || 'Unknown API error');
      }

      const result = json.chart?.result?.[0];
      if (!result) {
        throw new Error('No data returned from API');
      }

      // Extract metadata
      const name = result.meta?.longName || result.meta?.shortName || ticker;
      setCompanyName(name);

      let timestamps: number[] = result.timestamp || [];
      let quotes: (number | null)[] = result.indicators?.quote?.[0]?.close || [];
      let opens: (number | null)[] = result.indicators?.quote?.[0]?.open || [];
      let highs: (number | null)[] = result.indicators?.quote?.[0]?.high || [];
      let lows: (number | null)[] = result.indicators?.quote?.[0]?.low || [];
      
      const chartPreviousClose = result.meta?.chartPreviousClose || result.meta?.previousClose || 0;

      // Slice data if custom slicing is needed (3y or 1h)
      if (sliceCount && timestamps.length > sliceCount) {
        timestamps = timestamps.slice(-sliceCount);
        quotes = quotes.slice(-sliceCount);
        opens = opens.slice(-sliceCount);
        highs = highs.slice(-sliceCount);
        lows = lows.slice(-sliceCount);
      }

      // Filter and align values, keeping structure intact
      const formattedData: DataPoint[] = [];
      let lastValidOpen = chartPreviousClose;
      let lastValidHigh = chartPreviousClose;
      let lastValidLow = chartPreviousClose;
      let lastValidClose = chartPreviousClose;

      for (let i = 0; i < timestamps.length; i++) {
        const o = opens[i];
        const h = highs[i];
        const l = lows[i];
        const c = quotes[i];
        
        if (o !== null && o !== undefined) lastValidOpen = o;
        if (h !== null && h !== undefined) lastValidHigh = h;
        if (l !== null && l !== undefined) lastValidLow = l;
        if (c !== null && c !== undefined) lastValidClose = c;
        
        formattedData.push({
          time: formatTimestamp(timestamps[i]),
          value: Number(lastValidClose.toFixed(2)),
          open: Number(lastValidOpen.toFixed(2)),
          high: Number(lastValidHigh.toFixed(2)),
          low: Number(lastValidLow.toFixed(2)),
          close: Number(lastValidClose.toFixed(2)),
        });
      }

      if (formattedData.length > 0) {
        const latestVal = formattedData[formattedData.length - 1].value;
        setCurrentValue(latestVal);
        
        // Calculate change compared to range's starting point (or previous close for intraday 1d)
        if (range === '1d' || range === '1h') {
          if (chartPreviousClose) {
            setChange(latestVal - chartPreviousClose);
          } else {
            setChange(latestVal - formattedData[0].value);
          }
        } else {
          // For historical ranges, show growth/decline since start of selected period
          setChange(latestVal - formattedData[0].value);
        }
        
        setData(formattedData);
      } else {
        setData([]);
      }
      
      setError(null);
    } catch (err: any) {
      console.error(`Error fetching data for ${ticker}:`, err);
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchData();

    const intervalId = setInterval(() => {
      fetchData();
    }, getPollingInterval());

    return () => clearInterval(intervalId);
  }, [ticker, range]); // Refetch when ticker or range changes

  return { data, currentValue, change, loading, error, companyName };
};
