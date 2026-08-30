# Graph Report - .  (2026-07-05)

## Corpus Check
- Corpus is ~20,553 words - fits in a single context window. You may not need a graph.

## Summary
- 117 nodes · 125 edges · 16 communities (14 shown, 2 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_TS App Config|TS App Config]]
- [[_COMMUNITY_TS Node Config|TS Node Config]]
- [[_COMMUNITY_Stock Data & UI Components|Stock Data & UI Components]]
- [[_COMMUNITY_Development Dependencies|Development Dependencies]]
- [[_COMMUNITY_Firebase Sync & Dependencies|Firebase Sync & Dependencies]]
- [[_COMMUNITY_Package Metadata & Scripts|Package Metadata & Scripts]]
- [[_COMMUNITY_App Entry & Auth Navigation|App Entry & Auth Navigation]]
- [[_COMMUNITY_Portfolio Analysis Engine|Portfolio Analysis Engine]]
- [[_COMMUNITY_Simulated Stock Data Hook|Simulated Stock Data Hook]]
- [[_COMMUNITY_TS Root Config|TS Root Config]]

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 17 edges
2. `compilerOptions` - 16 edges
3. `useRealStockData()` - 8 edges
4. `scripts` - 5 edges
5. `ExchangeRateBar()` - 3 edges
6. `PortfolioModal()` - 3 edges
7. `StockChart()` - 3 edges
8. `useFirebaseSync()` - 3 edges
9. `firebase` - 2 edges
10. `App()` - 2 edges

## Surprising Connections (you probably didn't know these)
- `PortfolioItem()` --calls--> `useRealStockData()`  [EXTRACTED]
  src/components/PortfolioModal.tsx → src/hooks/useRealStockData.ts
- `App()` --calls--> `useFirebaseSync()`  [EXTRACTED]
  src/App.tsx → src/hooks/useFirebaseSync.ts
- `ExchangeRateBar()` --calls--> `useRealStockData()`  [EXTRACTED]
  src/components/ExchangeRateBar.tsx → src/hooks/useRealStockData.ts
- `PortfolioModal()` --calls--> `useRealStockData()`  [EXTRACTED]
  src/components/PortfolioModal.tsx → src/hooks/useRealStockData.ts
- `StockChart()` --calls--> `useRealStockData()`  [EXTRACTED]
  src/components/StockChart.tsx → src/hooks/useRealStockData.ts

## Import Cycles
- None detected.

## Communities (16 total, 2 thin omitted)

### Community 0 - "TS App Config"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection, moduleResolution (+10 more)

### Community 1 - "TS Node Config"
Cohesion: 0.11
Nodes (17): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, moduleResolution, noEmit (+9 more)

### Community 2 - "Stock Data & UI Components"
Cohesion: 0.19
Nodes (11): ExchangeRateBar(), ExchangeRateBarProps, PortfolioItem(), PortfolioItemProps, PortfolioModal(), PortfolioModalProps, StockChart(), StockChartProps (+3 more)

### Community 3 - "Development Dependencies"
Cohesion: 0.14
Nodes (14): devDependencies, auto-changelog, eslint, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals, @types/node (+6 more)

### Community 4 - "Firebase Sync & Dependencies"
Cohesion: 0.17
Nodes (11): dependencies, firebase, lucide-react, react, react-dom, recharts, firebaseConfig, googleProvider (+3 more)

### Community 5 - "Package Metadata & Scripts"
Cohesion: 0.20
Nodes (9): name, private, scripts, build, dev, lint, preview, type (+1 more)

### Community 6 - "App Entry & Auth Navigation"
Cohesion: 0.27
Nodes (6): App(), LoginModal(), LoginModalProps, SearchBar(), SearchBarProps, useFirebaseSync()

### Community 7 - "Portfolio Analysis Engine"
Cohesion: 0.40
Nodes (4): BacktrackPoint, PortfolioAnalysis(), PortfolioAnalysisProps, SimulationRange

## Knowledge Gaps
- **75 isolated node(s):** `name`, `private`, `version`, `type`, `dev` (+70 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `Firebase Sync & Dependencies` to `Package Metadata & Scripts`?**
  _High betweenness centrality (0.179) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `Development Dependencies` to `Package Metadata & Scripts`?**
  _High betweenness centrality (0.117) - this node is a cross-community bridge._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _75 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `TS App Config` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._
- **Should `TS Node Config` be split into smaller, more focused modules?**
  _Cohesion score 0.1111111111111111 - nodes in this community are weakly interconnected._
- **Should `Development Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._