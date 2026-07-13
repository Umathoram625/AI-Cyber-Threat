import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  Send, 
  Plus, 
  MessageSquare, 
  ShieldCheck, 
  Cpu, 
  Terminal,
  Clock,
  Sparkles
} from 'lucide-react';
import { chatService } from '../services/api';
import GlassCard from '../components/GlassCard';
import Skeleton from '../components/Skeleton';

const Chat = () => {
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Cyber Threat Intelligence model activated. I am authorized to decrypt security concepts, analyze CVE indicators, map MITRE ATT&CK techniques, and recommend mitigations. Ask me anything.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(true);
  
  const messagesEndRef = useRef(null);

  const fetchSessions = async () => {
    try {
      setLoadingSessions(true);
      const data = await chatService.getSessions();
      setSessions(data);
    } catch (error) {
      console.error('Error fetching chat sessions:', error);
    } finally {
      setLoadingSessions(false);
    }
  };

  const loadSessionDetails = async (sessionId) => {
    try {
      setLoading(true);
      setCurrentSessionId(sessionId);
      const data = await chatService.getSessionDetails(sessionId);
      setMessages(data.messages);
    } catch (error) {
      console.error('Error loading session logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (textToSend) => {
    const text = textToSend || input;
    if (!text.trim() || loading) return;

    if (!textToSend) setInput('');

    // Add user message locally
    const userMsg = { role: 'user', content: text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await chatService.sendMessage(text, currentSessionId);
      
      // Update session ID if it was newly created
      if (!currentSessionId) {
        setCurrentSessionId(res.session_id);
        fetchSessions(); // Reload sessions sidebar
      }
      
      const assistantMsg = { role: 'assistant', content: res.reply, timestamp: new Date() };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Error: Connection reset. Please verify API configuration in Admin Panel.' 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const startNewChat = () => {
    setCurrentSessionId(null);
    setMessages([
      { role: 'assistant', content: 'Established new isolated analysis thread. Input query or select quick tag.' }
    ]);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  const quickPrompts = [
    { title: 'Explain Zero-Day', desc: 'Detail vulnerabilities without patches' },
    { title: 'Ransomware Protection', desc: 'List active prevention techniques' },
    { title: 'Explain Phishing', desc: 'Social engineering defenses' },
    { title: 'SQL Injection Mitigation', desc: 'Secure database practices' }
  ];

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col md:flex-row gap-5 font-sans text-slate-200 animate-in fade-in duration-300">
      
      {/* Left Column: Sessions History sidebar */}
      <div className="w-full md:w-64 shrink-0 flex flex-col h-1/3 md:h-full bg-slate-900/40 rounded-xl border border-cyber-border overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-cyber-border bg-slate-950/40 flex justify-between items-center shrink-0">
          <h3 className="font-bold text-sm text-white flex items-center gap-1.5 font-sans">
            <Clock className="w-4 h-4 text-cyber-cyan" />
            <span>Analysis History</span>
          </h3>
          <button
            onClick={startNewChat}
            className="p-1 rounded bg-cyber-cyan/10 hover:bg-cyber-cyan/20 border border-cyber-cyan/30 text-cyber-cyan transition-colors"
            title="Create New Thread"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Sessions list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {loadingSessions ? (
            <div className="space-y-2">
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
            </div>
          ) : sessions.length > 0 ? (
            sessions.map((s) => (
              <button
                key={s.session_id}
                onClick={() => loadSessionDetails(s.session_id)}
                className={`w-full text-left p-2.5 rounded-lg border text-xs flex items-start gap-2.5 transition-all truncate duration-150 ${
                  currentSessionId === s.session_id
                    ? 'bg-cyber-cyan/10 text-cyber-cyan border-cyber-cyan/35'
                    : 'bg-slate-950/40 text-slate-400 border-transparent hover:border-cyber-border hover:text-white'
                }`}
              >
                <MessageSquare className="w-4.5 h-4.5 shrink-0 mt-0.5" />
                <span className="truncate block pr-2">{s.summary}</span>
              </button>
            ))
          ) : (
            <div className="text-center py-6 text-xs text-slate-500 font-sans">
              No historical session logs.
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Active Chat area */}
      <div className="flex-1 flex flex-col h-2/3 md:h-full bg-slate-900/20 rounded-xl border border-cyber-border overflow-hidden">
        {/* Chat Header */}
        <div className="p-4 border-b border-cyber-border bg-slate-950/30 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-cyber-cyan/10 rounded border border-cyber-cyan/30 text-cyber-cyan animate-pulse">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white font-sans">
                AI CTI Assistant Co-Pilot
              </h3>
              <p className="text-[10px] text-cyber-gray font-mono">
                SECURE CONSOLE ID: {currentSessionId ? `NODE_SESSION_${currentSessionId.substring(0,6).toUpperCase()}` : 'NODE_ISOLATED'}
              </p>
            </div>
          </div>
        </div>

        {/* Message Panel */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-950/20">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex gap-3.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="h-8 w-8 rounded-lg bg-cyber-cyan/10 border border-cyber-cyan/20 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4.5 h-4.5 text-cyber-cyan" />
                </div>
              )}
              <div
                className={`max-w-[75%] rounded-xl p-3.5 text-xs sm:text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-cyber-cyan/15 text-slate-100 border border-cyber-cyan/20 rounded-tr-none'
                    : 'bg-slate-850 text-slate-200 border border-cyber-border rounded-tl-none'
                }`}
              >
                <p className="whitespace-pre-line">{msg.content}</p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3.5 justify-start">
              <div className="h-8 w-8 rounded-lg bg-cyber-cyan/10 border border-cyber-cyan/20 flex items-center justify-center shrink-0">
                <Bot className="w-4.5 h-4.5 text-cyber-cyan animate-bounce" />
              </div>
              <div className="bg-slate-850 border border-cyber-border text-slate-450 rounded-xl rounded-tl-none p-3.5 text-xs">
                <span className="flex items-center gap-1.5 font-mono">
                  Decrypting threat vectors...
                  <span className="h-1.5 w-1.5 bg-cyber-cyan rounded-full animate-bounce delay-75"></span>
                  <span className="h-1.5 w-1.5 bg-cyber-cyan rounded-full animate-bounce delay-150"></span>
                  <span className="h-1.5 w-1.5 bg-cyber-cyan rounded-full animate-bounce delay-300"></span>
                </span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Chips suggestions (Visible only in new chats or as prompts helper) */}
        {messages.length === 1 && (
          <div className="px-5 py-4 border-t border-cyber-border bg-slate-950/20 shrink-0">
            <h4 className="text-[10px] text-cyber-gray font-mono uppercase tracking-widest font-bold mb-3 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-cyber-cyan" />
              <span>Suggested Intel Inquiries</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {quickPrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(p.title)}
                  className="text-left p-3 rounded-lg bg-slate-900/60 hover:bg-cyber-cyan/10 border border-cyber-border hover:border-cyber-cyan/30 transition-all group"
                >
                  <h5 className="text-xs font-semibold text-white group-hover:text-cyber-cyan transition-colors">{p.title}</h5>
                  <p className="text-[10px] text-slate-500 mt-0.5">{p.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input box */}
        <div className="p-4 border-t border-cyber-border bg-slate-900 shrink-0 flex gap-3 items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Interrogate security database (e.g. ransomware prevention steps, explain zero-day)..."
            className="flex-1 bg-slate-950 border border-cyber-border focus:border-cyber-cyan rounded-lg px-4 py-3 text-xs sm:text-sm text-white focus:outline-none placeholder-slate-655"
          />
          <button
            onClick={() => handleSend()}
            disabled={loading || !input.trim()}
            className="p-3 rounded-lg bg-cyber-cyan hover:bg-cyber-cyan/85 disabled:opacity-50 text-white transition-all shadow-[0_0_12px_rgba(6,182,212,0.2)]"
          >
            <Send className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
