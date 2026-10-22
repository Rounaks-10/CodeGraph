import React, { useState } from 'react';
import { X, KeyRound, Check, Sparkles, AlertCircle, Info } from 'lucide-react';

export default function SettingsModal({ isOpen, onClose, apiKey, onSaveApiKey }) {
  const [keyInput, setKeyInput] = useState(apiKey || '');
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    onSaveApiKey(keyInput.trim());
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4">
      <div className="bg-white rounded-lg border border-gh-border shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-5 py-3.5 border-b border-gh-borderSubtle flex items-center justify-between bg-gh-canvas">
          <div className="flex items-center space-x-2">
            <KeyRound className="w-4 h-4 text-gh-blue" />
            <h3 className="font-semibold text-gh-text text-sm">AI Assistant Configuration</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gh-textMuted hover:text-gh-text p-1 rounded-md hover:bg-gh-subtle"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-5 space-y-4 text-xs">
          <div className="p-3 rounded-md bg-gh-blueLight/50 border border-gh-blue/20 text-gh-text flex items-start space-x-2">
            <Info className="w-4 h-4 text-gh-blue shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <strong>Offline Mode Ready:</strong> By default, CodeGraph uses a built-in deterministic Graph Reasoning AI Engine that answers questions without requiring any external API key.
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gh-text mb-1">
              Google Gemini or OpenAI API Key (Optional)
            </label>
            <input
              type="password"
              placeholder="AIzaSy... or sk-..."
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-gh-border rounded-md focus:outline-none focus:border-gh-blue bg-white font-mono"
            />
            <p className="text-[11px] text-gh-textMuted mt-1">
              Provide a key to augment Graph RAG with Google Gemini 1.5 Flash or OpenAI.
            </p>
          </div>

          <div className="pt-2 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-gh-text hover:bg-gh-subtle rounded-md border border-gh-border"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs bg-gh-blue hover:bg-gh-blueHover text-white font-semibold rounded-md shadow-sm transition-colors flex items-center space-x-1"
            >
              {saved && <Check className="w-3.5 h-3.5" />}
              <span>{saved ? 'Saved!' : 'Save Key'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
