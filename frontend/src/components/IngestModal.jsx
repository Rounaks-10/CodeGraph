import React, { useState } from 'react';
import { X, GitBranch, Upload, Sparkles, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

export default function IngestModal({ isOpen, onClose, onRepoIngested }) {
  const [tab, setTab] = useState('git'); // 'git' | 'zip' | 'sample'
  const [gitUrl, setGitUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const pollRepoStatus = async (repoId) => {
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      try {
        const repo = await api.getRepo(repoId);
        setStatusMessage(repo.statusMessage || `Status: ${repo.status}...`);

        if (repo.status === 'ready') {
          clearInterval(interval);
          setLoading(false);
          onRepoIngested(repo);
          onClose();
        } else if (repo.status === 'error') {
          clearInterval(interval);
          setLoading(false);
          setError(repo.statusMessage || 'Repository analysis failed');
        } else if (attempts > 60) {
          clearInterval(interval);
          setLoading(false);
          setError('Analysis timed out. Please check repository size.');
        }
      } catch (err) {
        clearInterval(interval);
        setLoading(false);
        setError(err.message);
      }
    }, 1500);
  };

  const handleGitSubmit = async (e) => {
    e.preventDefault();
    if (!gitUrl.trim()) return;
    setLoading(true);
    setError('');
    setStatusMessage('Initiating clone from GitHub...');

    try {
      const repo = await api.ingestGit(gitUrl.trim());
      pollRepoStatus(repo._id || repo.id);
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.error || err.message);
    }
  };

  const handleZipSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;
    setLoading(true);
    setError('');
    setStatusMessage('Uploading and extracting ZIP archive...');

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const repo = await api.uploadZip(formData);
      pollRepoStatus(repo._id || repo.id);
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.error || err.message);
    }
  };

  const handleSampleLoad = async (sampleId) => {
    setLoading(true);
    setError('');
    setStatusMessage('Generating architecture graph for sample project...');

    try {
      const repo = await api.loadSample(sampleId);
      pollRepoStatus(repo._id || repo.id);
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.error || err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4">
      <div className="bg-white rounded-lg border border-gh-border shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-gh-borderSubtle flex items-center justify-between bg-gh-canvas">
          <div className="flex items-center space-x-2">
            <GitBranch className="w-4 h-4 text-gh-blue" />
            <h3 className="font-semibold text-gh-text text-sm">Ingest Code Repository</h3>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-gh-textMuted hover:text-gh-text p-1 rounded-md hover:bg-gh-subtle transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="flex border-b border-gh-borderSubtle px-5 pt-2 bg-gh-canvas/40 text-xs font-medium">
          <button
            onClick={() => setTab('git')}
            className={`pb-2 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              tab === 'git'
                ? 'border-gh-blue text-gh-blue font-semibold'
                : 'border-transparent text-gh-textMuted hover:text-gh-text'
            }`}
          >
            <GitBranch className="w-3.5 h-3.5" />
            GitHub URL
          </button>
          <button
            onClick={() => setTab('zip')}
            className={`pb-2 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              tab === 'zip'
                ? 'border-gh-blue text-gh-blue font-semibold'
                : 'border-transparent text-gh-textMuted hover:text-gh-text'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            Upload ZIP
          </button>
          <button
            onClick={() => setTab('sample')}
            className={`pb-2 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              tab === 'sample'
                ? 'border-gh-blue text-gh-blue font-semibold'
                : 'border-transparent text-gh-textMuted hover:text-gh-text'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Pre-loaded Samples
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5">
          {error && (
            <div className="mb-4 p-3 rounded-md bg-gh-redLight border border-gh-red/30 text-gh-red text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>{error}</div>
            </div>
          )}

          {loading ? (
            <div className="py-8 text-center space-y-4">
              <div className="relative inline-flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-gh-blue animate-spin" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gh-text">Processing Repository</p>
                <p className="text-[11px] text-gh-textMuted mt-1">{statusMessage}</p>
              </div>
              <div className="w-full bg-gh-canvas rounded-full h-1.5 overflow-hidden max-w-xs mx-auto">
                <div className="bg-gh-blue h-full w-2/3 animate-pulse rounded-full" />
              </div>
            </div>
          ) : (
            <>
              {tab === 'git' && (
                <form onSubmit={handleGitSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gh-text mb-1">
                      Public GitHub Repository URL
                    </label>
                    <input
                      type="url"
                      placeholder="https://github.com/expressjs/express"
                      value={gitUrl}
                      onChange={(e) => setGitUrl(e.target.value)}
                      required
                      className="w-full px-3 py-2 text-xs border border-gh-border rounded-md focus:outline-none focus:ring-2 focus:ring-gh-blue/20 focus:border-gh-blue bg-white"
                    />
                    <p className="text-[11px] text-gh-textMuted mt-1">
                      Clones the repository (depth 1), parses JS/TS ASTs, and builds the dependency graph.
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] text-gh-textMuted">
                    <span>Quick presets:</span>
                    <button
                      type="button"
                      onClick={() => setGitUrl('https://github.com/expressjs/express')}
                      className="text-gh-blue hover:underline"
                    >
                      expressjs/express
                    </button>
                  </div>

                  <div className="pt-2 flex justify-end space-x-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-3 py-1.5 text-xs text-gh-text hover:bg-gh-subtle rounded-md border border-gh-border transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!gitUrl.trim()}
                      className="px-4 py-1.5 text-xs bg-gh-green hover:bg-[#1a7f37]/90 text-white font-semibold rounded-md shadow-sm transition-colors disabled:opacity-50"
                    >
                      Analyze Repository
                    </button>
                  </div>
                </form>
              )}

              {tab === 'zip' && (
                <form onSubmit={handleZipSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gh-text mb-1">
                      Upload ZIP Archive
                    </label>
                    <div className="border-2 border-dashed border-gh-border hover:border-gh-blue rounded-lg p-6 text-center cursor-pointer transition-colors bg-gh-canvas/20">
                      <input
                        type="file"
                        accept=".zip"
                        id="zip-upload"
                        className="hidden"
                        onChange={(e) => setSelectedFile(e.target.files[0])}
                      />
                      <label htmlFor="zip-upload" className="cursor-pointer block">
                        <Upload className="w-8 h-8 text-gh-textMuted mx-auto mb-2" />
                        <span className="text-xs font-medium text-gh-text block">
                          {selectedFile ? selectedFile.name : 'Click or drag a ZIP file here'}
                        </span>
                        <span className="text-[10px] text-gh-textMuted block mt-1">
                          Max size: 50MB. node_modules & build folders are automatically filtered out.
                        </span>
                      </label>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end space-x-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-3 py-1.5 text-xs text-gh-text hover:bg-gh-subtle rounded-md border border-gh-border transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!selectedFile}
                      className="px-4 py-1.5 text-xs bg-gh-green hover:bg-[#1a7f37]/90 text-white font-semibold rounded-md shadow-sm transition-colors disabled:opacity-50"
                    >
                      Upload & Ingest
                    </button>
                  </div>
                </form>
              )}

              {tab === 'sample' && (
                <div className="space-y-3">
                  <p className="text-xs text-gh-textMuted">
                    Instantly load pre-built architectural sample codebases configured to demonstrate AST parsing, circular dependency detection, and API call chains:
                  </p>

                  <div className="p-3 border border-gh-border hover:border-gh-blue rounded-lg bg-gh-canvas/30 hover:bg-white transition-all space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-xs text-gh-text flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-gh-blue" />
                        ecommerce-payment-api
                      </div>
                      <span className="px-1.5 py-0.5 bg-gh-blueLight text-gh-blue font-mono text-[10px] rounded">
                        JavaScript / Express
                      </span>
                    </div>
                    <p className="text-[11px] text-gh-textMuted">
                      Features JWT auth, Stripe checkout, controllers, models, <strong>1 intentional circular dependency cycle</strong> (orderService ↔ paymentService), and <strong>dead code</strong> (legacyEncryptToken).
                    </p>
                    <div className="pt-1 flex justify-end">
                      <button
                        onClick={() => handleSampleLoad('sample-ecommerce-api')}
                        className="px-3 py-1 bg-gh-blue hover:bg-gh-blueHover text-white text-xs font-semibold rounded-md shadow-sm transition-colors"
                      >
                        Load Architecture Sample
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
