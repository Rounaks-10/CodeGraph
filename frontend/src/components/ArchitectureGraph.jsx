import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  FileNode,
  FunctionNode,
  ClassNode,
  RouteNode,
  ModuleNode,
} from './CustomNodes';
import {
  Search,
  Filter,
  ExternalLink,
  ArrowRight,
  ArrowLeft,
  Activity,
  Code2,
  X,
  Layers,
  Sparkles,
} from 'lucide-react';

const nodeTypes = {
  file: FileNode,
  function: FunctionNode,
  method: FunctionNode,
  class: ClassNode,
  route: RouteNode,
  module: ModuleNode,
};

export default function ArchitectureGraph({
  rawNodes = [],
  rawEdges = [],
  onSelectNodeForTrace,
  onNavigateToCode,
}) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNode, setSelectedNode] = useState(null);

  // Group and arrange nodes visually in a clean grid / cluster layout
  const layoutNodes = useCallback(
    (nodesList, edgesList, typeFilter, query) => {
      // 1. Filter nodes
      let filtered = nodesList;
      if (typeFilter !== 'all') {
        if (typeFilter === 'functions') {
          filtered = filtered.filter((n) => n.type === 'function' || n.type === 'method');
        } else {
          filtered = filtered.filter((n) => n.type === typeFilter);
        }
      }

      if (query.trim()) {
        const q = query.toLowerCase();
        filtered = filtered.filter(
          (n) => n.name.toLowerCase().includes(q) || n.filePath.toLowerCase().includes(q)
        );
      }

      const activeNodeIds = new Set(filtered.map((n) => n.nodeId));

      // 2. Position nodes clustered by file or type
      // Group by filePath
      const fileGroups = {};
      filtered.forEach((n) => {
        const key = n.filePath || 'external';
        if (!fileGroups[key]) fileGroups[key] = [];
        fileGroups[key].push(n);
      });

      const flowNodes = [];
      let col = 0;
      let row = 0;
      const COL_WIDTH = 260;
      const ROW_HEIGHT = 140;
      const COLS_PER_ROW = 4;

      Object.entries(fileGroups).forEach(([fileKey, groupNodes]) => {
        const baseCol = (col % COLS_PER_ROW) * COL_WIDTH * 1.5;
        const baseRow = Math.floor(col / COLS_PER_ROW) * 450;

        groupNodes.forEach((node, idx) => {
          const x = baseCol + (idx % 2) * (COL_WIDTH + 20);
          const y = baseRow + Math.floor(idx / 2) * ROW_HEIGHT;

          flowNodes.push({
            id: node.nodeId,
            type: node.type,
            position: { x, y },
            data: node,
          });
        });
        col++;
      });

      // 3. Filter edges
      const flowEdges = edgesList
        .filter((e) => activeNodeIds.has(e.source) && activeNodeIds.has(e.target))
        .map((e) => {
          let strokeColor = '#8c959f';
          if (e.type === 'ROUTED_TO') strokeColor = '#1a7f37';
          else if (e.type === 'CALLS') strokeColor = '#8250df';
          else if (e.type === 'IMPORTS') strokeColor = '#0969da';

          return {
            id: e.edgeId,
            source: e.source,
            target: e.target,
            animated: e.type === 'ROUTED_TO' || e.type === 'CALLS',
            label: e.label,
            labelStyle: { fontSize: 10, fill: '#656d76', fontFamily: 'monospace' },
            style: { stroke: strokeColor, strokeWidth: 1.5 },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              width: 14,
              height: 14,
              color: strokeColor,
            },
          };
        });

      setNodes(flowNodes);
      setEdges(flowEdges);
    },
    [setNodes, setEdges]
  );

  useEffect(() => {
    layoutNodes(rawNodes, rawEdges, filterType, searchQuery);
  }, [rawNodes, rawEdges, filterType, searchQuery, layoutNodes]);

  const onNodeClick = (_, node) => {
    setSelectedNode(node.data);
  };

  // Calculate incoming and outgoing connections for the selected node
  const connections = useMemo(() => {
    if (!selectedNode) return { incoming: [], outgoing: [] };
    const id = selectedNode.nodeId;
    const nodeMap = new Map(rawNodes.map((n) => [n.nodeId, n]));

    const incoming = rawEdges
      .filter((e) => e.target === id)
      .map((e) => ({ edge: e, node: nodeMap.get(e.source) }))
      .filter((c) => c.node);

    const outgoing = rawEdges
      .filter((e) => e.source === id)
      .map((e) => ({ edge: e, node: nodeMap.get(e.target) }))
      .filter((c) => c.node);

    return { incoming, outgoing };
  }, [selectedNode, rawNodes, rawEdges]);

  return (
    <div className="relative w-full h-[calc(100vh-89px)] bg-gh-canvas flex overflow-hidden">
      {/* Top Filter & Search Toolbar */}
      <div className="absolute top-3 left-3 z-30 flex items-center space-x-2 bg-white/95 backdrop-blur-sm p-1.5 rounded-lg border border-gh-border shadow-sm text-xs">
        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-gh-textMuted absolute left-2 top-2" />
          <input
            type="text"
            placeholder="Search symbols..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-7 pr-3 py-1 bg-gh-canvas border border-gh-border rounded-md text-xs w-44 focus:outline-none focus:border-gh-blue"
          />
        </div>

        <div className="h-4 w-px bg-gh-border" />

        {/* Type Filter Pills */}
        <div className="flex space-x-1">
          {[
            { id: 'all', label: 'All' },
            { id: 'file', label: 'Files' },
            { id: 'functions', label: 'Functions' },
            { id: 'class', label: 'Classes' },
            { id: 'route', label: 'API Routes' },
            { id: 'module', label: 'Packages' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setFilterType(item.id)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                filterType === item.id
                  ? 'bg-gh-blue text-white shadow-sm'
                  : 'text-gh-textMuted hover:text-gh-text hover:bg-gh-subtle'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <span className="text-[11px] text-gh-textMuted pl-2">
          {nodes.length} nodes · {edges.length} edges
        </span>
      </div>

      {/* Main Graph Canvas */}
      <div className="flex-1 h-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          attributionPosition="bottom-left"
          minZoom={0.2}
          maxZoom={2.5}
        >
          <Background color="#e1e4e8" gap={20} size={1} />
          <Controls className="!bg-white !border !border-gh-border !shadow-sm !rounded-md" />
          <MiniMap
            nodeColor={(n) => {
              if (n.type === 'file') return '#0969da';
              if (n.type === 'route') return '#1a7f37';
              if (n.type === 'class') return '#bc4c00';
              if (n.type === 'function' || n.type === 'method') return '#8250df';
              return '#656d76';
            }}
            className="!border !border-gh-border !rounded-md !bg-white"
            maskColor="rgba(240, 243, 246, 0.7)"
          />
        </ReactFlow>
      </div>

      {/* Node Inspection Drawer */}
      {selectedNode && (
        <aside className="w-80 bg-white border-l border-gh-border h-full flex flex-col z-30 shadow-lg animate-in slide-in-from-right duration-150">
          {/* Drawer Header */}
          <div className="px-4 py-3 border-b border-gh-borderSubtle flex items-center justify-between bg-gh-canvas">
            <div className="flex items-center space-x-2 truncate">
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-white border border-gh-border text-gh-text">
                {selectedNode.type}
              </span>
              <h4 className="font-semibold text-xs text-gh-text truncate">{selectedNode.name}</h4>
            </div>
            <button
              onClick={() => setSelectedNode(null)}
              className="text-gh-textMuted hover:text-gh-text p-1 rounded hover:bg-gh-subtle"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="p-4 flex-1 overflow-y-auto space-y-4 text-xs">
            {/* Location & Lines */}
            <div className="space-y-1">
              <div className="text-[11px] font-semibold text-gh-textMuted uppercase">Location</div>
              <div className="p-2 bg-gh-canvas border border-gh-borderSubtle rounded font-mono text-[11px] text-gh-text flex justify-between items-center">
                <span className="truncate pr-2">{selectedNode.filePath}</span>
                <span className="text-gh-blue shrink-0">
                  L{selectedNode.startLine}–{selectedNode.endLine}
                </span>
              </div>
            </div>

            {/* Docstring */}
            {selectedNode.docstring && (
              <div className="space-y-1">
                <div className="text-[11px] font-semibold text-gh-textMuted uppercase">Documentation</div>
                <div className="p-2 bg-gh-canvas border border-gh-borderSubtle rounded text-gh-text text-[11px] italic">
                  {selectedNode.docstring}
                </div>
              </div>
            )}

            {/* Parameters */}
            {selectedNode.params && selectedNode.params.length > 0 && (
              <div className="space-y-1">
                <div className="text-[11px] font-semibold text-gh-textMuted uppercase">
                  Parameters ({selectedNode.params.length})
                </div>
                <div className="flex flex-wrap gap-1">
                  {selectedNode.params.map((param, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 bg-gh-subtle border border-gh-border font-mono text-[10px] rounded"
                    >
                      {param}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Incoming Connections */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-semibold text-gh-textMuted uppercase flex items-center justify-between">
                <span>Incoming References ({connections.incoming.length})</span>
                <ArrowLeft className="w-3 h-3 text-gh-textMuted" />
              </div>
              <div className="space-y-1 max-h-36 overflow-y-auto">
                {connections.incoming.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedNode(item.node)}
                    className="p-1.5 rounded border border-gh-borderSubtle hover:border-gh-blue bg-white hover:bg-gh-blueLight/20 cursor-pointer transition-colors text-[11px] flex items-center justify-between"
                  >
                    <span className="truncate font-mono font-medium text-gh-text">
                      {item.node.name}
                    </span>
                    <span className="text-[9px] text-gh-textMuted uppercase px-1 rounded bg-gh-canvas">
                      {item.edge.type}
                    </span>
                  </div>
                ))}
                {connections.incoming.length === 0 && (
                  <div className="text-[11px] text-gh-textMuted italic py-1">
                    No incoming connections
                  </div>
                )}
              </div>
            </div>

            {/* Outgoing Connections */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-semibold text-gh-textMuted uppercase flex items-center justify-between">
                <span>Outgoing Calls / Imports ({connections.outgoing.length})</span>
                <ArrowRight className="w-3 h-3 text-gh-textMuted" />
              </div>
              <div className="space-y-1 max-h-36 overflow-y-auto">
                {connections.outgoing.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedNode(item.node)}
                    className="p-1.5 rounded border border-gh-borderSubtle hover:border-gh-blue bg-white hover:bg-gh-blueLight/20 cursor-pointer transition-colors text-[11px] flex items-center justify-between"
                  >
                    <span className="truncate font-mono font-medium text-gh-text">
                      {item.node.name}
                    </span>
                    <span className="text-[9px] text-gh-textMuted uppercase px-1 rounded bg-gh-canvas">
                      {item.edge.type}
                    </span>
                  </div>
                ))}
                {connections.outgoing.length === 0 && (
                  <div className="text-[11px] text-gh-textMuted italic py-1">
                    No outgoing connections
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Drawer Actions */}
          <div className="p-3 border-t border-gh-borderSubtle bg-gh-canvas space-y-2">
            {(selectedNode.type === 'route' || selectedNode.type === 'function') && (
              <button
                onClick={() => onSelectNodeForTrace(selectedNode.nodeId)}
                className="w-full flex items-center justify-center space-x-1.5 px-3 py-1.5 bg-gh-blue text-white rounded-md font-semibold text-xs hover:bg-gh-blueHover transition-colors shadow-sm"
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Trace Call Chain</span>
              </button>
            )}

            {selectedNode.filePath && selectedNode.filePath !== 'node_modules' && (
              <button
                onClick={() => onNavigateToCode(selectedNode.filePath, selectedNode.startLine)}
                className="w-full flex items-center justify-center space-x-1.5 px-3 py-1.5 bg-white border border-gh-border text-gh-text rounded-md font-medium text-xs hover:bg-gh-subtle transition-colors"
              >
                <Code2 className="w-3.5 h-3.5 text-gh-textMuted" />
                <span>Jump to Source Code</span>
              </button>
            )}
          </div>
        </aside>
      )}
    </div>
  );
}
