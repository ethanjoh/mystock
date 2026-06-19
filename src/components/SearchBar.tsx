import React, { useState } from 'react';
import { Plus, Search } from 'lucide-react';

interface SearchBarProps {
  onAddTicker: (ticker: string) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onAddTicker }) => {
  const [query, setQuery] = useState('');
  const [market, setMarket] = useState<'US' | 'KS' | 'KQ'>('KS');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let cleanQuery = query.trim().toUpperCase();
    if (!cleanQuery) return;

    // Apply suffix automatically based on selected market if not already present
    if (market === 'KS' && !cleanQuery.endsWith('.KS')) {
      cleanQuery = `${cleanQuery}.KS`;
    } else if (market === 'KQ' && !cleanQuery.endsWith('.KQ')) {
      cleanQuery = `${cleanQuery}.KQ`;
    }

    onAddTicker(cleanQuery);
    setQuery('');
  };

  const getPlaceholder = () => {
    switch (market) {
      case 'KS':
        return 'Enter KOSPI code (e.g., 005930, 000660)...';
      case 'KQ':
        return 'Enter KOSDAQ code (e.g., 247540, 293490)...';
      default:
        return 'Enter US stock ticker (e.g., AAPL, TSLA, MSFT)...';
    }
  };

  return (
    <form onSubmit={handleSubmit} className="search-bar-container glass">
      <select 
        value={market} 
        onChange={(e) => setMarket(e.target.value as any)} 
        className="market-select"
      >
        <option value="US">US / NASDAQ</option>
        <option value="KS">KOSPI (KS)</option>
        <option value="KQ">KOSDAQ (KQ)</option>
      </select>
      <div className="search-input-wrapper">
        <Search size={18} className="search-icon" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={getPlaceholder()}
          className="search-input"
        />
      </div>
      <button type="submit" className="search-button">
        <Plus size={18} />
        <span>Add Chart</span>
      </button>
    </form>
  );
};
