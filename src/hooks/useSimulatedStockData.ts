import { useState, useEffect } from 'react';

export interface DataPoint {
  time: string;
  value: number;
}

export const useSimulatedStockData = (initialValue: number, volatility: number = 0.002, updateInterval: number = 2000) => {
  const [data, setData] = useState<DataPoint[]>([]);
  const [currentValue, setCurrentValue] = useState(initialValue);
  const [change, setChange] = useState(0);

  useEffect(() => {
    // Generate initial historical data (last 30 points)
    const initialData: DataPoint[] = [];
    let val = initialValue;
    const now = new Date();
    
    for (let i = 30; i >= 0; i--) {
      const time = new Date(now.getTime() - i * updateInterval);
      initialData.push({
        time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        value: Number(val.toFixed(2))
      });
      // Random walk
      const changePercent = (Math.random() - 0.5) * 2 * volatility;
      val = val * (1 + changePercent);
    }
    
    setData(initialData);
    setCurrentValue(initialData[initialData.length - 1].value);
    
    const initialChange = initialData[initialData.length - 1].value - initialData[initialData.length - 2].value;
    setChange(initialChange);

  }, [initialValue, volatility, updateInterval]);

  useEffect(() => {
    if (data.length === 0) return;

    const intervalId = setInterval(() => {
      setData(prevData => {
        const lastVal = prevData[prevData.length - 1].value;
        const changePercent = (Math.random() - 0.5) * 2 * volatility;
        const newVal = Number((lastVal * (1 + changePercent)).toFixed(2));
        
        setCurrentValue(newVal);
        setChange(newVal - lastVal);

        const newTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        
        const newData = [...prevData.slice(1), { time: newTime, value: newVal }];
        return newData;
      });
    }, updateInterval);

    return () => clearInterval(intervalId);
  }, [data.length, volatility, updateInterval]);

  return { data, currentValue, change };
};
