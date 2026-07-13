import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, ShieldAlert, Cpu, Building2, Globe } from 'lucide-react';
import GlassCard from './GlassCard';

const ThreatCard = ({ threat }) => {
  const { id, title, published_date, country, threat_type, severity, risk_score, malware_name, industry_target } = threat;
  
  // Format published date
  const dateFormatted = new Date(published_date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  // Severity color rules
  const getSeverityStyles = (sev) => {
    switch (sev) {
      case 'Critical':
        return { text: 'text-cyber-red', bg: 'bg-cyber-red/10 border-cyber-red/20', glow: 'red' };
      case 'High':
        return { text: 'text-cyber-amber', bg: 'bg-cyber-amber/10 border-cyber-amber/20', glow: 'amber' };
      case 'Medium':
        return { text: 'text-cyber-cyan', bg: 'bg-cyber-cyan/10 border-cyber-cyan/20', glow: 'cyan' };
      default:
        return { text: 'text-cyber-emerald', bg: 'bg-cyber-emerald/10 border-cyber-emerald/20', glow: 'emerald' };
    }
  };

  const sevStyles = getSeverityStyles(severity);

  return (
    <GlassCard 
      glowColor={severity === 'Critical' ? 'red' : severity === 'High' ? 'cyan' : ''}
      className="flex flex-col justify-between h-full border border-cyber-border hover:border-slate-700/80 transition-all duration-300"
    >
      <div>
        {/* Card Header: Type badge & Severity badge */}
        <div className="flex justify-between items-center gap-2 mb-3">
          <span className="text-[10px] uppercase font-mono tracking-widest bg-slate-800 border border-cyber-border px-2 py-0.5 rounded text-slate-300">
            {threat_type}
          </span>
          <span className={`text-[10px] font-bold font-sans tracking-wide uppercase px-2 py-0.5 rounded border ${sevStyles.text} ${sevStyles.bg}`}>
            {severity}
          </span>
        </div>

        {/* Title */}
        <Link to={`/threats/${id}`} className="block group">
          <h3 className="text-base font-semibold leading-snug text-white group-hover:text-cyber-cyan transition-colors line-clamp-2 mb-3">
            {title}
          </h3>
        </Link>
        
        {/* Risk Score indicator */}
        <div className="mb-4">
          <div className="flex justify-between text-xs font-mono text-slate-400 mb-1">
            <span>Risk Index:</span>
            <span className="font-bold text-white">{risk_score}/100</span>
          </div>
          <div className="h-1.5 w-full bg-slate-850 rounded-full overflow-hidden border border-slate-800">
            <div 
              className={`h-full rounded-full ${
                risk_score >= 80 ? 'bg-cyber-red shadow-[0_0_8px_rgba(239,68,68,0.5)]' :
                risk_score >= 60 ? 'bg-cyber-amber shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'bg-cyber-cyan'
              }`}
              style={{ width: `${risk_score}%` }}
            />
          </div>
        </div>

        {/* Metadata Details */}
        <div className="grid grid-cols-2 gap-y-2 gap-x-1.5 text-xs text-slate-400 font-sans border-t border-cyber-border/40 pt-3 mb-4">
          <div className="flex items-center gap-1.5 truncate">
            <Calendar className="w-3.5 h-3.5 text-cyber-cyan shrink-0" />
            <span className="truncate">{dateFormatted}</span>
          </div>
          <div className="flex items-center gap-1.5 truncate">
            <Globe className="w-3.5 h-3.5 text-cyber-cyan shrink-0" />
            <span className="truncate">{country}</span>
          </div>
          <div className="flex items-center gap-1.5 truncate">
            <Building2 className="w-3.5 h-3.5 text-cyber-cyan shrink-0" />
            <span className="truncate">{industry_target || 'General'}</span>
          </div>
          <div className="flex items-center gap-1.5 truncate">
            <Cpu className="w-3.5 h-3.5 text-cyber-cyan shrink-0" />
            <span className="truncate font-mono">{malware_name || 'None'}</span>
          </div>
        </div>
      </div>

      {/* Action Trigger */}
      <Link 
        to={`/threats/${id}`}
        className="w-full text-center py-2 px-4 rounded bg-slate-800/80 hover:bg-cyber-cyan/15 hover:text-cyber-cyan border border-cyber-border hover:border-cyber-cyan/30 text-xs font-semibold tracking-wider text-slate-200 transition-all duration-200"
      >
        Decrypt Analysis
      </Link>
    </GlassCard>
  );
};

export default ThreatCard;
