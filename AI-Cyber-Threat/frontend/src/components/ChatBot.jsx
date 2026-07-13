import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, ShieldCheck } from 'lucide-react';
import { chatService } from '../services/api';

const renderMarkdown = (text) => {
  const lines = text.split('\n');
  const elements = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) { elements.push(<br key={i} />); i++; continue; }

    // H3
    if (line.startsWith('### ')) {
      elements.push(<p key={i} className="font-bold text-cyber-cyan mt-2 mb-1">{line.slice(4)}</p>);
      i++; continue;
    }
    // H4
    if (line.startsWith('#### ')) {
      elements.push(<p key={i} className="font-semibold text-slate-300 mt-1 mb-0.5">{line.slice(5)}</p>);
      i++; continue;
    }
    // Numbered list
    if (/^\d+\.\s/.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(<li key={i}>{inlineFormat(lines[i].replace(/^\d+\.\s/, ''))}</li>);
        i++;
      }
      elements.push(<ol key={`ol-${i}`} className="list-decimal list-inside space-y-0.5 pl-1 my-1">{items}</ol>);
      continue;
    }
    // Bullet list
    if (line.startsWith('- ') || line.startsWith('* ')) {
      const items = [];
      while (i < lines.length && (lines[i].startsWith('- ') || lines[i].startsWith('* '))) {
        items.push(<li key={i}>{inlineFormat(lines[i].slice(2))}</li>);
        i++;
      }
      elements.push(<ul key={`ul-${i}`} className="list-disc list-inside space-y-0.5 pl-1 my-1">{items}</ul>);
      continue;
    }
    // Normal paragraph
    elements.push(<p key={i} className="leading-relaxed">{inlineFormat(line)}</p>);
    i++;
  }
  return elements;
};

const inlineFormat = (text) => {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**'))
      return <strong key={i} className="text-white font-semibold">{part.slice(2, -2)}</strong>;
    if (part.startsWith('`') && part.endsWith('`'))
      return <code key={i} className="bg-slate-800 text-cyber-cyan px-1 rounded text-[10px]">{part.slice(1, -1)}</code>;
    return part;
  });
};

const WELCOME_MSG = { role: 'assistant', content: 'Hello! I am your AI CTI co-pilot. Ask me about ransomware, vulnerabilities, phishing campaigns, or security best practices.' };

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([WELCOME_MSG]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(() => localStorage.getItem('chat_session_id'));

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Restore previous session messages only on first open
  useEffect(() => {
    if (!isOpen) return;

    const savedSession = localStorage.getItem('chat_session_id');
    if (savedSession && messages.length === 1) {
      chatService.getSessionDetails(savedSession)
        .then(data => {
          if (data.messages && data.messages.length > 0) {
            setMessages([WELCOME_MSG, ...data.messages.map(m => ({ role: m.role, content: m.content }))]);
          }
        })
        .catch(() => {
          localStorage.removeItem('chat_session_id');
          setSessionId(null);
          setMessages([WELCOME_MSG]);
        });
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (textToSend) => {
    const text = textToSend || input;
    if (!text.trim() || loading) return;

    if (!textToSend) setInput('');

    const userMsg = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await chatService.sendMessage(text, sessionId);

      // Persist session ID so it survives page refresh / chatbot close
      if (res.session_id) {
        setSessionId(res.session_id);
        localStorage.setItem('chat_session_id', res.session_id);
      }

      setMessages(prev => [...prev, { role: 'assistant', content: res.reply }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Error communicating with security model. Check backend services and API configurations.'
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  const quickChips = [
    'Explain LockBit',
    'Mitigate Ransomware',
    'What is CVE-2026-11290?',
    'Show critical threats'
  ];

  return (
    <div className="fixed bottom-6 right-6 z-40 font-sans">
      {/* 1. Toggle Float Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="h-14 w-14 rounded-full bg-cyber-cyan text-white flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.4)] hover:shadow-[0_0_25px_rgba(6,182,212,0.6)] hover:scale-105 active:scale-95 transition-all duration-200"
          aria-label="Open Chatbot Co-pilot"
        >
          <MessageSquare className="w-6 h-6 animate-pulse" />
        </button>
      )}

      {/* 2. Expanded Chat window */}
      {isOpen && (
        <div className="w-80 sm:w-96 h-[500px] rounded-xl glass-panel-glow shadow-2xl flex flex-col overflow-hidden border border-cyber-cyan/30 animate-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="p-4 border-b border-cyber-border bg-slate-900/90 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-cyber-cyan/10 rounded text-cyber-cyan">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-white flex items-center gap-1.5 leading-tight">
                  CTI AI Co-Pilot
                  <span className="h-2 w-2 rounded-full bg-cyber-emerald animate-ping inline-block"></span>
                </h3>
                <span className="text-[10px] text-cyber-gray font-mono">MODEL: SEC-AGENT v1</span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white p-1 hover:bg-slate-800/40 rounded transition-colors"
              aria-label="Close Chat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950/30">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="h-7 w-7 rounded bg-cyber-cyan/10 border border-cyber-cyan/20 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4 text-cyber-cyan" />
                  </div>
                )}
                <div
                  className={`max-w-[75%] rounded-lg p-3 text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-cyber-cyan/15 text-slate-100 border border-cyber-cyan/20 rounded-tr-none'
                      : 'bg-slate-850 text-slate-200 border border-cyber-border rounded-tl-none'
                  }`}
                >
                  <div className="space-y-0.5">{msg.role === 'assistant' ? renderMarkdown(msg.content) : <p>{msg.content}</p>}</div>
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="flex gap-2.5 justify-start">
                <div className="h-7 w-7 rounded bg-cyber-cyan/10 border border-cyber-cyan/20 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-cyber-cyan animate-bounce" />
                </div>
                <div className="bg-slate-850 border border-cyber-border text-slate-400 rounded-lg rounded-tl-none p-3 text-xs">
                  <span className="flex items-center gap-1.5">
                    Querying cyber database...
                    <span className="h-1.5 w-1.5 bg-cyber-cyan rounded-full animate-bounce delay-75"></span>
                    <span className="h-1.5 w-1.5 bg-cyber-cyan rounded-full animate-bounce delay-150"></span>
                    <span className="h-1.5 w-1.5 bg-cyber-cyan rounded-full animate-bounce delay-300"></span>
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions Chips */}
          <div className="px-4 py-2 border-t border-cyber-border bg-slate-900/30 flex gap-2 overflow-x-auto whitespace-nowrap scrollbar-none">
            {quickChips.map(chip => (
              <button
                key={chip}
                onClick={() => handleSend(chip)}
                className="text-[10px] bg-slate-900 hover:bg-cyber-cyan/10 hover:text-cyber-cyan border border-cyber-border hover:border-cyber-cyan/30 text-slate-400 px-2 py-1 rounded-full transition-all duration-150"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Input Panel */}
          <div className="p-3 border-t border-cyber-border bg-slate-900 flex gap-2 items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Ask about active CVEs, lockbit, RCE..."
              className="flex-1 bg-slate-950 border border-cyber-border focus:border-cyber-cyan rounded px-3 py-2 text-xs text-white focus:outline-none placeholder-slate-500 font-sans"
            />
            <button
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              className="p-2 rounded bg-cyber-cyan hover:bg-cyber-cyan/85 disabled:opacity-50 text-white transition-all shadow-[0_0_8px_rgba(6,182,212,0.2)]"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatBot;
