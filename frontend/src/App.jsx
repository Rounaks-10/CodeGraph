import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import IngestModal from './components/IngestModal';
import SettingsModal from './components/SettingsModal';
import AuthModal from './components/AuthModal';
import LandingPage from './components/LandingPage';
import ArchitectureGraph from './components/ArchitectureGraph';
import CallTracer from './components/CallTracer';
import AiAssistant from './components/AiAssistant';
import CodeQualityDashboard from './components/CodeQualityDashboard';
import CodeViewer from './components/CodeViewer';
import { api } from './services/api';
import { Loader2, Plus, Sparkles, Network } from 'lucide-react';

export default function App() {
  const [repos, setRepos] = useState([]);
  const [activeRepo, setActiveRepo] = useState(null);
  const [activeTab, setActiveTab] = useState('graph'); // 'graph' | 'tracer' | 'ai' | 'quality' | 'code'
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [loadingGraph, setLoadingGraph] = useState(false);

  // Authentication state
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('cg_user');
      return saved ? JSON.parse(saved) : null;
    } catch (_) {
      return null;
    }
  });
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'

  // Modals
  const [isIngestOpen, setIsIngestOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('cg_api_key') || '');

  // Cross-tab navigation targets
  const [codeTarget, setCodeTarget] = useState({ filePath: '', line: 1 });
  const [traceTarget, setTraceTarget] = useState('');

  // Initial load
  useEffect(() => {
    const token = localStorage.getItem('cg_token');
    if (token) {
      api.getMe()
        .then((user) => {
          setCurrentUser(user);
          localStorage.setItem('cg_user', JSON.stringify(user));
          loadRepositories();
        })
        .catch(() => {
          localStorage.removeItem('cg_token');
          localStorage.removeItem('cg_user');
          setCurrentUser(null);
        });
    }
  }, []);

  const loadRepositories = async () => {
    try {
      const list = await api.getRepos();
      setRepos(list || []);
      if (list && list.length > 0) {
        selectRepository(list[0]);
      } else {
        setActiveRepo(null);
        setNodes([]);
        setEdges([]);
      }
    } catch (err) {
      console.error('Failed to load repositories:', err);
    }
  };

  const selectRepository = async (repo) => {
    setActiveRepo(repo);
    setLoadingGraph(true);
    try {
      const graphData = await api.getGraph(repo._id || repo.id);
      setNodes(graphData.nodes || []);
      setEdges(graphData.edges || []);
    } catch (err) {
      console.error('Failed to load graph data:', err);
    } finally {
      setLoadingGraph(false);
    }
  };

  const handleRepoIngested = (newRepo) => {
    loadRepositories();
    selectRepository(newRepo);
  };

  const handleDeleteRepo = async (id) => {
    try {
      await api.deleteRepo(id);
      const remaining = repos.filter((r) => (r._id || r.id) !== id);
      setRepos(remaining);
      if (remaining.length > 0) {
        selectRepository(remaining[0]);
      } else {
        setActiveRepo(null);
        setNodes([]);
        setEdges([]);
      }
    } catch (err) {
      alert(`Delete error: ${err.message}`);
    }
  };

  const handleSaveApiKey = (newKey) => {
    setApiKey(newKey);
    localStorage.setItem('cg_api_key', newKey);
  };

  // Auth Handlers
  const handleOpenAuth = (mode = 'login') => {
    setAuthMode(mode);
    setIsAuthOpen(true);
  };

  const handleAuthSuccess = (user, token) => {
    setCurrentUser(user);
    loadRepositories();
  };

  const handleDirectDemoLogin = async () => {
    try {
      const data = await api.login('demo@codegraph.dev', 'codegraph123');
      if (data.token) {
        localStorage.setItem('cg_token', data.token);
        localStorage.setItem('cg_user', JSON.stringify(data.user));
        setCurrentUser(data.user);
        loadRepositories();
      }
    } catch (err) {
      handleOpenAuth('login');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('cg_token');
    localStorage.removeItem('cg_user');
    setCurrentUser(null);
    setRepos([]);
    setActiveRepo(null);
    setNodes([]);
    setEdges([]);
  };

  // Cross-navigation handlers
  const handleNavigateToCode = (filePath, line = 1) => {
    setCodeTarget({ filePath, line });
    setActiveTab('code');
  };

  const handleSelectNodeForTrace = (nodeId) => {
    setTraceTarget(nodeId);
    setActiveTab('tracer');
  };

  // 1. Unauthenticated View: Render Landing Page
  if (!currentUser) {
    return (
      <>
        <LandingPage
          onOpenAuth={handleOpenAuth}
          onDirectDemoLogin={handleDirectDemoLogin}
        />
        <AuthModal
          isOpen={isAuthOpen}
          initialMode={authMode}
          onClose={() => setIsAuthOpen(false)}
          onAuthSuccess={handleAuthSuccess}
        />
      </>
    );
  }

  // 2. Authenticated View: Render Full Working Application
  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-white text-gh-text">
      {/* Top Navigation */}
      <Header
        repos={repos}
        activeRepo={activeRepo}
        onSelectRepo={selectRepository}
        onOpenIngest={() => setIsIngestOpen(true)}
        onDeleteRepo={handleDeleteRepo}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenSettings={() => setIsSettingsOpen(true)}
        currentUser={currentUser}
        onOpenAuth={handleOpenAuth}
        onLogout={handleLogout}
      />

      {/* Main Workspace Body */}
      <main className="flex-1 relative overflow-hidden">
        {repos.length === 0 ? (
          <div className="h-full flex items-center justify-center p-6 bg-gh-canvas">
            <div className="max-w-md w-full bg-white border border-gh-border rounded-xl p-8 text-center space-y-4 shadow-sm">
              <div className="w-12 h-12 rounded-full bg-gh-blueLight text-gh-blue flex items-center justify-center mx-auto">
                <Network className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-base text-gh-text">
                  Welcome, {currentUser.name}!
                </h3>
                <p className="text-xs text-gh-textMuted leading-relaxed">
                  Your private workspace is ready. You can ingest a public GitHub repository, upload a project ZIP, or load an architectural sample.
                </p>
              </div>
              <button
                onClick={() => setIsIngestOpen(true)}
                className="w-full flex items-center justify-center space-x-2 py-2 px-4 bg-gh-green hover:bg-[#1a7f37]/90 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Ingest Your First Repository</span>
              </button>
            </div>
          </div>
        ) : loadingGraph ? (
          <div className="h-full flex items-center justify-center space-x-2 text-xs text-gh-textMuted bg-gh-canvas">
            <Loader2 className="w-5 h-5 text-gh-blue animate-spin" />
            <span>Loading codebase architecture knowledge graph...</span>
          </div>
        ) : (
          <>
            {activeTab === 'graph' && (
              <ArchitectureGraph
                rawNodes={nodes}
                rawEdges={edges}
                onSelectNodeForTrace={handleSelectNodeForTrace}
                onNavigateToCode={handleNavigateToCode}
              />
            )}

            {activeTab === 'tracer' && (
              <CallTracer
                activeRepo={activeRepo}
                nodes={nodes}
                edges={edges}
                selectedNodeId={traceTarget}
                onNavigateToCode={handleNavigateToCode}
              />
            )}

            {activeTab === 'ai' && (
              <AiAssistant
                activeRepo={activeRepo}
                nodes={nodes}
                apiKey={apiKey}
                onOpenSettings={() => setIsSettingsOpen(true)}
                onNavigateToCode={handleNavigateToCode}
              />
            )}

            {activeTab === 'quality' && (
              <CodeQualityDashboard
                activeRepo={activeRepo}
                onNavigateToCode={handleNavigateToCode}
              />
            )}

            {activeTab === 'code' && (
              <CodeViewer
                activeRepo={activeRepo}
                initialFilePath={codeTarget.filePath}
                initialLine={codeTarget.line}
              />
            )}
          </>
        )}
      </main>

      {/* Modals */}
      <AuthModal
        isOpen={isAuthOpen}
        initialMode={authMode}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      <IngestModal
        isOpen={isIngestOpen}
        onClose={() => setIsIngestOpen(false)}
        onRepoIngested={handleRepoIngested}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        apiKey={apiKey}
        onSaveApiKey={handleSaveApiKey}
      />
    </div>
  );
}
