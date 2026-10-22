# CodeGraph — AI Codebase Intelligence Engine

> A developer intelligence engine that parses GitHub repositories into Abstract Syntax Trees, models dependencies as an interactive knowledge graph, traces API execution pipelines, detects circular imports & dead code, and answers architectural questions using Graph-Augmented RAG.

---

## 🌟 Core Highlights

- **AST Parsing Engine**: Analyzes JavaScript & TypeScript with `@babel/parser` & `@babel/traverse`. Extracts functions, classes, methods, imports, exports, and Express/REST API routes with exact file and line ranges.
- **Graph Dependency Modeling**: Maps AST symbols into a directed graph with `IMPORTS`, `DEFINES`, `CALLS`, `ROUTED_TO`, and `EXTENDS` relationships.
- **API Call & Execution Flow Tracer**: Follows incoming HTTP routes (e.g. `POST /api/orders/checkout`) through controllers, domain services, utility helpers, and database queries.
- **Static Code Quality Algorithms**:
  - **Circular Dependency Detection**: DFS cycle detection algorithm identifying circular import deadlocks (e.g. `orderService.js ↔ paymentService.js`) with impact analysis and refactoring suggestions.
  - **Dead Code & Unused Exports**: Detects uncalled exported functions, unused classes, and orphan files across the codebase.
  - **Architectural Hotspots**: Calculates Degree Centrality & PageRank to identify tightly-coupled "god objects" and calculate blast radius for changes.
- **User Authentication & Session Management**: JWT-based register and login flows with password hashing (`bcryptjs`), GitHub-styled avatars, user sessions, and 1-click evaluation demo login.
- **Graph-Augmented RAG**: Combines vector similarity retrieval with neighborhood graph expansion. Includes a built-in deterministic AST Graph Reasoning Engine (works 100% offline with zero API keys) and supports Google Gemini / OpenAI frontier LLMs.
- **GitHub Light Aesthetic**: White backgrounds, `#d0d7de` borders, GitHub dark text, blue links, green success badges, and interactive React Flow graph canvas.

---

## 🏗️ System Architecture

```
[ GitHub Repo URL / ZIP / Sample ]
               │
               ▼
   ┌───────────────────────┐
   │ Ingestion & Filtering │ (Excludes node_modules, build, dist)
   └───────────┬───────────┘
               │
               ▼
   ┌───────────────────────┐
   │ Babel AST Parser      │ (Extracts: Functions, Classes, Routes, Calls)
   └───────────┬───────────┘
               │
       ┌───────┴───────┐
       ▼               ▼
┌─────────────┐ ┌───────────────┐
│ Graph Store │ │ Vector Store  │
│ (Nodes/Edges│ │ (RAG Chunks & │
│  in Mongo/  │ │  Embeddings)  │
│  In-Memory) │ │               │
└──────┬──────┘ └───────┬───────┘
       │                │
       ▼                ▼
┌────────────────────────────────┐
│ Graph Algorithms Engine        │
│ • DFS Circular Import Cycles   │
│ • Dead Code / Unused Exports   │
│ • Centrality & Hotspot Ranking │
│ • API Flow Call Tracer         │
└──────────────┬─────────────────┘
               │
               ▼
┌────────────────────────────────┐
│ Graph-Augmented RAG & LLM      │
│ (Gemini 1.5 / OpenAI / Local)  │
└──────────────┬─────────────────┘
               │
               ▼
┌────────────────────────────────┐
│ React Frontend (React Flow,    │
│ Syntax Highlighter, Copilot UI)│
└────────────────────────────────┘
```

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite 6, Tailwind CSS, `@xyflow/react` (React Flow), Lucide Icons, PrismJS |
| **Backend** | Node.js (v22), Express.js, Mongoose, Multer, Adm-Zip, Simple-Git |
| **AST Parsing** | `@babel/parser`, `@babel/traverse`, `@babel/types` (supports ESNext, TS, JSX) |
| **Database** | MongoDB (with automatic dual in-memory fallback store) |
| **AI / RAG** | Graph-Augmented Retrieval, Cosine Vector Search, Built-in Reasoning Engine + Google Gemini API |

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js**: v18+ (tested on Node v22)
- **MongoDB**: (Optional, MongoDB service running on `mongodb://127.0.0.1:27017` or in-memory fallback will activate automatically)

### 2. Start Backend Server
```bash
cd backend
npm install
npm start
```
*Backend runs on `http://localhost:5000`.*

### 3. Start Frontend App
```bash
cd frontend
npm install
npm run dev
```
*Frontend runs on `http://localhost:3000` (proxies `/api` to port 5000).*

---

## 🎯 Features Walkthrough

### 0. User Authentication & Session Management
- **Registration & Login**: Secure account creation with email, name, and encrypted password storage using `bcryptjs` salt rounds.
- **JWT Bearer Authentication**: Issues 7-day signed JSON Web Tokens (`jwt.sign`) persisted in browser storage and attached automatically via Axios request interceptors.
- **GitHub-Themed Header Integration**:
  - Displays avatar and profile dropdown with user role (`developer`), account email, and one-click Sign Out.
- **Quick Evaluation Demo**: Click **"⚡ Fill Demo Credentials"** in the auth modal to log in as `demo@codegraph.dev` / `codegraph123` with zero typing.

### 1. Repository Ingestion
- **Public Git URL**: Paste any public repo (e.g. `https://github.com/expressjs/express`) to clone and analyze in seconds.
- **ZIP Upload**: Drag and drop any repository archive.
- **Pre-loaded Portfolio Sample**: Click **"Pre-loaded Samples"** to immediately load `ecommerce-payment-api` featuring:
  - Express REST routes (`/api/auth`, `/api/orders`)
  - Intentional circular dependency (`orderService.js ↔ paymentService.js`)
  - Dead code (`legacyEncryptToken` in `security.js`)
  - Full AST call traces.

### 2. Interactive Architecture Graph
- **React Flow Canvas**: Zoom, pan, drag nodes, and inspect with minimap.
- **Type Filtering**: Filter by Files, Functions, Classes, API Routes, or Packages.
- **Inspector Drawer**: Click any node to view parameters, docstrings, incoming references, outgoing calls, or click **"Jump to Source Code"**.

### 3. API Flow & Call Tracer
- Select any API route (e.g., `POST /api/orders/checkout`).
- Visually traces the step-by-step pipeline across files:
  1. `HTTP POST /checkout` (routes/orderRoutes.js)
  2. `createCheckout()` (controllers/orderController.js)
  3. `checkoutOrder()` (services/orderService.js)
  4. `processPayment()` (services/paymentService.js)
  5. `Order.markPaid()` (models/Order.js)
- Each step includes argument signatures, JSDoc notes, and a direct button to jump into code.

### 4. AI Codebase Assistant (RAG)
- Natural language query interface with suggested chips:
  - *"What happens when POST /api/orders/checkout is called?"*
  - *"Are there any circular dependencies between modules?"*
  - *"Identify potentially unused exports or dead files"*
  - *"Which modules act as architectural hotspots?"*
- **Clickable Citations**: Every answer provides clickable file and line badges that scroll to the exact code lines.
- **Dual Engine**: Works offline using graph-augmented AST reasoning, or add your Google Gemini / OpenAI key via the settings modal.

### 5. Code Quality & Dependency Analysis
- **Circular Imports**: Highlights circular cycles with interactive breadcrumbs, impact explanations, and refactoring strategies.
- **Dead Code Detection**: Identifies exported functions, methods, and classes that have 0 incoming calls or imports across the codebase.
- **Architectural Hotspots**: Ranks modules by Degree Centrality and PageRank, flagging high blast-radius files.

### 6. Code & AST Explorer
- Integrated directory tree sidebar.
- Syntax-highlighted code editor with line numbers and active line highlighting.
- Right-hand AST symbol outline allowing instant jumping to functions, classes, and routes.

---

## 💼 Placement & Interview Talking Points

1. **Why AST Parsing instead of Regex?**
   - Regular expressions fail on nested parentheses, multi-line arguments, arrow function closures, and variable shadowing. Babel's AST parser generates a formal Concrete Syntax Tree (CST) and AST, accurately distinguishing variable declarations from function calls.
2. **How does Graph-Augmented RAG (G-RAG) outperform standard naive RAG?**
   - Standard RAG splits text into arbitrary chunks and uses vector similarity. For code, this loses context (e.g. caller doesn't know where the callee was imported from). CodeGraph combines vector similarity with **Graph Neighborhood Expansion**, injecting call paths, route bindings, and module dependencies into the LLM prompt.
3. **Circular Dependency Algorithm**:
   - Implements Depth-First Search (DFS) with a recursion call-stack tracker on the file dependency adjacency list to detect cycles in $O(V + E)$ time complexity.
