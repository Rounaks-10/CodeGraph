import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { FileCode, FunctionSquare, Layers, Globe, Package, Zap } from 'lucide-react';

export const FileNode = memo(({ data, selected }) => {
  return (
    <div
      className={`px-3 py-2 rounded-md bg-white border text-left shadow-sm transition-all duration-150 min-w-[190px] ${
        selected ? 'border-gh-blue ring-2 ring-gh-blue/20 shadow-md' : 'border-gh-border hover:border-gh-blue'
      }`}
    >
      <Handle type="target" position={Position.Top} className="!w-2 !h-2 !bg-gh-textMuted" />
      <div className="flex items-center space-x-2">
        <FileCode className="w-4 h-4 text-gh-blue shrink-0" />
        <div className="truncate font-semibold text-xs text-gh-text">{data.name}</div>
      </div>
      <div className="text-[10px] text-gh-textMuted truncate mt-0.5">{data.filePath}</div>
      <div className="mt-1.5 flex items-center gap-1.5 text-[10px]">
        <span className="px-1.5 py-0.2 bg-gh-canvas text-gh-textMuted rounded border border-gh-borderSubtle">
          {data.metadata?.functionCount || 0} fns
        </span>
        <span className="px-1.5 py-0.2 bg-gh-canvas text-gh-textMuted rounded border border-gh-borderSubtle">
          {data.metadata?.routeCount || 0} routes
        </span>
      </div>
      <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !bg-gh-textMuted" />
    </div>
  );
});

export const FunctionNode = memo(({ data, selected }) => {
  return (
    <div
      className={`px-3 py-2 rounded-md bg-white border text-left shadow-sm transition-all duration-150 min-w-[170px] ${
        selected ? 'border-gh-purple ring-2 ring-gh-purple/20 shadow-md' : 'border-gh-border hover:border-gh-purple'
      }`}
    >
      <Handle type="target" position={Position.Top} className="!w-2 !h-2 !bg-gh-purple" />
      <div className="flex items-center space-x-2">
        <FunctionSquare className="w-4 h-4 text-gh-purple shrink-0" />
        <div className="truncate font-mono font-medium text-xs text-gh-text">{data.name}</div>
      </div>
      <div className="text-[10px] text-gh-textMuted truncate mt-0.5">
        {data.filePath}:{data.startLine}
      </div>
      <div className="mt-1.5 flex items-center gap-1 text-[10px]">
        {data.async && (
          <span className="px-1 py-0.2 bg-gh-orangeLight text-gh-orange font-mono rounded text-[9px]">
            async
          </span>
        )}
        {data.exported && (
          <span className="px-1 py-0.2 bg-gh-blueLight text-gh-blue font-mono rounded text-[9px]">
            export
          </span>
        )}
        <span className="text-gh-textMuted text-[9px] font-mono">
          ({data.params?.length || 0} args)
        </span>
      </div>
      <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !bg-gh-purple" />
    </div>
  );
});

export const ClassNode = memo(({ data, selected }) => {
  return (
    <div
      className={`px-3 py-2 rounded-md bg-white border text-left shadow-sm transition-all duration-150 min-w-[170px] ${
        selected ? 'border-gh-orange ring-2 ring-gh-orange/20 shadow-md' : 'border-gh-border hover:border-gh-orange'
      }`}
    >
      <Handle type="target" position={Position.Top} className="!w-2 !h-2 !bg-gh-orange" />
      <div className="flex items-center space-x-2">
        <Layers className="w-4 h-4 text-gh-orange shrink-0" />
        <div className="truncate font-semibold text-xs text-gh-text">{data.name}</div>
      </div>
      <div className="text-[10px] text-gh-textMuted truncate mt-0.5">
        {data.metadata?.superClass ? `extends ${data.metadata.superClass}` : 'Class definition'}
      </div>
      <div className="mt-1.5 flex items-center gap-1.5 text-[10px]">
        <span className="px-1.5 py-0.2 bg-gh-orangeLight text-gh-orange rounded text-[9px]">
          Class
        </span>
        <span className="text-gh-textMuted text-[9px]">L{data.startLine}–{data.endLine}</span>
      </div>
      <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !bg-gh-orange" />
    </div>
  );
});

export const RouteNode = memo(({ data, selected }) => {
  const method = data.metadata?.method || 'GET';
  const methodColor =
    method === 'GET'
      ? 'bg-gh-greenLight text-gh-green border-gh-green/30'
      : method === 'POST'
      ? 'bg-gh-blueLight text-gh-blue border-gh-blue/30'
      : method === 'PUT'
      ? 'bg-gh-orangeLight text-gh-orange border-gh-orange/30'
      : 'bg-gh-redLight text-gh-red border-gh-red/30';

  return (
    <div
      className={`px-3 py-2 rounded-md bg-white border text-left shadow-sm transition-all duration-150 min-w-[190px] ${
        selected ? 'border-gh-green ring-2 ring-gh-green/20 shadow-md' : 'border-gh-border hover:border-gh-green'
      }`}
    >
      <Handle type="target" position={Position.Top} className="!w-2 !h-2 !bg-gh-green" />
      <div className="flex items-center space-x-2">
        <Globe className="w-4 h-4 text-gh-green shrink-0" />
        <span className={`px-1.5 py-0.5 text-[9px] font-mono font-bold rounded border ${methodColor}`}>
          {method}
        </span>
        <div className="truncate font-mono font-medium text-xs text-gh-text">
          {data.metadata?.path || data.name}
        </div>
      </div>
      <div className="text-[10px] text-gh-textMuted truncate mt-1">
        {data.filePath}:{data.startLine}
      </div>
      <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !bg-gh-green" />
    </div>
  );
});

export const ModuleNode = memo(({ data, selected }) => {
  return (
    <div
      className={`px-3 py-1.5 rounded-md bg-gh-canvas border text-left shadow-sm transition-all duration-150 min-w-[140px] ${
        selected ? 'border-gh-text ring-2 ring-gh-text/20 shadow-md' : 'border-gh-border hover:border-gh-textMuted'
      }`}
    >
      <Handle type="target" position={Position.Top} className="!w-2 !h-2 !bg-gh-textMuted" />
      <div className="flex items-center space-x-2">
        <Package className="w-3.5 h-3.5 text-gh-textMuted shrink-0" />
        <div className="truncate font-mono text-xs text-gh-text font-medium">{data.name}</div>
      </div>
      <div className="text-[9px] text-gh-textMuted mt-0.5">npm package</div>
      <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !bg-gh-textMuted" />
    </div>
  );
});
