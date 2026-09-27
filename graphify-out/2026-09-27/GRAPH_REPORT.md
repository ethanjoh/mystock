# Graph Report - my-stock  (2026-09-11)

## Corpus Check
- 24 files · ~21,787 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 177 nodes · 190 edges · 17 communities (13 shown, 4 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `213259b8`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- TS App Config
- TS Node Config
- Stock Data & UI Components
- Development Dependencies
- Firebase Sync & Dependencies
- Package Metadata & Scripts
- App Entry & Auth Navigation
- Simulated Stock Data Hook
- TS Root Config
- Readme Documentation
- graphify
- graphify.md
- graphify.md

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 17 edges
2. `compilerOptions` - 16 edges
3. `useRealStockData()` - 10 edges
4. `fetchWithProxyFallback()` - 6 edges
5. `Global Markets & Stock Portfolio Dashboard (My Stock)` - 6 edges
6. `🌟 핵심 기능 (Key Features)` - 6 edges
7. `scripts` - 5 edges
8. `🚀 설치 및 시작 방법 (Getting Started)` - 5 edges
9. `Changelog` - 4 edges
10. `graphify` - 3 edges

## Surprising Connections (you probably didn't know these)
- `PortfolioItem()` --calls--> `useRealStockData()`  [EXTRACTED]
  src/components/PortfolioModal.tsx → src/hooks/useRealStockData.ts
- `App()` --calls--> `useFirebaseSync()`  [EXTRACTED]
  src/App.tsx → src/hooks/useFirebaseSync.ts
- `ExchangeRateBar()` --calls--> `useRealStockData()`  [EXTRACTED]
  src/components/ExchangeRateBar.tsx → src/hooks/useRealStockData.ts
- `PortfolioAnalysis()` --calls--> `fetchWithProxyFallback()`  [EXTRACTED]
  src/components/PortfolioAnalysis.tsx → src/utils/apiProxy.ts
- `PortfolioModal()` --calls--> `useRealStockData()`  [EXTRACTED]
  src/components/PortfolioModal.tsx → src/hooks/useRealStockData.ts

## Import Cycles
- None detected.

## Communities (17 total, 4 thin omitted)

### Community 0 - "TS App Config"
Cohesion: 0.09
Nodes (22): DOM, src, vite/client, compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib (+14 more)

### Community 1 - "TS Node Config"
Cohesion: 0.10
Nodes (20): node, vite.config.ts, compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection (+12 more)

### Community 2 - "Stock Data & UI Components"
Cohesion: 0.12
Nodes (20): ExchangeRateBar(), ExchangeRateBarProps, BacktrackPoint, PortfolioAnalysis(), PortfolioAnalysisProps, SimulationRange, PortfolioItem(), PortfolioItemProps (+12 more)

### Community 3 - "Development Dependencies"
Cohesion: 0.07
Nodes (27): auto-changelog, eslint, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals, devDependencies, auto-changelog (+19 more)

### Community 4 - "Firebase Sync & Dependencies"
Cohesion: 0.13
Nodes (13): firebase, firebase, App(), LoginModal(), LoginModalProps, SearchBar(), SearchBarProps, firebaseConfig (+5 more)

### Community 5 - "Package Metadata & Scripts"
Cohesion: 0.11
Nodes (18): lucide-react, dependencies, lucide-react, react, react-dom, recharts, name, private (+10 more)

### Community 6 - "App Entry & Auth Navigation"
Cohesion: 0.11
Nodes (17): 1. 실시간 글로벌 시장 지수 & 관심종목(Watchlist) 관리, 1. 프로젝트 복제 및 패키지 설치, 2. 고기능 반응형 주식 차트 (Interactive Stock Charts), 2. 환경 변수(Firebase) 구성, 3. Firebase 기반 클라우드 백업 및 보안 인증 (Cloud Sync), 3. 로컬 개발 서버 실행, 4. 원화(KRW) 환산 포트폴리오 관리 (Asset Management), 4. 프로덕션 빌드 (+9 more)

### Community 11 - "Readme Documentation"
Cohesion: 0.40
Nodes (4): Changelog, [v0.0.0](https://github.com/ethanjoh/mystock/compare/v0.2...v0.0.0), v0.1, [v0.2](https://github.com/ethanjoh/mystock/compare/v0.1...v0.2)

### Community 16 - "graphify"
Cohesion: 0.50
Nodes (3): graphify, PYTHONUTF8, C:/Users/ethan/.local/bin/graphify-mcp.exe

## Knowledge Gaps
- **99 isolated node(s):** `C:/Users/ethan/.local/bin/graphify-mcp.exe`, `PYTHONUTF8`, `name`, `private`, `version` (+94 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `Package Metadata & Scripts` to `Firebase Sync & Dependencies`?**
  _High betweenness centrality (0.155) - this node is a cross-community bridge._
- **Why does `firebase` connect `Firebase Sync & Dependencies` to `Package Metadata & Scripts`?**
  _High betweenness centrality (0.137) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `Development Dependencies` to `Package Metadata & Scripts`?**
  _High betweenness centrality (0.130) - this node is a cross-community bridge._
- **What connects `C:/Users/ethan/.local/bin/graphify-mcp.exe`, `PYTHONUTF8`, `name` to the rest of the system?**
  _99 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `TS App Config` be split into smaller, more focused modules?**
  _Cohesion score 0.08695652173913043 - nodes in this community are weakly interconnected._
- **Should `TS Node Config` be split into smaller, more focused modules?**
  _Cohesion score 0.09523809523809523 - nodes in this community are weakly interconnected._
- **Should `Stock Data & UI Components` be split into smaller, more focused modules?**
  _Cohesion score 0.1225071225071225 - nodes in this community are weakly interconnected._