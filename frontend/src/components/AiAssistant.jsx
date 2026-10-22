import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Loader2,
  FileCode,
  ExternalLink,
  Code2,
  HelpCircle,
  KeyRound,
  Bot,
  User,
} from 'lucide-react';
import { api } from '../services/api';

export default function AiAssistant({
  activeRepo,
  nodes = [],
  apiKey,
  onOpenSettings,
  onNavigateToCode,
}) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hello! I am **CodeGraph**, your AI codebase intelligence assistant.\n\nI parse your repository's Abstract Syntax Trees and dependency graph to answer architectural questions, trace API flows, and locate hotspots. Click any suggested question below or ask me anything!`,
      citations: [],
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const routeNodes = nodes.filter((n) => n.type === 'route');
  const sampleRoute = routeNodes[0]?.name || 'POST /api/orders/checkout';

  const defaultPrompts = [
    `What happens when ${sampleRoute} is called?`,
    'Are there any circular dependencies between modules?',
    'Identify potentially unused exports or dead files',
    'Which modules act as architectural hotspots?',
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (queryText = input) => {
    const text = queryText.trim();
    if (!text || !activeRepo || loading) return;

    setInput('');
    const newMessages = [...messages, { role: 'user', content: text }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await api.askAI(activeRepo._id || activeRepo.id, text, apiKey);
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: res.answer,
          citations: res.citations || [],
        },
      ]);
    } catch (err) {
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: `⚠️ Error processing inquiry: ${err.response?.data?.error || err.message}`,
          citations: [],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-89px)] bg-gh-canvas flex flex-col">
      {/* Top Header */}
      <div className="px-6 py-3 border-b border-gh-border bg-white flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 rounded bg-gh-purpleLight text-gh-purple flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-gh-text">
              AI Codebase Assistant (RAG + Graph Topology)
            </h3>
            <p className="text-[11px] text-gh-textMuted">
              {apiKey ? 'Powered by Google Gemini / OpenAI with Graph-Augmented Retrieval' : 'Running built-in Graph Reasoning Engine (Offline ready)'}
            </p>
          </div>
        </div>

        <button
          onClick={onOpenSettings}
          className="flex items-center space-x-1.5 px-2.5 py-1 text-xs text-gh-textMuted hover:text-gh-text bg-gh-canvas hover:bg-gh-subtle rounded border border-gh-border transition-colors"
        >
          <KeyRound className="w-3 h-3" />
          <span>{apiKey ? 'API Key Active' : 'Configure API Key'}</span>
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 max-w-4xl w-full mx-auto">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex items-start space-x-3 text-xs ${
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-full bg-gh-purple text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div
              className={`rounded-lg p-4 max-w-[85%] border shadow-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-gh-blue text-white border-gh-blue'
                  : 'bg-white text-gh-text border-gh-border'
              }`}
            >
              {/* Message Content rendered simply with markdown-like styling */}
              <div className="space-y-2 whitespace-pre-wrap font-sans">
                {msg.content.split('\n\n').map((paragraph, pIdx) => {
                  if (paragraph.startsWith('### ')) {
                    return (
                      <h4 key={pIdx} className="font-bold text-sm text-gh-text border-b border-gh-borderSubtle pb-1 mt-2">
                        {paragraph.replace('### ', '')}
                      </h4>
                    );
                  }
                  if (paragraph.startsWith('#### ')) {
                    return (
                      <h5 key={pIdx} className="font-semibold text-xs text-gh-text mt-2">
                        {paragraph.replace('#### ', '')}
                      </h5>
                    );
                  }
                  return <p key={pIdx}>{paragraph}</p>;
                })}
              </div>

              {/* Citations Bar */}
              {msg.citations && msg.citations.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gh-borderSubtle space-y-1.5">
                  <div className="text-[10px] font-semibold text-gh-textMuted uppercase tracking-wider flex items-center gap-1">
                    <FileCode className="w-3 h-3 text-gh-blue" />
                    <span>Referenced Code Locations ({msg.citations.length})</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {msg.citations.map((c, cIdx) => (
                      <button
                        key={cIdx}
                        onClick={() => onNavigateToCode(c.filePath, c.line)}
                        className="flex items-center space-x-1 px-2 py-0.5 rounded bg-gh-canvas hover:bg-gh-blueLight/50 text-gh-text hover:text-gh-blue border border-gh-borderSubtle text-[11px] font-mono transition-colors"
                      >
                        <span>{c.filePath}:{c.line}</span>
                        <Code2 className="w-3 h-3 text-gh-textMuted" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {msg.role === 'user' && (
              <div className="w-7 h-7 rounded-full bg-gh-text text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-start space-x-3 text-xs">
            <div className="w-7 h-7 rounded-full bg-gh-purple text-white flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white border border-gh-border rounded-lg p-3 text-gh-textMuted flex items-center space-x-2">
              <Loader2 className="w-4 h-4 animate-spin text-gh-purple" />
              <span>Analyzing AST and tracing dependency paths...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompt Chips */}
      <div className="px-6 py-2 bg-gh-canvas border-t border-gh-borderSubtle">
        <div className="max-w-4xl mx-auto flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
          <span className="text-gh-textMuted shrink-0">Suggested:</span>
          {defaultPrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(p)}
              disabled={loading}
              className="px-2.5 py-1 bg-white hover:bg-gh-subtle text-gh-text rounded-full border border-gh-border whitespace-nowrap transition-colors shadow-2xs disabled:opacity-50"
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Input Bar */}
      <div className="p-4 bg-white border-t border-gh-border">
        <div className="max-w-4xl mx-auto">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center space-x-2"
          >
            <input
              type="text"
              placeholder="Ask anything about the codebase (e.g. What happens when POST /api/auth/login is called?)..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-gh-canvas border border-gh-border rounded-lg text-xs text-gh-text focus:outline-none focus:border-gh-blue focus:bg-white transition-colors"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="px-4 py-2 bg-gh-blue hover:bg-gh-blueHover text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors disabled:opacity-50 shadow-sm"
            >
              <span>Ask</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
