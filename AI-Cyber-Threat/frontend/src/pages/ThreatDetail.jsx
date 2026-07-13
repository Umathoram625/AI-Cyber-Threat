import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Calendar, 
  Globe, 
  Building2, 
  Cpu, 
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  ListTodo,
  ExternalLinkIcon
} from 'lucide-react';
import { threatService } from '../services/api';
import GlassCard from '../components/GlassCard';
import Skeleton from '../components/Skeleton';

const ThreatDetail = () => {
  const { id } = useParams();
  const [threat, setThreat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [relatedThreats, setRelatedThreats] = useState([]);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        const data = await threatService.getThreatDetails(id);
        setThreat(data);
        
        // Fetch related threats in same category
        const related = await threatService.getThreats({ 
          threat_type: data.threat_type, 
          limit: 3 
        });
        setRelatedThreats(related.filter(item => item.id !== data.id));
      } catch (err) {
        console.error(err);
        setError('Failed to fetch threat details from intelligence node.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300 font-sans">
        <Skeleton className="h-10 w-44" />
        <Skeleton className="h-24 w-full" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-48" />
          </div>
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (error || !threat) {
    return (
      <div className="p-8 text-center bg-slate-900 border border-cyber-border rounded-xl font-sans">
        <ShieldAlert className="w-12 h-12 text-cyber-red mx-auto mb-4" />
        <h3 className="text-white font-semibold mb-2">Analysis Decryption Failed</h3>
        <p className="text-xs text-slate-400 mb-4">{error || 'Record not cataloged.'}</p>
        <Link to="/" className="text-cyber-cyan hover:underline inline-flex items-center gap-1.5 text-xs font-mono">
          <ArrowLeft className="w-4 h-4" /> Return to Threat Console
        </Link>
      </div>
    );
  }

  const {
    title,
    source,
    published_date,
    country,
    description,
    threat_type,
    organization,
    malware_name,
    cve_ids,
    url,
    ai_summary,
    severity,
    attack_type,
    industry_target,
    risk_score,
    preventive_actions,
    mitre_attack_mapping
  } = threat;

  const dateFormatted = new Date(published_date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300 font-sans text-slate-200">
      {/* Return button */}
      <div>
        <Link 
          to="/" 
          className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-cyber-cyan" />
          <span>Back to Console</span>
        </Link>
      </div>

      {/* Header Info Panel */}
      <GlassCard hover={false} glowColor={severity === 'Critical' ? 'red' : severity === 'High' ? 'cyan' : ''} className="border border-cyber-border">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-[10px] uppercase font-mono tracking-widest bg-slate-950 border border-cyber-border px-2.5 py-1 rounded text-cyber-cyan">
              {threat_type}
            </span>
            <span className={`text-[10px] font-bold font-sans tracking-wide uppercase px-2.5 py-1 rounded border ${
              severity === 'Critical' ? 'text-cyber-red bg-cyber-red/10 border-cyber-red/35' :
              severity === 'High' ? 'text-cyber-amber bg-cyber-amber/10 border-cyber-amber/35' : 'text-cyber-cyan bg-cyber-cyan/10 border-cyber-cyan/35'
            }`}>
              {severity} Severity
            </span>
            {cve_ids?.map(cve => (
              <span key={cve} className="text-[10px] font-mono tracking-wider bg-slate-900 border border-slate-750 px-2.5 py-1 rounded text-white font-bold">
                {cve.toUpperCase()}
              </span>
            ))}
          </div>
          
          <div className="text-[10px] font-mono text-slate-400 flex items-center gap-2">
            <span>FEED_SOURCE: {source.toUpperCase()}</span>
          </div>
        </div>

        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-4 leading-tight">
          {title}
        </h1>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-slate-400 pt-3 border-t border-cyber-border/40">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-cyber-cyan shrink-0" />
            <span>{dateFormatted}</span>
          </div>
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-cyber-cyan shrink-0" />
            <span>Country: {country}</span>
          </div>
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-cyber-cyan shrink-0" />
            <span>Target: {industry_target || 'General'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyber-cyan shrink-0" />
            <span>Malware Family: {malware_name || 'None'}</span>
          </div>
        </div>
      </GlassCard>

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Columns: Summaries and Actions */}
        <div className="lg:col-span-2 space-y-6">
          {/* AI Analysis Summary */}
          <GlassCard hover={false} className="border border-cyber-border">
            <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2 border-b border-cyber-border/40 pb-3">
              <ShieldCheck className="w-5 h-5 text-cyber-cyan" />
              <span>Decrypted AI Threat Intelligence Summary</span>
            </h2>
            <div className="text-sm leading-relaxed text-slate-300 whitespace-pre-wrap space-y-3">
              {ai_summary ? (
                <p>{ai_summary}</p>
              ) : (
                <p>{description}</p>
              )}
            </div>
            
            {url && (
              <div className="mt-5 pt-4 border-t border-cyber-border/40">
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-cyber-cyan hover:underline font-mono"
                >
                  <span>Verify Original Intelligence Source Feed</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}
          </GlassCard>

          {/* Preventive Actions */}
          <GlassCard hover={false} className="border border-cyber-border">
            <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2 border-b border-cyber-border/40 pb-3">
              <ListTodo className="w-5 h-5 text-cyber-cyan" />
              <span>Recommended Incident Mitigation Controls</span>
            </h2>
            
            {preventive_actions && preventive_actions.length > 0 ? (
              <ul className="space-y-3">
                {preventive_actions.map((action, idx) => (
                  <li key={idx} className="text-xs sm:text-sm text-slate-350 flex items-start gap-2.5 leading-relaxed">
                    <span className="h-5 w-5 rounded bg-cyber-emerald/10 border border-cyber-emerald/20 text-cyber-emerald flex items-center justify-center shrink-0 font-bold font-mono text-[10px] mt-0.5">
                      {idx + 1}
                    </span>
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-500 font-sans">
                No recommended mitigations reported. Follow general security policies.
              </p>
            )}
          </GlassCard>

          {/* Related Threat Feeds */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white font-mono uppercase tracking-widest">Related Threat Records</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {relatedThreats.map(t => (
                <GlassCard key={t.id} className="border border-cyber-border p-4">
                  <span className="text-[9px] bg-slate-900 border border-cyber-border px-1.5 py-0.5 rounded text-cyber-cyan font-mono uppercase">
                    {t.threat_type}
                  </span>
                  <h4 className="text-xs font-semibold text-white mt-2 mb-2 hover:text-cyber-cyan truncate">
                    <Link to={`/threats/${t.id}`}>{t.title}</Link>
                  </h4>
                  <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono">
                    <span>Severity: {t.severity}</span>
                    <span>Risk: {t.risk_score}/100</span>
                  </div>
                </GlassCard>
              ))}
              {relatedThreats.length === 0 && (
                <p className="text-xs text-slate-650 font-sans">No additional correlated threat categories logged.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Severity progress and MITRE */}
        <div className="space-y-6">
          {/* Risk Gauge */}
          <GlassCard hover={false} className="border border-cyber-border flex flex-col items-center p-6 text-center">
            <h3 className="text-xs font-mono uppercase tracking-widest text-slate-400 mb-5 self-start">
              Risk Score Indicator
            </h3>

            <div className="relative flex items-center justify-center h-32 w-32 mb-4">
              {/* SVG circular track */}
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="52"
                  className="stroke-slate-800"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="52"
                  className={`${
                    risk_score >= 80 ? 'stroke-cyber-red' :
                    risk_score >= 60 ? 'stroke-cyber-amber' : 'stroke-cyber-cyan'
                  }`}
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={2 * Math.PI * 52}
                  strokeDashoffset={2 * Math.PI * 52 * (1 - risk_score / 100)}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-3xl font-extrabold text-white font-mono leading-none">{risk_score}</span>
                <span className="text-[9px] text-cyber-gray uppercase font-mono tracking-widest mt-1">INDEX VALUE</span>
              </div>
            </div>

            <div className="text-center">
              <span className="text-xs text-slate-300 font-sans">
                {risk_score >= 80 ? 'CRITICAL EXPOSURE PROTOCOL' :
                 risk_score >= 60 ? 'HIGH MONITORING MANDATORY' : 'STANDARD ENHANCED CONTROLS'}
              </span>
            </div>
          </GlassCard>

          {/* MITRE ATT&CK mapping */}
          <GlassCard hover={false} className="border border-cyber-border">
            <h3 className="text-xs font-mono uppercase tracking-widest text-slate-400 mb-4 border-b border-cyber-border/40 pb-2">
              MITRE ATT&CK Matrix Mapping
            </h3>
            
            <div className="space-y-4">
              <div className="p-3 bg-slate-950/80 rounded border border-cyber-border font-mono text-xs">
                <span className="text-cyber-cyan block text-[9px] uppercase tracking-wider mb-1 font-bold">
                  Technique Reference:
                </span>
                <span className="text-slate-200 font-bold font-mono">
                  {mitre_attack_mapping || 'Unclassified ATT&CK Pattern'}
                </span>
              </div>

              <div className="p-3 bg-slate-950/80 rounded border border-cyber-border font-mono text-xs">
                <span className="text-cyber-cyan block text-[9px] uppercase tracking-wider mb-1 font-bold">
                  Impacted Systems:
                </span>
                <span className="text-slate-200 font-bold">
                  {organization || 'General Systems Infrastructure'}
                </span>
              </div>

              <div className="p-3 bg-slate-950/80 rounded border border-cyber-border font-mono text-xs">
                <span className="text-cyber-cyan block text-[9px] uppercase tracking-wider mb-1 font-bold">
                  Exploited Vectors (Attack Type):
                </span>
                <span className="text-slate-200 font-bold">
                  {attack_type || 'Unknown Vector'}
                </span>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

export default ThreatDetail;
