import React, { useState } from 'react';
import {
  Network,
  Activity,
  Sparkles,
  ShieldAlert,
  Code2,
  GitBranch,
  ArrowRight,
  Zap,
  CheckCircle2,
  Lock,
  Search,
  Layers,
  Terminal,
  ExternalLink,
} from 'lucide-react';

export default function LandingPage({ onOpenAuth, onDirectDemoLogin }) {
  const [activePreviewTab, setActivePreviewTab] = useState('graph');

  return (
    <div className="h-screen bg-white text-gh-text flex flex-col font-sans select-none overflow-y-auto">
      {/* Top Navbar */}
      <header className="border-b border-gh-border sticky top-0 bg-white/95 backdrop-blur-sm z-40">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded bg-gh-text text-white flex items-center justify-center font-bold text-xs shadow-sm">
              CG
            </div>
            <span className="font-semibold text-gh-text text-sm tracking-tight flex items-center gap-1.5">
              CodeGraph
              <span className="text-[10px] font-normal text-gh-textMuted bg-gh-canvas border border-gh-borderSubtle px-2 py-0.5 rounded-full">
                AI Intelligence
              </span>
            </span>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <button
              onClick={() => onDirectDemoLogin()}
              className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 text-gh-text hover:text-gh-blue font-medium rounded-md border border-gh-border hover:bg-gh-subtle transition-colors"
            >
              <Zap className="w-3.5 h-3.5 text-gh-orange fill-gh-orange" />
              <span>Live Demo Account</span>
            </button>

            <button
              onClick={() => onOpenAuth('login')}
              className="px-3 py-1.5 text-gh-text font-medium hover:bg-gh-subtle rounded-md transition-colors"
            >
              Sign in
            </button>

            <button
              onClick={() => onOpenAuth('register')}
              className="px-3.5 py-1.5 bg-gh-green hover:bg-[#1a7f37]/90 text-white font-semibold rounded-md shadow-sm transition-colors"
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="pt-16 pb-12 px-6 max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-gh-blueLight border border-gh-blue/30 text-gh-blue text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI-Powered Full Codebase Intelligence & Dependency Graph</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold text-gh-text tracking-tight leading-[1.15]">
            Map, Understand, and Query Any Codebase in Seconds
          </h1>

          <p className="text-base text-gh-textMuted max-w-2xl mx-auto leading-relaxed">
            Turn GitHub repositories into interactive dependency knowledge graphs. Detect circular imports, trace API execution pipelines down to database queries, and ask questions with Graph-Augmented RAG.
          </p>

          {/* Action CTAs */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => onOpenAuth('register')}
              className="w-full sm:w-auto px-6 py-2.5 bg-gh-green hover:bg-[#1a7f37]/90 text-white font-semibold rounded-md text-sm shadow-sm transition-colors flex items-center justify-center space-x-2"
            >
              <span>Create Free Account</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onDirectDemoLogin()}
              className="w-full sm:w-auto px-5 py-2.5 bg-white hover:bg-gh-subtle text-gh-text font-semibold rounded-md text-sm border border-gh-border shadow-xs transition-colors flex items-center justify-center space-x-2"
            >
              <Zap className="w-4 h-4 text-gh-orange fill-gh-orange" />
              <span>Explore Pre-Loaded Demo</span>
            </button>
          </div>

          <div className="flex items-center justify-center space-x-6 text-[11px] text-gh-textMuted pt-2">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-gh-green" /> AST Parsing Engine
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-gh-green" /> Isolated User Workspaces
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-gh-green" /> Graph-Augmented RAG
            </span>
          </div>
        </section>

        {/* Interactive Feature Demo Showcase */}
        <section className="max-w-5xl mx-auto px-6 pb-20">
          <div className="bg-white rounded-xl border border-gh-border shadow-xl overflow-hidden">
            {/* Window Top Bar */}
            <div className="bg-gh-canvas px-4 py-2.5 border-b border-gh-border flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
                <span className="ml-2 text-xs font-mono text-gh-textMuted">
                  codegraph.dev/workspace/ecommerce-payment-api
                </span>
              </div>

              <div className="flex space-x-1 text-xs">
                {[
                  { id: 'graph', label: 'Architecture Graph', icon: Network },
                  { id: 'tracer', label: 'API Call Tracer', icon: Activity },
                  { id: 'quality', label: 'Cycle Detector', icon: ShieldAlert },
                  { id: 'ai', label: 'Codebase Assistant', icon: Sparkles },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActivePreviewTab(item.id)}
                    className={`px-3 py-1 rounded-md flex items-center space-x-1.5 transition-colors ${
                      activePreviewTab === item.id
                        ? 'bg-white text-gh-blue font-semibold shadow-2xs border border-gh-borderSubtle'
                        : 'text-gh-textMuted hover:text-gh-text'
                    }`}
                  >
                    <item.icon className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Window Content Display */}
            <div className="p-6 bg-gh-canvas/40 min-h-[380px] flex flex-col justify-center">
              {activePreviewTab === 'graph' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs text-gh-textMuted">
                    <span className="font-semibold text-gh-text">Interactive Dependency Graph Preview</span>
                    <span>13 Files · 41 Symbols · 56 Edges</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-white rounded-lg border border-gh-blue/40 shadow-sm space-y-2">
                      <div className="flex items-center space-x-2 text-xs font-semibold text-gh-text">
                        <span className="px-1.5 py-0.5 bg-gh-greenLight text-gh-green rounded font-mono text-[10px]">
                          POST
                        </span>
                        <span>/api/orders/checkout</span>
                      </div>
                      <div className="text-[11px] text-gh-textMuted font-mono">
                        src/routes/orderRoutes.js:6
                      </div>
                      <div className="pt-1 text-[10px] text-gh-blue flex items-center gap-1 font-mono">
                        <span>ROUTED_TO</span>
                        <ArrowRight className="w-3 h-3" />
                        <span>createCheckout</span>
                      </div>
                    </div>

                    <div className="p-4 bg-white rounded-lg border border-gh-purple/40 shadow-sm space-y-2">
                      <div className="flex items-center space-x-2 text-xs font-semibold text-gh-text">
                        <span className="px-1.5 py-0.5 bg-gh-purpleLight text-gh-purple rounded font-mono text-[10px]">
                          FN
                        </span>
                        <span>checkoutOrder(userId, amount)</span>
                      </div>
                      <div className="text-[11px] text-gh-textMuted font-mono">
                        src/services/orderService.js:7
                      </div>
                      <div className="pt-1 text-[10px] text-gh-purple flex items-center gap-1 font-mono">
                        <span>CALLS</span>
                        <ArrowRight className="w-3 h-3" />
                        <span>processPayment</span>
                      </div>
                    </div>

                    <div className="p-4 bg-white rounded-lg border border-gh-orange/40 shadow-sm space-y-2">
                      <div className="flex items-center space-x-2 text-xs font-semibold text-gh-text">
                        <span className="px-1.5 py-0.5 bg-gh-orangeLight text-gh-orange rounded font-mono text-[10px]">
                          CLASS
                        </span>
                        <span>Order</span>
                      </div>
                      <div className="text-[11px] text-gh-textMuted font-mono">
                        src/models/Order.js:14
                      </div>
                      <div className="pt-1 text-[10px] text-gh-orange flex items-center gap-1 font-mono">
                        <span>DEFINES</span>
                        <ArrowRight className="w-3 h-3" />
                        <span>markPaid()</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-gh-border text-center text-xs text-gh-textMuted">
                    Sign in to pan, zoom, drag nodes, filter by symbol type, and view line-by-line connections.
                  </div>
                </div>
              )}

              {activePreviewTab === 'tracer' && (
                <div className="space-y-3 max-w-xl mx-auto w-full">
                  <div className="text-xs font-semibold text-gh-text">Execution Flow Trace: POST /api/orders/checkout</div>
                  <div className="space-y-2 text-xs">
                    {[
                      { step: 1, name: 'HTTP POST /api/orders/checkout', file: 'orderRoutes.js:6', type: 'Route' },
                      { step: 2, name: 'createCheckout(req, res)', file: 'orderController.js:6', type: 'Controller' },
                      { step: 3, name: 'checkoutOrder(userId, amount)', file: 'orderService.js:7', type: 'Service' },
                      { step: 4, name: 'processPayment(orderId, amount)', file: 'paymentService.js:6', type: 'Gateway' },
                      { step: 5, name: 'Order.createOrder(userId, amount)', file: 'Order.js:14', type: 'Database Model' },
                    ].map((s) => (
                      <div key={s.step} className="p-2.5 bg-white border border-gh-border rounded-md flex items-center justify-between shadow-2xs">
                        <div className="flex items-center space-x-2.5">
                          <span className="w-5 h-5 rounded-full bg-gh-green text-white text-[11px] font-bold flex items-center justify-center">
                            {s.step}
                          </span>
                          <span className="font-mono font-medium text-gh-text">{s.name}</span>
                        </div>
                        <span className="text-[11px] font-mono text-gh-blue">{s.file}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activePreviewTab === 'quality' && (
                <div className="space-y-4 max-w-xl mx-auto w-full">
                  <div className="p-4 bg-white border-l-4 border-l-gh-red border border-gh-border rounded-lg shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-gh-text flex items-center gap-1.5">
                        <ShieldAlert className="w-4 h-4 text-gh-red" /> Circular Dependency Detected
                      </span>
                      <span className="px-2 py-0.5 rounded bg-gh-redLight text-gh-red font-mono text-[10px] font-bold">
                        HIGH RISK
                      </span>
                    </div>
                    <div className="p-2.5 bg-gh-canvas border border-gh-borderSubtle rounded font-mono text-xs text-gh-text flex items-center gap-2">
                      <span>orderService.js</span>
                      <ArrowRight className="w-3.5 h-3.5 text-gh-red" />
                      <span>paymentService.js</span>
                      <ArrowRight className="w-3.5 h-3.5 text-gh-red" />
                      <span>orderService.js</span>
                    </div>
                    <p className="text-[11px] text-gh-textMuted">
                      <strong>Suggested Fix:</strong> Extract shared transaction types and refund notification hooks into a dedicated payment utility module.
                    </p>
                  </div>
                </div>
              )}

              {activePreviewTab === 'ai' && (
                <div className="max-w-xl mx-auto w-full bg-white border border-gh-border rounded-lg p-4 shadow-sm space-y-3 text-xs">
                  <div className="flex items-center space-x-2 text-gh-text font-semibold">
                    <Sparkles className="w-4 h-4 text-gh-purple" />
                    <span>User: "What happens when POST /api/orders/checkout is called?"</span>
                  </div>
                  <div className="p-3 bg-gh-canvas border border-gh-borderSubtle rounded text-gh-text leading-relaxed text-[11px] space-y-1.5">
                    <p><strong>CodeGraph:</strong> Incoming request is received by <code>orderRoutes.js:6</code> and dispatched to <code>orderController.js:6</code>.</p>
                    <p>It invokes <code>checkoutOrder()</code> in <code>orderService.js:7</code>, which triggers payment gateway integration via <code>processPayment()</code>, and persists the record using the <code>Order</code> class in <code>Order.js:14</code>.</p>
                    <div className="pt-1 flex gap-1.5 text-[10px] text-gh-blue font-mono">
                      <span className="px-1.5 py-0.5 bg-white border rounded">orderRoutes.js:6</span>
                      <span className="px-1.5 py-0.5 bg-white border rounded">orderService.js:7</span>
                      <span className="px-1.5 py-0.5 bg-white border rounded">Order.js:14</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Core Pillars / Architecture Cards */}
        <section className="bg-gh-canvas border-t border-gh-border py-16 px-6">
          <div className="max-w-5xl mx-auto space-y-10">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-gh-text tracking-tight">
                Engineered for Modern Software Placement & Architecture
              </h2>
              <p className="text-xs text-gh-textMuted max-w-xl mx-auto">
                Combines AST compiler techniques, static graph analysis, and AI to give engineers a 360-degree view of any repository.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg border border-gh-border shadow-xs space-y-3">
                <div className="w-9 h-9 rounded bg-gh-blueLight text-gh-blue flex items-center justify-center font-bold">
                  <Terminal className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-sm text-gh-text">1. AST Parsing</h3>
                <p className="text-xs text-gh-textMuted leading-relaxed">
                  Babel AST compiler parses real JavaScript and TypeScript grammar without relying on fragile regular expressions.
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg border border-gh-border shadow-xs space-y-3">
                <div className="w-9 h-9 rounded bg-gh-purpleLight text-gh-purple flex items-center justify-center font-bold">
                  <Network className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-sm text-gh-text">2. Graph Algorithms</h3>
                <p className="text-xs text-gh-textMuted leading-relaxed">
                  DFS cycle detection identifies dangerous circular imports, dead code analysis finds unused exports, and centrality scoring flags hotspots.
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg border border-gh-border shadow-xs space-y-3">
                <div className="w-9 h-9 rounded bg-gh-greenLight text-gh-green flex items-center justify-center font-bold">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-sm text-gh-text">3. Graph-Augmented RAG</h3>
                <p className="text-xs text-gh-textMuted leading-relaxed">
                  Expands vector similarity search with AST topological neighborhood paths so the AI answers with full execution call chains.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gh-border py-6 px-6 text-center text-xs text-gh-textMuted bg-white">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>CodeGraph — AI Codebase Intelligence Engine</span>
          <div className="flex space-x-4">
            <button onClick={() => onOpenAuth('login')} className="hover:underline">
              Sign in
            </button>
            <button onClick={() => onOpenAuth('register')} className="hover:underline">
              Create account
            </button>
            <button onClick={() => onDirectDemoLogin()} className="hover:underline text-gh-blue">
              Demo account
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
