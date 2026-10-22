import React, { useState, useEffect } from 'react';
import {
  Activity,
  ArrowDown,
  Code2,
  Globe,
  FunctionSquare,
  Layers,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../services/api';

export default function CallTracer({
  activeRepo,
  nodes = [],
  edges = [],
  selectedNodeId,
  onNavigateToCode,
}) {
  const [selectedStartNode, setSelectedStartNode] = useState(selectedNodeId || '');
  const [traceData, setTraceData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Filter entry points (API Routes or Functions)
  const entrypoints = nodes.filter(
    (n) => n.type === 'route' || (n.type === 'function' && n.exported)
  );

  useEffect(() => {
    if (selectedNodeId) {
      setSelectedStartNode(selectedNodeId);
      loadTrace(selectedNodeId);
    } else if (entrypoints.length > 0 && !selectedStartNode) {
      const defaultEntry = entrypoints.find((n) => n.type === 'route') || entrypoints[0];
      if (defaultEntry) {
        setSelectedStartNode(defaultEntry.nodeId);
        loadTrace(defaultEntry.nodeId);
      }
    }
  }, [selectedNodeId, nodes]);

  const loadTrace = async (nodeId) => {
    if (!nodeId || !activeRepo) return;
    setLoading(true);
    try {
      const result = await api.traceFlow(activeRepo._id || activeRepo.id, nodeId);
      setTraceData(result);
    } catch (err) {
      console.error('Trace load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectChange = (e) => {
    const id = e.target.value;
    setSelectedStartNode(id);
    loadTrace(id);
  };

  return (
    <div className="h-[calc(100vh-89px)] bg-gh-canvas p-6 overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header & Selector Bar */}
        <div className="bg-white p-5 rounded-lg border border-gh-border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-gh-green" />
              <h2 className="text-sm font-semibold text-gh-text">
                API Flow & Execution Call Tracer
              </h2>
            </div>
            <p className="text-xs text-gh-textMuted mt-1">
              Follows AST routing and function invocation edges across files from entrypoint to database.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <label className="text-xs font-semibold text-gh-text shrink-0">Entrypoint:</label>
            <select
              value={selectedStartNode}
              onChange={handleSelectChange}
              className="px-3 py-1.5 bg-white border border-gh-border rounded-md text-xs font-mono text-gh-text focus:outline-none focus:border-gh-blue"
            >
              <optgroup label="API Endpoints">
                {entrypoints
                  .filter((n) => n.type === 'route')
                  .map((n) => (
                    <option key={n.nodeId} value={n.nodeId}>
                      {n.name} ({n.filePath})
                    </option>
                  ))}
              </optgroup>
              <optgroup label="Exported Functions">
                {entrypoints
                  .filter((n) => n.type === 'function')
                  .map((n) => (
                    <option key={n.nodeId} value={n.nodeId}>
                      {n.name}() ({n.filePath})
                    </option>
                  ))}
              </optgroup>
            </select>
          </div>
        </div>

        {/* Trace Timeline */}
        {loading ? (
          <div className="py-12 text-center text-xs text-gh-textMuted">
            Analyzing call graph trace...
          </div>
        ) : traceData && traceData.trace ? (
          <div className="relative pl-6 space-y-6 before:absolute before:left-[35px] before:top-4 before:bottom-4 before:w-0.5 before:bg-gh-border">
            {traceData.trace.map((step, idx) => {
              const isFirst = idx === 0;
              const isLast = idx === traceData.trace.length - 1;

              return (
                <div key={idx} className="relative flex items-start space-x-4">
                  {/* Step Badge */}
                  <div
                    className={`relative z-10 w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-xs shrink-0 shadow-sm ${
                      isFirst
                        ? 'bg-gh-green text-white border-white ring-2 ring-gh-green/30'
                        : isLast
                        ? 'bg-gh-purple text-white border-white ring-2 ring-gh-purple/30'
                        : 'bg-white text-gh-text border-gh-border'
                    }`}
                  >
                    {idx + 1}
                  </div>

                  {/* Step Card */}
                  <div className="flex-1 bg-white border border-gh-border rounded-lg p-4 shadow-sm hover:border-gh-blue transition-all">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`px-1.5 py-0.5 text-[10px] font-mono font-bold rounded uppercase ${
                              step.type === 'route'
                                ? 'bg-gh-greenLight text-gh-green'
                                : step.type === 'function' || step.type === 'method'
                                ? 'bg-gh-purpleLight text-gh-purple'
                                : 'bg-gh-orangeLight text-gh-orange'
                            }`}
                          >
                            {step.type === 'route'
                              ? 'HTTP Route'
                              : step.type === 'method'
                              ? 'Class Method'
                              : 'Function'}
                          </span>
                          <h4 className="font-mono font-semibold text-xs text-gh-text">
                            {step.name}
                          </h4>
                        </div>

                        <div className="text-[11px] text-gh-textMuted flex items-center space-x-2">
                          <span>{step.filePath}</span>
                          <span>·</span>
                          <span className="font-mono text-gh-blue">
                            L{step.startLine}–{step.endLine}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => onNavigateToCode(step.filePath, step.startLine)}
                        className="flex items-center space-x-1 px-2.5 py-1 text-xs text-gh-blue hover:text-gh-blueHover bg-gh-blueLight/50 hover:bg-gh-blueLight rounded border border-gh-blue/20 transition-colors"
                      >
                        <Code2 className="w-3.5 h-3.5" />
                        <span>Inspect Code</span>
                      </button>
                    </div>

                    {/* Docstring */}
                    {step.docstring && (
                      <p className="mt-2 text-xs text-gh-textMuted italic bg-gh-canvas p-2 rounded border border-gh-borderSubtle">
                        {step.docstring}
                      </p>
                    )}

                    {/* Parameters */}
                    {step.params && step.params.length > 0 && (
                      <div className="mt-2 flex items-center gap-1.5 text-[11px]">
                        <span className="text-gh-textMuted">Arguments:</span>
                        <div className="flex flex-wrap gap-1">
                          {step.params.map((p, pIdx) => (
                            <span
                              key={pIdx}
                              className="px-1.5 py-0.2 bg-gh-subtle font-mono text-[10px] rounded border border-gh-border"
                            >
                              {p}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-12 text-center text-xs text-gh-textMuted">
            Select an entrypoint above to visualize the execution trace.
          </div>
        )}
      </div>
    </div>
  );
}
