import React, { useState, useEffect, useRef } from 'react';
import {
  Folder,
  FolderOpen,
  FileCode,
  ChevronRight,
  ChevronDown,
  Copy,
  Check,
  ListTree,
  ExternalLink,
  Code2,
  FunctionSquare,
  Layers,
  Globe,
} from 'lucide-react';
import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-json';
import { api } from '../services/api';

// Recursive File Tree Node
function FileTreeNode({ node, activePath, onSelectFile, level = 0 }) {
  const [open, setOpen] = useState(true);
  const isDirectory = node.type === 'directory';
  const isSelected = activePath === node.path;

  if (isDirectory) {
    return (
      <div>
        <div
          onClick={() => setOpen(!open)}
          className={`flex items-center space-x-1 px-2 py-1 cursor-pointer rounded hover:bg-gh-subtle text-xs transition-colors select-none ${
            level > 0 ? 'ml-' + level * 2 : ''
          }`}
          style={{ paddingLeft: `${level * 12 + 6}px` }}
        >
          {open ? (
            <ChevronDown className="w-3.5 h-3.5 text-gh-textMuted shrink-0" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-gh-textMuted shrink-0" />
          )}
          {open ? (
            <FolderOpen className="w-4 h-4 text-gh-blue shrink-0" />
          ) : (
            <Folder className="w-4 h-4 text-gh-blue shrink-0" />
          )}
          <span className="truncate text-gh-text font-medium">{node.name}</span>
        </div>

        {open && node.children && (
          <div>
            {node.children.map((child, idx) => (
              <FileTreeNode
                key={idx}
                node={child}
                activePath={activePath}
                onSelectFile={onSelectFile}
                level={level + 1}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      onClick={() => onSelectFile(node.path)}
      className={`flex items-center space-x-2 py-1 px-2 cursor-pointer rounded text-xs transition-colors select-none ${
        isSelected
          ? 'bg-gh-blueLight/60 text-gh-blue font-semibold'
          : 'text-gh-text hover:bg-gh-subtle'
      }`}
      style={{ paddingLeft: `${level * 12 + 18}px` }}
    >
      <FileCode className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-gh-blue' : 'text-gh-textMuted'}`} />
      <span className="truncate">{node.name}</span>
    </div>
  );
}

export default function CodeViewer({
  activeRepo,
  initialFilePath,
  initialLine,
}) {
  const [fileTree, setFileTree] = useState(null);
  const [activeFile, setActiveFile] = useState(initialFilePath || '');
  const [highlightLine, setHighlightLine] = useState(initialLine || 1);
  const [fileData, setFileData] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showSymbols, setShowSymbols] = useState(true);
  const codeContainerRef = useRef(null);

  useEffect(() => {
    if (activeRepo) {
      loadFileTree();
    }
  }, [activeRepo]);

  useEffect(() => {
    if (initialFilePath) {
      setActiveFile(initialFilePath);
      setHighlightLine(initialLine || 1);
      loadFileContent(initialFilePath);
    }
  }, [initialFilePath, initialLine]);

  const loadFileTree = async () => {
    try {
      const tree = await api.getFileTree(activeRepo._id || activeRepo.id);
      setFileTree(tree);
      // If no active file, find first code file
      if (!activeFile && tree) {
        const findFirstFile = (node) => {
          if (node.type === 'file') return node.path;
          if (node.children) {
            for (const c of node.children) {
              const res = findFirstFile(c);
              if (res) return res;
            }
          }
          return null;
        };
        const first = findFirstFile(tree);
        if (first) {
          setActiveFile(first);
          loadFileContent(first);
        }
      }
    } catch (err) {
      console.error('File tree error:', err);
    }
  };

  const loadFileContent = async (filePath) => {
    if (!filePath || !activeRepo) return;
    try {
      const data = await api.getFileContent(activeRepo._id || activeRepo.id, filePath);
      setFileData(data);
    } catch (err) {
      console.error('File content error:', err);
    }
  };

  const handleSelectFile = (path) => {
    setActiveFile(path);
    setHighlightLine(1);
    loadFileContent(path);
  };

  useEffect(() => {
    if (fileData) {
      Prism.highlightAll();
      // Scroll to highlight line
      if (highlightLine > 1) {
        const targetEl = document.getElementById(`code-line-${highlightLine}`);
        if (targetEl) {
          targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }
  }, [fileData, highlightLine]);

  const handleCopy = () => {
    if (!fileData?.content) return;
    navigator.clipboard.writeText(fileData.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = fileData?.content ? fileData.content.split('\n') : [];

  return (
    <div className="h-[calc(100vh-89px)] bg-gh-canvas flex overflow-hidden">
      {/* 1. Left File Tree Sidebar */}
      <aside className="w-64 bg-white border-r border-gh-border flex flex-col shrink-0 select-none">
        <div className="p-3 border-b border-gh-borderSubtle bg-gh-canvas/40 flex items-center justify-between">
          <div className="flex items-center space-x-1.5 text-xs font-semibold text-gh-text">
            <ListTree className="w-3.5 h-3.5 text-gh-blue" />
            <span>Files Explorer</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {fileTree ? (
            <FileTreeNode
              node={fileTree}
              activePath={activeFile}
              onSelectFile={handleSelectFile}
            />
          ) : (
            <div className="p-4 text-xs text-gh-textMuted">Loading directory...</div>
          )}
        </div>
      </aside>

      {/* 2. Middle Editor & Code View */}
      <main className="flex-1 flex flex-col bg-white overflow-hidden">
        {/* Editor Top Bar */}
        <div className="px-4 py-2.5 border-b border-gh-border flex items-center justify-between bg-gh-canvas text-xs">
          <div className="flex items-center space-x-2 font-mono text-gh-text font-medium truncate">
            <FileCode className="w-4 h-4 text-gh-blue shrink-0" />
            <span className="truncate">{activeFile || 'No file selected'}</span>
            {fileData && (
              <span className="text-[11px] text-gh-textMuted font-sans font-normal">
                ({fileData.totalLines} lines · {(fileData.content.length / 1024).toFixed(1)} KB)
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopy}
              className="flex items-center space-x-1 px-2.5 py-1 text-xs text-gh-text hover:bg-gh-subtle rounded border border-gh-border transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-gh-green" />
                  <span className="text-gh-green">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 text-gh-textMuted" />
                  <span>Copy</span>
                </>
              )}
            </button>

            <button
              onClick={() => setShowSymbols(!showSymbols)}
              className={`px-2.5 py-1 text-xs rounded border transition-colors ${
                showSymbols
                  ? 'bg-gh-blueLight text-gh-blue border-gh-blue/30 font-semibold'
                  : 'bg-white text-gh-text border-gh-border'
              }`}
            >
              Outline ({fileData?.symbols?.length || 0})
            </button>
          </div>
        </div>

        {/* Code Content */}
        <div ref={codeContainerRef} className="flex-1 overflow-auto flex bg-white font-mono text-xs">
          {fileData ? (
            <div className="w-full flex py-2">
              {/* Line Numbers Column */}
              <div className="select-none text-right pr-4 pl-3 text-gh-textMuted/60 bg-white border-r border-gh-borderSubtle space-y-0.5">
                {lines.map((_, i) => {
                  const lineNum = i + 1;
                  const isCurrent = lineNum === highlightLine;
                  return (
                    <div
                      key={i}
                      id={`code-line-${lineNum}`}
                      className={`h-5 leading-5 text-[11px] ${
                        isCurrent ? 'font-bold text-gh-blue' : ''
                      }`}
                    >
                      {lineNum}
                    </div>
                  );
                })}
              </div>

              {/* Code Lines Column */}
              <div className="flex-1 pl-4 space-y-0.5 overflow-x-auto">
                {lines.map((lineText, i) => {
                  const lineNum = i + 1;
                  const isCurrent = lineNum === highlightLine;

                  return (
                    <div
                      key={i}
                      className={`h-5 leading-5 whitespace-pre ${
                        isCurrent
                          ? 'bg-gh-yellow/20 -mx-4 px-4 border-l-2 border-gh-blue bg-gh-blueLight/20 font-medium'
                          : ''
                      }`}
                    >
                      <code>{lineText || ' '}</code>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-8 text-gh-textMuted text-xs">Select a file from the explorer to view source code.</div>
          )}
        </div>
      </main>

      {/* 3. Right AST Symbols Outline Panel */}
      {showSymbols && fileData?.symbols && (
        <aside className="w-64 bg-white border-l border-gh-border flex flex-col shrink-0 select-none animate-in slide-in-from-right duration-150">
          <div className="p-3 border-b border-gh-borderSubtle bg-gh-canvas/40 flex items-center justify-between text-xs font-semibold text-gh-text">
            <span>AST Symbols Outline</span>
            <span className="text-[10px] text-gh-textMuted">
              {fileData.symbols.length} detected
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {fileData.symbols.map((sym, idx) => {
              const isFn = sym.type === 'function' || sym.type === 'method';
              const isClass = sym.type === 'class';
              const isRoute = sym.type === 'route';

              return (
                <div
                  key={idx}
                  onClick={() => setHighlightLine(sym.startLine)}
                  className="p-2 rounded border border-gh-borderSubtle hover:border-gh-blue hover:bg-gh-blueLight/20 cursor-pointer transition-colors space-y-0.5 text-xs"
                >
                  <div className="flex items-center space-x-1.5 font-mono">
                    {isRoute && <Globe className="w-3.5 h-3.5 text-gh-green shrink-0" />}
                    {isFn && <FunctionSquare className="w-3.5 h-3.5 text-gh-purple shrink-0" />}
                    {isClass && <Layers className="w-3.5 h-3.5 text-gh-orange shrink-0" />}
                    <span className="font-semibold text-gh-text truncate">{sym.name}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-gh-textMuted">
                    <span className="uppercase">{sym.type}</span>
                    <span className="font-mono text-gh-blue">
                      L{sym.startLine}–{sym.endLine}
                    </span>
                  </div>
                </div>
              );
            })}
            {fileData.symbols.length === 0 && (
              <div className="p-4 text-center text-xs text-gh-textMuted">
                No AST symbols found in this file
              </div>
            )}
          </div>
        </aside>
      )}
    </div>
  );
}
