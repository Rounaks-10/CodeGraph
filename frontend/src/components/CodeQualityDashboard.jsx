import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  RotateCw,
  Trash2,
  Flame,
  ArrowRight,
  Code2,
  CheckCircle2,
  Info,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { api } from '../services/api';

export default function CodeQualityDashboard({ activeRepo, onNavigateToCode }) {
  const [activeSubTab, setActiveSubTab] = useState('cycles'); // 'cycles' | 'unused' | 'hotspots'
  const [cycles, setCycles] = useState([]);
  const [unused, setUnused] = useState([]);
  const [hotspots, setHotspots] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeRepo) {
      loadQualityData();
    }
  }, [activeRepo]);

  const loadQualityData = async () => {
    setLoading(true);
    try {
      const repoId = activeRepo._id || activeRepo.id;
      const [cyclesRes, unusedRes, hotspotsRes] = await Promise.all([
        api.getCycles(repoId),
        api.getUnused(repoId),
        api.getHotspots(repoId),
      ]);
      setCycles(cyclesRes.circularDependencies || []);
      setUnused(unusedRes.unusedSymbols || []);
      setHotspots(hotspotsRes.hotspots || []);
    } catch (err) {
      console.error('Failed to load quality metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-89px)] bg-gh-canvas p-6 overflow-y-auto">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Top Summary Banner */}
        <div className="bg-white p-5 rounded-lg border border-gh-border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <ShieldAlert className="w-5 h-5 text-gh-red" />
              <h2 className="text-sm font-semibold text-gh-text">
                Code Quality & Architectural Dependency Analysis
              </h2>
            </div>
            <p className="text-xs text-gh-textMuted mt-1">
              Static graph algorithms detect circular import cycles, dead code, and high blast-radius hotspots.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center space-x-3 text-xs">
            <div
              onClick={() => setActiveSubTab('cycles')}
              className={`px-3 py-2 rounded-md border cursor-pointer transition-colors ${
                activeSubTab === 'cycles'
                  ? 'bg-gh-redLight border-gh-red/40 text-gh-red font-semibold'
                  : 'bg-gh-canvas border-gh-border hover:bg-gh-subtle text-gh-text'
              }`}
            >
              <div className="text-[10px] uppercase text-gh-textMuted">Circular Imports</div>
              <div className="text-sm font-bold">{cycles.length}</div>
            </div>

            <div
              onClick={() => setActiveSubTab('unused')}
              className={`px-3 py-2 rounded-md border cursor-pointer transition-colors ${
                activeSubTab === 'unused'
                  ? 'bg-gh-orangeLight border-gh-orange/40 text-gh-orange font-semibold'
                  : 'bg-gh-canvas border-gh-border hover:bg-gh-subtle text-gh-text'
              }`}
            >
              <div className="text-[10px] uppercase text-gh-textMuted">Dead / Unused</div>
              <div className="text-sm font-bold">{unused.length}</div>
            </div>

            <div
              onClick={() => setActiveSubTab('hotspots')}
              className={`px-3 py-2 rounded-md border cursor-pointer transition-colors ${
                activeSubTab === 'hotspots'
                  ? 'bg-gh-purpleLight border-gh-purple/40 text-gh-purple font-semibold'
                  : 'bg-gh-canvas border-gh-border hover:bg-gh-subtle text-gh-text'
              }`}
            >
              <div className="text-[10px] uppercase text-gh-textMuted">Hotspot Modules</div>
              <div className="text-sm font-bold">{hotspots.length}</div>
            </div>
          </div>
        </div>

        {/* Sub-tab Navigation */}
        <div className="flex border-b border-gh-border space-x-4 text-xs font-medium">
          <button
            onClick={() => setActiveSubTab('cycles')}
            className={`pb-2.5 border-b-2 flex items-center space-x-1.5 transition-colors ${
              activeSubTab === 'cycles'
                ? 'border-gh-red text-gh-red font-semibold'
                : 'border-transparent text-gh-textMuted hover:text-gh-text'
            }`}
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Circular Dependencies ({cycles.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('unused')}
            className={`pb-2.5 border-b-2 flex items-center space-x-1.5 transition-colors ${
              activeSubTab === 'unused'
                ? 'border-gh-orange text-gh-orange font-semibold'
                : 'border-transparent text-gh-textMuted hover:text-gh-text'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Dead Code & Unused Exports ({unused.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('hotspots')}
            className={`pb-2.5 border-b-2 flex items-center space-x-1.5 transition-colors ${
              activeSubTab === 'hotspots'
                ? 'border-gh-purple text-gh-purple font-semibold'
                : 'border-transparent text-gh-textMuted hover:text-gh-text'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Architectural Hotspots ({hotspots.length})</span>
          </button>
        </div>

        {/* Tab 1: Circular Dependencies */}
        {activeSubTab === 'cycles' && (
          <div className="space-y-4">
            {cycles.length === 0 ? (
              <div className="bg-white p-8 rounded-lg border border-gh-border text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-gh-green mx-auto" />
                <h3 className="text-xs font-semibold text-gh-text">No Circular Dependencies</h3>
                <p className="text-[11px] text-gh-textMuted">
                  The module import graph is completely acyclic. No circular import deadlocks detected.
                </p>
              </div>
            ) : (
              cycles.map((cycle, idx) => (
                <div
                  key={idx}
                  className="bg-white border-l-4 border-l-gh-red border border-gh-border rounded-lg p-5 shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="w-4 h-4 text-gh-red" />
                      <h4 className="font-semibold text-xs text-gh-text">
                        Circular Dependency Cycle #{idx + 1} ({cycle.length} files involved)
                      </h4>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-gh-redLight text-gh-red font-mono text-[10px] font-bold">
                      HIGH SEVERITY
                    </span>
                  </div>

                  {/* Cycle Path Breadcrumbs */}
                  <div className="bg-gh-canvas p-3 rounded border border-gh-borderSubtle flex items-center flex-wrap gap-2 text-xs font-mono">
                    {cycle.path.map((filePath, fIdx) => (
                      <React.Fragment key={fIdx}>
                        <button
                          onClick={() => onNavigateToCode(filePath, 1)}
                          className="px-2.5 py-1 bg-white hover:bg-gh-blueLight/50 text-gh-text hover:text-gh-blue border border-gh-border rounded transition-colors shadow-2xs"
                        >
                          {filePath}
                        </button>
                        {fIdx < cycle.path.length - 1 && (
                          <ArrowRight className="w-3.5 h-3.5 text-gh-red shrink-0" />
                        )}
                      </React.Fragment>
                    ))}
                  </div>

                  {/* Impact and Suggestion */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded bg-gh-canvas/40 border border-gh-borderSubtle space-y-1">
                      <div className="font-semibold text-gh-text flex items-center gap-1">
                        <Info className="w-3.5 h-3.5 text-gh-textMuted" />
                        Runtime Impact
                      </div>
                      <p className="text-gh-textMuted text-[11px] leading-relaxed">{cycle.impact}</p>
                    </div>

                    <div className="p-3 rounded bg-gh-canvas/40 border border-gh-borderSubtle space-y-1">
                      <div className="font-semibold text-gh-text flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-gh-green" />
                        Recommended Refactoring
                      </div>
                      <p className="text-gh-textMuted text-[11px] leading-relaxed">{cycle.suggestion}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 2: Dead Code & Unused Exports */}
        {activeSubTab === 'unused' && (
          <div className="bg-white rounded-lg border border-gh-border shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gh-borderSubtle bg-gh-canvas/40 flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-xs text-gh-text">
                  Unreferenced Functions, Classes & Files
                </h4>
                <p className="text-[11px] text-gh-textMuted">
                  Symbols having 0 incoming calls or imports across the codebase.
                </p>
              </div>
              <span className="text-xs text-gh-textMuted">{unused.length} items flagged</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gh-canvas border-b border-gh-borderSubtle text-[11px] text-gh-textMuted uppercase font-semibold">
                  <tr>
                    <th className="px-4 py-2.5">Symbol / File</th>
                    <th className="px-4 py-2.5">Type</th>
                    <th className="px-4 py-2.5">Location</th>
                    <th className="px-4 py-2.5">Confidence</th>
                    <th className="px-4 py-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gh-borderSubtle">
                  {unused.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gh-subtle/50 transition-colors">
                      <td className="px-4 py-3 font-mono font-medium text-gh-text flex items-center space-x-2">
                        <Trash2 className="w-3.5 h-3.5 text-gh-orange shrink-0" />
                        <span>{item.name}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-1.5 py-0.5 rounded bg-gh-canvas border border-gh-borderSubtle text-[10px] uppercase font-mono">
                          {item.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gh-textMuted font-mono text-[11px]">
                        {item.filePath}:{item.startLine}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                            item.confidence.includes('High')
                              ? 'bg-gh-redLight text-gh-red'
                              : 'bg-gh-orangeLight text-gh-orange'
                          }`}
                        >
                          {item.confidence}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => onNavigateToCode(item.filePath, item.startLine)}
                          className="px-2 py-1 text-xs text-gh-blue hover:text-gh-blueHover hover:underline font-medium inline-flex items-center gap-1"
                        >
                          <Code2 className="w-3 h-3" />
                          <span>Inspect</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {unused.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-gh-textMuted text-xs">
                        No unused symbols or orphan files detected!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Architectural Hotspots */}
        {activeSubTab === 'hotspots' && (
          <div className="bg-white rounded-lg border border-gh-border shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gh-borderSubtle bg-gh-canvas/40 flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-xs text-gh-text">
                  Degree Centrality & Blast-Radius Rankings
                </h4>
                <p className="text-[11px] text-gh-textMuted">
                  Components with high connectivity (PageRank / Degree Centrality). Changes here have the widest downstream impact.
                </p>
              </div>
              <span className="text-xs text-gh-textMuted">{hotspots.length} evaluated</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gh-canvas border-b border-gh-borderSubtle text-[11px] text-gh-textMuted uppercase font-semibold">
                  <tr>
                    <th className="px-4 py-2.5">Component</th>
                    <th className="px-4 py-2.5">In-Degree (Used By)</th>
                    <th className="px-4 py-2.5">Out-Degree (Calls)</th>
                    <th className="px-4 py-2.5">Centrality Score</th>
                    <th className="px-4 py-2.5">Blast Radius</th>
                    <th className="px-4 py-2.5 text-right">Inspect</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gh-borderSubtle">
                  {hotspots.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gh-subtle/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-mono font-medium text-gh-text">{item.name}</div>
                        <div className="text-[10px] text-gh-textMuted">{item.filePath}</div>
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-gh-blue">
                        {item.inDegree}
                      </td>
                      <td className="px-4 py-3 font-mono text-gh-text">{item.outDegree}</td>
                      <td className="px-4 py-3 font-mono font-semibold">{item.centralityScore}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            item.riskLevel === 'HIGH'
                              ? 'bg-gh-redLight text-gh-red border border-gh-red/30'
                              : item.riskLevel === 'MEDIUM'
                              ? 'bg-gh-orangeLight text-gh-orange border border-gh-orange/30'
                              : 'bg-gh-canvas text-gh-textMuted border border-gh-border'
                          }`}
                        >
                          {item.riskLevel}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => onNavigateToCode(item.filePath, 1)}
                          className="px-2 py-1 text-xs text-gh-blue hover:underline font-medium"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
