import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, HelpCircle, AlertCircle } from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  LineChart, 
  Line 
} from 'recharts';

import { analyticsService } from '../services/api';
import GlassCard from '../components/GlassCard';
import Skeleton from '../components/Skeleton';

const Analytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const overview = await analyticsService.getOverview();
        setData(overview);
      } catch (err) {
        console.error(err);
        setError('Failed to fetch analytics from central intelligence processor.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300 font-sans">
        <Skeleton className="h-10 w-44" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center bg-slate-900 border border-cyber-border rounded-xl font-sans">
        <AlertCircle className="w-12 h-12 text-cyber-red mx-auto mb-4" />
        <h3 className="text-white font-semibold mb-2">Analytics Failure</h3>
        <p className="text-xs text-slate-400">{error || 'Data empty.'}</p>
      </div>
    );
  }

  const {
    threats_by_country,
    threats_by_category,
    threats_by_severity,
    threats_by_industry,
    threats_by_source,
    threats_by_month
  } = data;

  // Custom styling colors
  const severityColors = {
    Critical: '#ef4444', // Red
    High: '#f59e0b',     // Amber
    Medium: '#06b6d4',   // Cyan
    Low: '#10b981'       // Emerald
  };

  const chartThemeColors = ['#06b6d4', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#3b82f6'];

  return (
    <div className="space-y-6 animate-in fade-in duration-300 font-sans text-slate-200">
      {/* Title */}
      <div className="border-b border-cyber-border pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-cyber-cyan" />
          <span>Threat Intelligence Analytics Node</span>
        </h1>
        <p className="text-xs text-cyber-gray mt-1">
          Aggregated datasets displaying spatial, temporal, and category distribution curves across indexed threats.
        </p>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* 1. Threats by Category (Pie Chart) */}
        <GlassCard hover={false} className="border border-cyber-border">
          <h3 className="text-sm font-bold text-white mb-4 border-b border-cyber-border/40 pb-2">
            Threats by Category
          </h3>
          <div className="h-64 w-full">
            {threats_by_category.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={threats_by_category}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="count"
                    nameKey="category"
                    label={({ category, percent }) => `${category} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {threats_by_category.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={chartThemeColors[index % chartThemeColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                    itemStyle={{ fontSize: '11px', color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">No Category Data</div>
            )}
          </div>
        </GlassCard>

        {/* 2. Threats by Month (Line Chart) */}
        <GlassCard hover={false} className="border border-cyber-border">
          <h3 className="text-sm font-bold text-white mb-4 border-b border-cyber-border/40 pb-2">
            Threat Timeline (Monthly Frequency)
          </h3>
          <div className="h-64 w-full font-mono">
            {threats_by_month.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={threats_by_month}>
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={9} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                    itemStyle={{ fontSize: '11px', color: '#fff' }}
                  />
                  <Line type="monotone" dataKey="count" stroke="#06b6d4" strokeWidth={2} dot={{ fill: '#06b6d4', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">No Timeline Data</div>
            )}
          </div>
        </GlassCard>

        {/* 3. Threats by Country (Horizontal Bar Chart) */}
        <GlassCard hover={false} className="border border-cyber-border">
          <h3 className="text-sm font-bold text-white mb-4 border-b border-cyber-border/40 pb-2">
            Threats by Country Location
          </h3>
          <div className="h-64 w-full font-mono">
            {threats_by_country.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={threats_by_country} layout="vertical">
                  <XAxis type="number" stroke="#94a3b8" fontSize={9} tickLine={false} />
                  <YAxis dataKey="country" type="category" stroke="#94a3b8" fontSize={9} width={80} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                    itemStyle={{ fontSize: '11px', color: '#fff' }}
                  />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">No Geographic Data</div>
            )}
          </div>
        </GlassCard>

        {/* 4. Top Target Industries (Vertical Bar Chart) */}
        <GlassCard hover={false} className="border border-cyber-border">
          <h3 className="text-sm font-bold text-white mb-4 border-b border-cyber-border/40 pb-2">
            Top Targeted Industries
          </h3>
          <div className="h-64 w-full font-mono">
            {threats_by_industry.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={threats_by_industry}>
                  <XAxis dataKey="industry" stroke="#94a3b8" fontSize={8} tickLine={false} angle={-15} textAnchor="end" />
                  <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                    itemStyle={{ fontSize: '11px', color: '#fff' }}
                  />
                  <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">No Industry Target Data</div>
            )}
          </div>
        </GlassCard>

        {/* 5. Severity Distribution (Doughnut Chart) */}
        <GlassCard hover={false} className="border border-cyber-border">
          <h3 className="text-sm font-bold text-white mb-4 border-b border-cyber-border/40 pb-2">
            Indexed Severity Split
          </h3>
          <div className="h-64 w-full">
            {threats_by_severity.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={threats_by_severity}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="count"
                    nameKey="severity"
                  >
                    {threats_by_severity.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={severityColors[entry.severity] || '#64748b'} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                    itemStyle={{ fontSize: '11px', color: '#fff' }}
                  />
                  <Legend 
                    verticalAlign="middle" 
                    align="right" 
                    layout="vertical"
                    iconType="circle"
                    formatter={(value, entry) => (
                      <span className="text-[10px] text-slate-300 font-mono">
                        {value}: {entry.payload.value}
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">No Severity Data</div>
            )}
          </div>
        </GlassCard>

        {/* 6. Active Threat Sources (Horizontal Bar Chart) */}
        <GlassCard hover={false} className="border border-cyber-border">
          <h3 className="text-sm font-bold text-white mb-4 border-b border-cyber-border/40 pb-2">
            Most Active Security Feed Sources
          </h3>
          <div className="h-64 w-full font-mono">
            {threats_by_source.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={threats_by_source} layout="vertical">
                  <XAxis type="number" stroke="#94a3b8" fontSize={9} tickLine={false} />
                  <YAxis dataKey="source" type="category" stroke="#94a3b8" fontSize={9} width={80} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                    itemStyle={{ fontSize: '11px', color: '#fff' }}
                  />
                  <Bar dataKey="count" fill="#ec4899" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">No Source Feed Data</div>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default Analytics;
