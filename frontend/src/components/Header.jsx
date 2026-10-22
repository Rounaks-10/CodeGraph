import React, { useState } from 'react';
import {
  GitBranch,
  Network,
  Activity,
  Sparkles,
  ShieldAlert,
  Code2,
  Plus,
  ChevronDown,
  Layers,
  Settings,
  Trash2,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  User,
  LogOut,
  LogIn,
  UserPlus,
} from 'lucide-react';

export default function Header({
  repos,
  activeRepo,
  onSelectRepo,
  onOpenIngest,
  onDeleteRepo,
  activeTab,
  onSelectTab,
  onOpenSettings,
  currentUser,
  onOpenAuth,
  onLogout,
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const stats = activeRepo?.stats || {};
  const cycleCount = stats.cycleCount || 0;
  const deadCount = stats.deadCodeCount || 0;

  return (
    <header className="bg-white border-b border-gh-border sticky top-0 z-40 select-none">
      {/* Top Navbar */}
      <div className="px-4 py-2 flex items-center justify-between border-b border-gh-borderSubtle">
        <div className="flex items-center space-x-3">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded bg-gh-text text-white flex items-center justify-center font-bold text-sm shadow-sm">
              CG
            </div>
            <span className="font-semibold text-gh-text text-sm tracking-tight flex items-center gap-1.5">
              CodeGraph
              <span className="text-[10px] font-normal text-gh-textMuted bg-gh-canvas border border-gh-borderSubtle px-1.5 py-0.2 rounded-full">
                AI Intelligence
              </span>
            </span>
          </div>

          <span className="text-gh-border">/</span>

          {/* Repo Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center space-x-2 px-2.5 py-1 text-xs font-semibold text-gh-text hover:bg-gh-subtle rounded-md border border-gh-border transition-colors"
            >
              <GitBranch className="w-3.5 h-3.5 text-gh-blue" />
              <span className="max-w-[180px] truncate">
                {activeRepo ? activeRepo.name : 'Select repository...'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-gh-textMuted" />
            </button>

            {dropdownOpen && (
              <div className="absolute left-0 mt-1.5 w-72 bg-white rounded-md border border-gh-border shadow-lg py-1 z-50">
                <div className="px-3 py-1.5 text-[11px] font-semibold text-gh-textMuted uppercase tracking-wider border-b border-gh-borderSubtle flex justify-between items-center">
                  <span>Repositories ({repos.length})</span>
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      onOpenIngest();
                    }}
                    className="text-gh-blue hover:underline font-medium text-[11px] flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> New
                  </button>
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {repos.map((repo) => (
                    <div
                      key={repo._id || repo.id}
                      className={`flex items-center justify-between px-3 py-2 text-xs hover:bg-gh-subtle cursor-pointer ${
                        activeRepo?._id === repo._id || activeRepo?.id === repo.id
                          ? 'bg-gh-blueLight/50 text-gh-blue font-semibold'
                          : 'text-gh-text'
                      }`}
                      onClick={() => {
                        onSelectRepo(repo);
                        setDropdownOpen(false);
                      }}
                    >
                      <div className="flex items-center space-x-2 truncate pr-2">
                        <CheckCircle2
                          className={`w-3.5 h-3.5 ${
                            activeRepo?._id === repo._id || activeRepo?.id === repo.id
                              ? 'text-gh-blue'
                              : 'text-transparent'
                          }`}
                        />
                        <div className="truncate">
                          <div className="truncate">{repo.name}</div>
                          <div className="text-[10px] text-gh-textMuted truncate">
                            {repo.stats?.fileCount || 0} files · {repo.stats?.symbolCount || 0} symbols
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Delete repository "${repo.name}"?`)) {
                            onDeleteRepo(repo._id || repo.id);
                          }
                        }}
                        className="text-gh-textMuted hover:text-gh-red p-1 rounded hover:bg-white"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  {repos.length === 0 && (
                    <div className="px-3 py-4 text-center text-xs text-gh-textMuted">
                      No repositories ingested yet
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats & Action Buttons */}
        <div className="flex items-center space-x-2.5">
          {activeRepo && (
            <div className="hidden lg:flex items-center space-x-2 text-xs">
              <span className="px-2 py-0.5 rounded bg-gh-canvas border border-gh-border text-gh-text">
                <strong className="text-gh-text">{stats.fileCount || 0}</strong> files
              </span>
              <span className="px-2 py-0.5 rounded bg-gh-canvas border border-gh-border text-gh-text">
                <strong className="text-gh-text">{stats.symbolCount || 0}</strong> symbols
              </span>
              {cycleCount > 0 && (
                <span className="px-2 py-0.5 rounded bg-gh-redLight border border-gh-red/30 text-gh-red font-medium flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> {cycleCount} cycle{cycleCount > 1 ? 's' : ''}
                </span>
              )}
              {deadCount > 0 && (
                <span className="px-2 py-0.5 rounded bg-gh-orangeLight border border-gh-orange/30 text-gh-orange font-medium">
                  {deadCount} dead code
                </span>
              )}
            </div>
          )}

          <button
            onClick={onOpenIngest}
            className="flex items-center space-x-1 px-2.5 py-1 bg-gh-green hover:bg-[#1a7f37]/90 text-white text-xs font-semibold rounded-md shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Ingest Repo</span>
          </button>

          <button
            onClick={onOpenSettings}
            className="p-1.5 text-gh-textMuted hover:text-gh-text hover:bg-gh-subtle rounded-md border border-gh-border transition-colors"
            title="Configure AI API Keys"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>

          {/* User Auth Section */}
          <div className="relative pl-1 border-l border-gh-borderSubtle">
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center space-x-1.5 p-1 hover:bg-gh-subtle rounded-full border border-gh-border transition-colors"
                  title={currentUser.name}
                >
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-5 h-5 rounded-full bg-gh-subtle"
                  />
                  <ChevronDown className="w-3 h-3 text-gh-textMuted pr-0.5" />
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-1.5 w-56 bg-white rounded-md border border-gh-border shadow-lg py-1.5 z-50 text-xs">
                    <div className="px-3 py-2 border-b border-gh-borderSubtle">
                      <div className="font-semibold text-gh-text truncate">{currentUser.name}</div>
                      <div className="text-[11px] text-gh-textMuted truncate">{currentUser.email}</div>
                      <span className="inline-block mt-1 px-1.5 py-0.2 bg-gh-blueLight text-gh-blue rounded text-[9px] font-mono font-bold uppercase">
                        {currentUser.role}
                      </span>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          onLogout();
                        }}
                        className="w-full text-left px-3 py-1.5 text-gh-red hover:bg-gh-redLight/40 flex items-center space-x-2 transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-1.5">
                <button
                  onClick={() => onOpenAuth('login')}
                  className="px-2.5 py-1 text-xs text-gh-text font-medium hover:bg-gh-subtle rounded-md border border-gh-border transition-colors flex items-center space-x-1"
                >
                  <LogIn className="w-3 h-3" />
                  <span>Sign in</span>
                </button>
                <button
                  onClick={() => onOpenAuth('register')}
                  className="px-2.5 py-1 text-xs bg-white text-gh-blue border border-gh-blue/40 font-semibold hover:bg-gh-blueLight/50 rounded-md transition-colors flex items-center space-x-1"
                >
                  <UserPlus className="w-3 h-3" />
                  <span>Register</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <nav className="flex px-4 space-x-1 overflow-x-auto text-xs bg-gh-canvas/40">
        <button
          onClick={() => onSelectTab('graph')}
          className={`flex items-center space-x-2 px-3 py-2 border-b-2 font-medium transition-colors whitespace-nowrap ${
            activeTab === 'graph'
              ? 'border-gh-blue text-gh-text font-semibold'
              : 'border-transparent text-gh-textMuted hover:text-gh-text hover:border-gh-border'
          }`}
        >
          <Network className="w-3.5 h-3.5 text-gh-blue" />
          <span>Architecture Graph</span>
        </button>

        <button
          onClick={() => onSelectTab('tracer')}
          className={`flex items-center space-x-2 px-3 py-2 border-b-2 font-medium transition-colors whitespace-nowrap ${
            activeTab === 'tracer'
              ? 'border-gh-blue text-gh-text font-semibold'
              : 'border-transparent text-gh-textMuted hover:text-gh-text hover:border-gh-border'
          }`}
        >
          <Activity className="w-3.5 h-3.5 text-gh-green" />
          <span>API Flow & Call Tracer</span>
        </button>

        <button
          onClick={() => onSelectTab('ai')}
          className={`flex items-center space-x-2 px-3 py-2 border-b-2 font-medium transition-colors whitespace-nowrap ${
            activeTab === 'ai'
              ? 'border-gh-blue text-gh-text font-semibold'
              : 'border-transparent text-gh-textMuted hover:text-gh-text hover:border-gh-border'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-gh-purple" />
          <span>AI Codebase Assistant (RAG)</span>
        </button>

        <button
          onClick={() => onSelectTab('quality')}
          className={`flex items-center space-x-2 px-3 py-2 border-b-2 font-medium transition-colors whitespace-nowrap ${
            activeTab === 'quality'
              ? 'border-gh-blue text-gh-text font-semibold'
              : 'border-transparent text-gh-textMuted hover:text-gh-text hover:border-gh-border'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5 text-gh-red" />
          <span>Code Quality & Health</span>
          {cycleCount > 0 && (
            <span className="px-1.5 py-0.2 bg-gh-red text-white text-[10px] rounded-full font-bold">
              {cycleCount}
            </span>
          )}
        </button>

        <button
          onClick={() => onSelectTab('code')}
          className={`flex items-center space-x-2 px-3 py-2 border-b-2 font-medium transition-colors whitespace-nowrap ${
            activeTab === 'code'
              ? 'border-gh-blue text-gh-text font-semibold'
              : 'border-transparent text-gh-textMuted hover:text-gh-text hover:border-gh-border'
          }`}
        >
          <Code2 className="w-3.5 h-3.5 text-gh-orange" />
          <span>Code & AST Explorer</span>
        </button>
      </nav>
    </header>
  );
}
