// Yahoo Finance API 호출을 위한 프록시 연결 및 오프라인 폴백 처리 유틸리티

export interface FallbackStockInfo {
  name: string;
  basePrice: number;
}

const DEFAULT_INDEX_INFO: Record<string, FallbackStockInfo> = {
  '^KS11': { name: 'KOSPI', basePrice: 2650 },
  '^KQ11': { name: 'KOSDAQ', basePrice: 860 },
  '^IXIC': { name: 'NASDAQ', basePrice: 17800 },
  '^GSPC': { name: 'S&P 500', basePrice: 5600 },
  'USDKRW=X': { name: '원/달러 환율', basePrice: 1345 },
  'JPYKRW=X': { name: '원/엔 환율', basePrice: 8.75 },
};

/**
 * 환경 설정에 따라 금융 데이터를 페치할 프록시 URL 목록을 생성합니다.
 */
export function getProxyCandidateUrls(ticker: string, queryParams: string): string[] {
  const isDev = import.meta.env.DEV;
  const targetPath = `chart/${encodeURIComponent(ticker)}?${queryParams}`;
  const targetFullUrl = `https://query1.finance.yahoo.com/v8/finance/${targetPath}`;

  if (isDev) {
    return [`/api/finance/${targetPath}`];
  }

  // 사용자가 자체 Cloudflare Worker 또는 프록시를 설정한 경우 최우선 사용
  const customProxy = import.meta.env.VITE_FINANCE_PROXY_URL;
  if (customProxy) {
    const trimmed = customProxy.trim();
    if (trimmed.endsWith('=')) {
      return [`${trimmed}${encodeURIComponent(targetFullUrl)}`];
    }
    if (trimmed.endsWith('/')) {
      return [`${trimmed}${targetFullUrl}`];
    }
    return [`${trimmed}/${targetFullUrl}`];
  }

  // 브라우저 프로덕션 환경의 대체 공용 프록시 체인
  return [
    `https://corsproxy.org/?${encodeURIComponent(targetFullUrl)}`,
    `https://cors.eu.org/${targetFullUrl}`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(targetFullUrl)}`
  ];
}

/**
 * 프록시를 순회하며 데이터를 페치합니다.
 */
export async function fetchWithProxyFallback(ticker: string, queryParams: string): Promise<any> {
  const urls = getProxyCandidateUrls(ticker, queryParams);
  let lastError: Error | null = null;

  for (const url of urls) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json'
        }
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP status ${response.status}`);
      }

      const json = await response.json();
      if (json.chart?.result?.[0]) {
        return json;
      }
    } catch (err: any) {
      lastError = err;
    }
  }

  throw lastError || new Error('All proxies failed to fetch');
}

/**
 * 네트워크나 프록시가 모두 차단된 경우를 위한 현실적인 시뮬레이션 데이터 생성기
 */
export function generateOfflineData(ticker: string, range: string) {
  const info = DEFAULT_INDEX_INFO[ticker] || { name: ticker, basePrice: 1000 };
  const basePrice = info.basePrice;
  const name = info.name;

  let count = 30;
  let intervalMs = 24 * 60 * 60 * 1000;

  switch (range) {
    case '5y':
      count = 60;
      intervalMs = 30 * 24 * 60 * 60 * 1000;
      break;
    case '3y':
      count = 36;
      intervalMs = 30 * 24 * 60 * 60 * 1000;
      break;
    case '1y':
      count = 52;
      intervalMs = 7 * 24 * 60 * 60 * 1000;
      break;
    case '6mo':
      count = 26;
      intervalMs = 7 * 24 * 60 * 60 * 1000;
      break;
    case '1mo':
      count = 30;
      intervalMs = 24 * 60 * 60 * 1000;
      break;
    case '1w':
      count = 20;
      intervalMs = 4 * 60 * 60 * 1000;
      break;
    case '1d':
    case '1h':
      count = 24;
      intervalMs = 5 * 60 * 1000;
      break;
  }

  const now = Date.now();
  let currentVal = basePrice * (1 + (Math.sin(ticker.length) * 0.05));
  const points = [];

  for (let i = count; i >= 0; i--) {
    const timestamp = Math.floor((now - i * intervalMs) / 1000);
    const date = new Date(timestamp * 1000);
    
    // 일정한 변동성 부여
    const delta = (Math.sin(i * 0.7 + ticker.charCodeAt(0)) * 0.015) + ((Math.random() - 0.49) * 0.01);
    currentVal = currentVal * (1 + delta);

    const open = currentVal * (1 - (Math.random() - 0.5) * 0.005);
    const close = currentVal;
    const high = Math.max(open, close) * (1 + Math.random() * 0.006);
    const low = Math.min(open, close) * (1 - Math.random() * 0.006);

    let timeStr = '';
    if (range === '1h' || range === '1d') {
      timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (range === '1w') {
      timeStr = `${date.toLocaleDateString([], { month: '2-digit', day: '2-digit' })} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (range === '1mo' || range === '6mo') {
      timeStr = date.toLocaleDateString([], { month: '2-digit', day: '2-digit' });
    } else {
      timeStr = date.toLocaleDateString([], { year: 'numeric', month: '2-digit', day: '2-digit' });
    }

    points.push({
      time: timeStr,
      value: Number(close.toFixed(2)),
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
    });
  }

  const latest = points[points.length - 1].value;
  const initial = points[0].value;
  const change = latest - initial;

  return {
    name,
    data: points,
    currentValue: latest,
    change,
  };
}
