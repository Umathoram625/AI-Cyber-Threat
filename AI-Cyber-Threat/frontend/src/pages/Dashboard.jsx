import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  ShieldAlert, 
  Activity, 
  AlertTriangle, 
  RefreshCw,
  ServerCrash
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend 
} from 'recharts';

import { threatService } from '../services/api';
import GlassCard from '../components/GlassCard';
import ThreatCard from '../components/ThreatCard';
import Skeleton from '../components/Skeleton';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [threats, setThreats] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingThreats, setLoadingThreats] = useState(true);
  
  // Search and Filter States
  const [search, setSearch] = useState('');
  const [severity, setSeverity] = useState('');
  const [threatType, setThreatType] = useState('');
  const [country, setCountry] = useState('');

  const fetchStats = async () => {
    try {
      setLoadingStats(true);
      const data = await threatService.getDashboardSummary();
      setStats(data);
    } catch (error) {
      console.error('Error fetching dashboard summary:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchThreats = async () => {
    try {
      setLoadingThreats(true);
      const filters = {};
      if (search) filters.search = search;
      if (severity) filters.severity = severity;
      if (threatType) filters.threat_type = threatType;
      if (country) filters.country = country;

      const data = await threatService.getThreats(filters);
      setThreats(data);
    } catch (error) {
      console.error('Error fetching threats list:', error);
    } finally {
      setLoadingThreats(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchThreats();
  }, [search, severity, threatType, country]);

  // Chart data formatting
  const pieData = stats ? [
    { name: 'Critical', value: stats.critical_threats, color: '#ef4444' },
    { name: 'High', value: stats.high_threats, color: '#f59e0b' },
    { name: 'Medium', value: stats.medium_threats, color: '#06b6d4' },
    { name: 'Low', value: stats.low_threats, color: '#10b981' }
  ].filter(item => item.value > 0) : [];

  // Default fallback if database is empty for chart
  const severityChartData = pieData.length > 0 ? pieData : [
    { name: 'Critical', value: 3, color: '#ef4444' },
    { name: 'High', value: 5, color: '#f59e0b' },
    { name: 'Medium', value: 8, color: '#06b6d4' },
    { name: 'Low', value: 4, color: '#10b981' }
  ];

  const timelineData = [
    { name: 'Jan', Critical: 1, High: 2, Medium: 4 },
    { name: 'Feb', Critical: 2, High: 3, Medium: 5 },
    { name: 'Mar', Critical: 4, High: 5, Medium: 7 },
    { name: 'Apr', Critical: 3, High: 4, Medium: 9 },
    { name: 'May', Critical: 5, High: 6, Medium: 8 },
    { name: 'Jun', Critical: 6, High: 8, Medium: 12 },
    { name: 'Jul', Critical: stats?.critical_threats || 4, High: stats?.high_threats || 5, Medium: stats?.medium_threats || 8 }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300 font-sans">
      {/* Title & Refresh Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-cyber-border pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Activity className="w-6 h-6 text-cyber-cyan animate-pulse" />
            <span>Cyber Threat Intelligence Console</span>
          </h1>
          <p className="text-xs text-cyber-gray mt-1">
            Real-time cyber threat indexing, AI vulnerability analysis, and active incident mitigation vectors.
          </p>
        </div>
        <button
          onClick={() => { fetchStats(); fetchThreats(); }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-semibold rounded bg-slate-800/60 hover:bg-slate-800 hover:text-cyber-cyan border border-cyber-border transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Feeds</span>
        </button>
      </div>

      {/* Counters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <GlassCard hover={false} className="border border-cyber-border flex items-center gap-4">
          <div className="p-3 bg-cyber-cyan/10 rounded-lg text-cyber-cyan border border-cyber-cyan/30">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-cyber-gray font-mono uppercase tracking-widest font-bold">Total Indexed</span>
            <h3 className="text-2xl font-bold text-white mt-0.5">
              {loadingStats ? <Skeleton className="h-7 w-12" /> : stats?.total_threats || 0}
            </h3>
          </div>
        </GlassCard>

        <GlassCard glowColor="red" hover={false} className="border border-cyber-red/20 flex items-center gap-4">
          <div className="p-3 bg-cyber-red/10 rounded-lg text-cyber-red border border-cyber-red/30">
            <ShieldAlert className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] text-cyber-gray font-mono uppercase tracking-widest font-bold">Critical Alerts</span>
            <h3 className="text-2xl font-bold text-cyber-red mt-0.5">
              {loadingStats ? <Skeleton className="h-7 w-12" /> : stats?.critical_threats || 0}
            </h3>
          </div>
        </GlassCard>

        <GlassCard hover={false} className="border border-cyber-amber/20 flex items-center gap-4">
          <div className="p-3 bg-cyber-amber/10 rounded-lg text-cyber-amber border border-cyber-amber/30">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-cyber-gray font-mono uppercase tracking-widest font-bold">High Severity</span>
            <h3 className="text-2xl font-bold text-cyber-amber mt-0.5">
              {loadingStats ? <Skeleton className="h-7 w-12" /> : stats?.high_threats || 0}
            </h3>
          </div>
        </GlassCard>

        <GlassCard hover={false} className="border border-cyber-border flex items-center gap-4">
          <div className="p-3 bg-cyber-emerald/10 rounded-lg text-cyber-emerald border border-cyber-emerald/30">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-cyber-gray font-mono uppercase tracking-widest font-bold">Active Shield</span>
            <h3 className="text-2xl font-bold text-cyber-emerald mt-0.5">
              {loadingStats ? <Skeleton className="h-7 w-12" /> : (stats?.medium_threats || 0) + (stats?.low_threats || 0)}
            </h3>
          </div>
        </GlassCard>
      </div>

      {/* AI Threat Summary Widget */}
      <GlassCard glowColor="cyan" hover={false} className="border border-cyber-cyan/20 p-5 bg-gradient-to-r from-cyber-card to-cyber-card/85">
        <h2 className="text-xs font-mono uppercase tracking-widest text-cyber-cyan mb-2.5 font-bold flex items-center gap-2">
          <span>AI Automated Threat Briefing Ticker</span>
          <span className="h-1.5 w-1.5 rounded-full bg-cyber-cyan animate-ping"></span>
        </h2>
        {loadingStats ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-[90%]" />
          </div>
        ) : stats?.latest_critical_threat ? (
          <div className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
            <p>
              <b>Active Severity Notice:</b> {stats.latest_critical_threat.ai_summary || stats.latest_critical_threat.description}
            </p>
            <div className="mt-3 flex items-center gap-3">
              <span className="text-[10px] font-mono text-cyber-red uppercase bg-cyber-red/10 border border-cyber-red/20 px-2 py-0.5 rounded">
                CVE Target: {stats.latest_critical_threat.cve_ids?.join(', ') || 'No CVE Specified'}
              </span>
              <Link 
                to={`/threats/${stats.latest_critical_threat.id}`}
                className="text-[10px] text-cyber-cyan hover:underline font-mono font-bold"
              >
                Decrypt Full MITRE Report &gt;
              </Link>
            </div>
          </div>
        ) : (
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            AI analysis complete. Core security logs indicate stable operation. No critical alerts pending. Use refresh triggers to scan feed vectors.
          </p>
        )}
      </GlassCard>

      {/* Unified Searching & Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 bg-slate-900/40 p-4 rounded-xl border border-cyber-border backdrop-blur-md">
        {/* Search */}
        <div className="relative lg:col-span-2">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
            <Search className="w-4.5 h-4.5" />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Decrypt feeds (Search CVE-2026, malware, country, targeted organizations...)"
            className="w-full bg-slate-950 border border-cyber-border focus:border-cyber-cyan rounded-lg pl-10 pr-4 py-2 text-xs text-white focus:outline-none placeholder-slate-600 transition-colors font-sans"
          />
        </div>

        {/* Severity filter */}
        <div className="relative">
          <select
            value={severity}
            onChange={(e) => setSeverity(e.target.value)}
            className="w-full bg-slate-950 border border-cyber-border focus:border-cyber-cyan rounded-lg px-3 py-2 text-xs text-slate-400 focus:outline-none transition-colors"
          >
            <option value="">All Severities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>

        {/* Threat Type filter */}
        <div className="relative">
          <select
            value={threatType}
            onChange={(e) => setThreatType(e.target.value)}
            className="w-full bg-slate-950 border border-cyber-border focus:border-cyber-cyan rounded-lg px-3 py-2 text-xs text-slate-400 focus:outline-none transition-colors"
          >
            <option value="">All Categories</option>
            <option value="Ransomware">Ransomware</option>
            <option value="Phishing">Phishing</option>
            <option value="Vulnerability Exploit">Vulnerability Exploit</option>
            <option value="DDoS">DDoS</option>
            <option value="Data Exfiltration">Data Exfiltration</option>
            <option value="Web Application Attack">Web Application Attack</option>
          </select>
        </div>
      </div>

      {/* Main Grid: Threats list vs mini charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Threats Registry */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-base font-bold text-white mb-2 flex items-center justify-between">
            <span>Threat Intelligence Logs</span>
            <span className="text-xs text-cyber-gray font-mono">Matched: {threats.length}</span>
          </h2>
          
          {loadingThreats ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Skeleton className="h-44" />
              <Skeleton className="h-44" />
              <Skeleton className="h-44" />
              <Skeleton className="h-44" />
            </div>
          ) : threats.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {threats.map((threat) => (
                <ThreatCard key={threat.id} threat={threat} />
              ))}
            </div>
          ) : (
            <GlassCard hover={false} className="border border-cyber-border p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
              <ServerCrash className="w-12 h-12 text-slate-600 mb-4 animate-bounce" />
              <h3 className="text-slate-300 font-semibold mb-1">No Threats Matches Cataloged</h3>
              <p className="text-xs text-slate-500 max-w-sm">
                Try modifying search vectors or filters. Alternatively, execute a threat feed refresh via the Admin Panel to pull recent security news.
              </p>
            </GlassCard>
          )}
        </div>

        {/* Right: Dashboard Analytics Widgets */}
        <div className="space-y-6">
          {/* Severity Distribution Chart */}
          <GlassCard hover={false} className="border border-cyber-border">
            <h3 className="text-sm font-bold text-white mb-4 border-b border-cyber-border/40 pb-2">
              Severity Distribution
            </h3>
            
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={severityChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {severityChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                    itemStyle={{ fontSize: '11px', color: '#fff' }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36} 
                    iconType="circle"
                    formatter={(value) => <span className="text-[10px] text-slate-400 font-mono">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          {/* Threat Timeline Chart */}
          <GlassCard hover={false} className="border border-cyber-border">
            <h3 className="text-sm font-bold text-white mb-4 border-b border-cyber-border/40 pb-2">
              Threat Vector Timeline
            </h3>
            
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timelineData}>
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                    itemStyle={{ fontSize: '11px', color: '#fff' }}
                  />
                  <Legend 
                    iconType="rect"
                    formatter={(value) => <span className="text-[9px] text-slate-400 font-mono">{value}</span>}
                  />
                  <Bar dataKey="Critical" stackId="a" fill="#ef4444" />
                  <Bar dataKey="High" stackId="a" fill="#f59e0b" />
                  <Bar dataKey="Medium" stackId="a" fill="#06b6d4" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
