import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Users, 
  Settings, 
  Terminal, 
  RefreshCw, 
  Save, 
  Trash2, 
  CheckCircle, 
  AlertCircle,
  Key
} from 'lucide-react';
import { adminService } from '../services/api';
import GlassCard from '../components/GlassCard';
import Skeleton from '../components/Skeleton';

const Admin = () => {
  const [activeTab, setActiveTab] = useState('config'); // config, users, logs
  
  // API Config settings
  const [newsdataKey, setNewsdataKey] = useState('');
  const [serperKey, setSerperKey] = useState('');
  const [openaiKey, setOpenaiKey] = useState('');
  const [openaiModel, setOpenaiModel] = useState('gpt-4o-mini');
  
  // Lists
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  
  // Loading & statuses
  const [loading, setLoading] = useState(true);
  const [refreshingFeeds, setRefreshingFeeds] = useState(false);
  const [savingKeys, setSavingKeys] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const fetchKeys = async () => {
    try {
      const keys = await adminService.getKeys();
      setNewsdataKey(keys.newsdata_api_key || '');
      setSerperKey(keys.serper_api_key || '');
      setOpenaiKey(keys.openai_api_key || '');
      setOpenaiModel(keys.openai_model || 'gpt-4o-mini');
    } catch (err) {
      console.error('Failed to load system config keys:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      const data = await adminService.getUsers();
      setUsers(data);
    } catch (err) {
      console.error('Failed to load operator users accounts:', err);
    }
  };

  const fetchLogs = async () => {
    try {
      const data = await adminService.getLogs();
      setLogs(data);
    } catch (err) {
      console.error('Failed to load system logs:', err);
    }
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchKeys(), fetchUsers(), fetchLogs()]);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefreshNews = async () => {
    try {
      setRefreshingFeeds(true);
      setSuccessMsg('');
      setErrorMsg('');
      const res = await adminService.refreshNews();
      setSuccessMsg(res.message);
      // Wait a few seconds and fetch logs again to show ingestion
      setTimeout(fetchLogs, 3000);
    } catch (err) {
      setErrorMsg('Failed to queue threat intelligence refresh.');
    } finally {
      setRefreshingFeeds(false);
    }
  };

  const handleSaveKeys = async (e) => {
    e.preventDefault();
    try {
      setSavingKeys(true);
      setSuccessMsg('');
      setErrorMsg('');
      await adminService.updateKeys({
        newsdata_api_key: newsdataKey,
        serper_api_key: serperKey,
        openai_api_key: openaiKey,
        openai_model: openaiModel
      });
      setSuccessMsg('API Dynamic Config keys updated successfully.');
    } catch (err) {
      setErrorMsg('Failed to save configuration keys.');
    } finally {
      setSavingKeys(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Confirm deletion of operator profile? This action is immutable.')) return;
    try {
      setErrorMsg('');
      setSuccessMsg('');
      const res = await adminService.deleteUser(userId);
      setSuccessMsg(res.message);
      fetchUsers();
      fetchLogs();
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Failed to delete operator user account.');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300 font-sans">
        <Skeleton className="h-10 w-44" />
        <Skeleton className="h-44 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 font-sans text-slate-200">
      
      {/* Title */}
      <div className="border-b border-cyber-border pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <ShieldAlert className="w-6 h-6 text-cyber-cyan" />
          <span>System Administration Node</span>
        </h1>
        <p className="text-xs text-cyber-gray mt-1">
          Perform administrative database operations, configure external AI models, audit operators list, and review system warning logs.
        </p>
      </div>

      {/* Dynamic messages */}
      {successMsg && (
        <div className="p-3 rounded bg-cyber-emerald/10 border border-cyber-emerald/35 flex items-start gap-2.5 text-xs text-cyber-emerald">
          <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-3 rounded bg-cyber-red/10 border border-cyber-red/35 flex items-start gap-2.5 text-xs text-cyber-red">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Tabs list */}
      <div className="flex gap-2 border-b border-cyber-border/40 pb-px shrink-0 overflow-x-auto">
        <button
          onClick={() => setActiveTab('config')}
          className={`px-4 py-2 text-xs font-semibold font-mono tracking-wider border-b-2 transition-all ${
            activeTab === 'config'
              ? 'border-cyber-cyan text-cyber-cyan bg-cyber-cyan/5'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          API CONFIG & REFRESH
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 text-xs font-semibold font-mono tracking-wider border-b-2 transition-all ${
            activeTab === 'users'
              ? 'border-cyber-cyan text-cyber-cyan bg-cyber-cyan/5'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          OPERATOR ACCOUNTS
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2 text-xs font-semibold font-mono tracking-wider border-b-2 transition-all ${
            activeTab === 'logs'
              ? 'border-cyber-cyan text-cyber-cyan bg-cyber-cyan/5'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          SECURITY AUDIT LOGS
        </button>
      </div>

      {/* Tab Panel contents */}
      <div className="space-y-6">
        
        {/* TAB 1: Config keys */}
        {activeTab === 'config' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <GlassCard hover={false} className="border border-cyber-border">
                <h3 className="text-sm font-bold text-white mb-5 flex items-center gap-2 border-b border-cyber-border/40 pb-3">
                  <Key className="w-4.5 h-4.5 text-cyber-cyan" />
                  <span>Configure Third-Party Dynamic Access Keys</span>
                </h3>
                
                <form onSubmit={handleSaveKeys} className="space-y-4">
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-widest text-slate-400 mb-2">
                      NewsData.io Intelligence API Key
                    </label>
                    <input
                      type="password"
                      value={newsdataKey}
                      onChange={(e) => setNewsdataKey(e.target.value)}
                      placeholder="Input newsdata key (optional)"
                      className="w-full bg-slate-950 border border-cyber-border focus:border-cyber-cyan rounded-lg px-4 py-2 text-sm text-white focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase tracking-widest text-slate-400 mb-2">
                      Serper Search API Key
                    </label>
                    <input
                      type="password"
                      value={serperKey}
                      onChange={(e) => setSerperKey(e.target.value)}
                      placeholder="Input serper key (optional)"
                      className="w-full bg-slate-950 border border-cyber-border focus:border-cyber-cyan rounded-lg px-4 py-2 text-sm text-white focus:outline-none transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-mono uppercase tracking-widest text-slate-400 mb-2">
                        OpenAI NLP API Key
                      </label>
                      <input
                        type="password"
                        value={openaiKey}
                        onChange={(e) => setOpenaiKey(e.target.value)}
                        placeholder="Input openai key (optional)"
                        className="w-full bg-slate-950 border border-cyber-border focus:border-cyber-cyan rounded-lg px-4 py-2 text-sm text-white focus:outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-mono uppercase tracking-widest text-slate-400 mb-2">
                        GPT Analysis Model
                      </label>
                      <input
                        type="text"
                        value={openaiModel}
                        onChange={(e) => setOpenaiModel(e.target.value)}
                        placeholder="gpt-4o-mini"
                        className="w-full bg-slate-950 border border-cyber-border focus:border-cyber-cyan rounded-lg px-4 py-2 text-sm text-white focus:outline-none transition-colors font-mono"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={savingKeys}
                    className="flex items-center gap-2 px-5 py-2.5 bg-cyber-cyan hover:bg-cyber-cyan/90 text-white font-semibold text-xs uppercase tracking-wider rounded-lg transition-all shadow-[0_0_10px_rgba(6,182,212,0.15)] disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{savingKeys ? 'Saving...' : 'Commit Settings'}</span>
                  </button>
                </form>
              </GlassCard>
            </div>

            {/* Manual ingest controls */}
            <div className="space-y-6">
              <GlassCard hover={false} glowColor="cyan" className="border border-cyber-cyan/20">
                <h3 className="text-sm font-bold text-white mb-4 border-b border-cyber-border/40 pb-2">
                  Intelligence Feed Ingestion
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-5">
                  Execute manual fetch operations. If API keys are empty, this pulls simulated articles and triggers rule-based NLP classifiers to seed the local catalog.
                </p>
                <button
                  onClick={handleRefreshNews}
                  disabled={refreshingFeeds}
                  className="w-full py-3 px-4 rounded-lg bg-cyber-cyan/15 hover:bg-cyber-cyan/25 text-cyber-cyan border border-cyber-cyan/40 hover:border-cyber-cyan flex items-center justify-center gap-2 transition-all font-semibold uppercase text-xs tracking-wider"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshingFeeds ? 'animate-spin' : ''}`} />
                  <span>{refreshingFeeds ? 'Triggering Fetcher...' : 'Refresh Intel Catalog'}</span>
                </button>
              </GlassCard>
            </div>
          </div>
        )}

        {/* TAB 2: Users Control list */}
        {activeTab === 'users' && (
          <GlassCard hover={false} className="border border-cyber-border">
            <h3 className="text-sm font-bold text-white mb-5 flex items-center gap-2 border-b border-cyber-border/40 pb-3">
              <Users className="w-4.5 h-4.5 text-cyber-cyan" />
              <span>Registered Systems Operators</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-cyber-border font-mono text-cyber-gray uppercase text-[10px] tracking-wider bg-slate-950/40">
                    <th className="py-3 px-4">Operator Name</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Security Level (Role)</th>
                    <th className="py-3 px-4">Created Date</th>
                    <th className="py-3 px-4 text-center">Terminate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cyber-border/40">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-800/10">
                      <td className="py-3.5 px-4 font-semibold text-white">{u.full_name}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-400">{u.email}</td>
                      <td className="py-3.5 px-4 uppercase">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${u.role === 'admin' ? 'bg-cyber-red/10 border border-cyber-red/25 text-cyber-red' : 'bg-slate-800 border border-cyber-border text-slate-350'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">{new Date(u.created_at).toLocaleDateString()}</td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          disabled={u.email === 'admin@cti.local'}
                          className="text-red-400 hover:text-red-300 disabled:opacity-30 p-1 hover:bg-red-500/10 rounded transition-colors"
                          title="Revoke Credentials"
                        >
                          <Trash2 className="w-4.5 h-4.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        )}

        {/* TAB 3: System Logs audit trail */}
        {activeTab === 'logs' && (
          <GlassCard hover={false} className="border border-cyber-border">
            <div className="flex justify-between items-center mb-4 border-b border-cyber-border/40 pb-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Terminal className="w-4.5 h-4.5 text-cyber-cyan" />
                <span>Node Security Audit Trail Logs</span>
              </h3>
              <button
                onClick={fetchLogs}
                className="text-[10px] font-mono text-cyber-cyan hover:underline"
              >
                Clear/Fetch Fresh Logs
              </button>
            </div>

            <div className="bg-slate-950 p-4 rounded-lg border border-cyber-border font-mono text-xs overflow-y-auto max-h-[400px] space-y-3 scrollbar-none">
              {logs.map((log) => {
                let lvlColor = 'text-cyber-cyan';
                if (log.level === 'WARNING') lvlColor = 'text-cyber-amber';
                if (log.level === 'ERROR') lvlColor = 'text-cyber-red';
                
                return (
                  <div key={log.id} className="border-b border-slate-900 pb-2 leading-relaxed flex flex-col md:flex-row gap-2 md:gap-4">
                    <span className="text-slate-600 shrink-0 select-none">
                      [{new Date(log.timestamp).toISOString().replace('T', ' ').substring(0, 19)}]
                    </span>
                    <span className={`${lvlColor} shrink-0 font-bold select-none`}>
                      [{log.level}]
                    </span>
                    <span className="text-slate-400 shrink-0 select-none font-bold">
                      [{log.component}]
                    </span>
                    <span className="text-slate-300 break-all">
                      {log.message}
                    </span>
                  </div>
                );
              })}
              {logs.length === 0 && (
                <div className="text-slate-600 text-center py-6">
                  Log registry empty. Audit log buffers initialized.
                </div>
              )}
            </div>
          </GlassCard>
        )}
      </div>
    </div>
  );
};

export default Admin;
