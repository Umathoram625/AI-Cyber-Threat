import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, HelpCircle, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import { authService } from '../services/api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [simulatedUrl, setSimulatedUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSimulatedUrl('');
    
    if (!email) return;
    
    setLoading(true);

    try {
      const res = await authService.forgotPassword(email);
      setSuccess(res.message);
      if (res.simulated_reset_url) {
        setSimulatedUrl(res.simulated_reset_url);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to request password reset. Verify email configuration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-cyber-dark cyber-grid-bg flex items-center justify-center p-4 relative">
      <div className="absolute top-1/4 left-1/4 h-72 w-72 rounded-full bg-cyber-cyan/10 blur-[80px] cyber-pulse-glow" />
      
      <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in-95 duration-300">
        <div className="flex flex-col items-center mb-6">
          <div className="h-16 w-16 rounded-xl bg-cyber-cyan/10 border border-cyber-cyan/30 text-cyber-cyan flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.3)] mb-4">
            <HelpCircle className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-wider font-sans text-white text-center leading-tight">
            RECOVER ACCESS KEY
          </h1>
          <p className="text-xs text-cyber-gray font-mono mt-1 uppercase tracking-widest text-center">
            AI Cyber Threat Intelligence Assistant
          </p>
        </div>

        <div className="glass-panel rounded-xl p-8 border border-cyber-border shadow-2xl relative overflow-hidden">
          <div className="scanner-beam" />
          
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <span>Access Reset</span>
          </h2>
          
          <p className="text-xs text-slate-400 mb-6 font-sans">
            Provide the registered email associated with your operator account. A simulated security token link will be output.
          </p>

          {error && (
            <div className="mb-5 p-3 rounded bg-cyber-red/10 border border-cyber-red/35 flex items-start gap-2.5 text-xs text-cyber-red">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-5 p-4 rounded bg-cyber-emerald/10 border border-cyber-emerald/35 text-xs text-slate-200 space-y-3">
              <div className="flex items-start gap-2.5 text-cyber-emerald font-semibold">
                <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{success}</span>
              </div>
              
              {simulatedUrl && (
                <div className="p-3 bg-slate-950 rounded border border-cyber-border mt-2 overflow-x-auto">
                  <p className="text-[10px] text-cyber-gray font-mono uppercase tracking-widest mb-1.5 font-bold">
                    Simulated Sandbox Recovery Link:
                  </p>
                  <a 
                    href={simulatedUrl}
                    className="text-cyber-cyan hover:underline font-mono text-[10px] break-all block"
                  >
                    {simulatedUrl}
                  </a>
                  <p className="text-[9px] text-slate-500 mt-2">
                    Click the link above to establish a new password for testing.
                  </p>
                </div>
              )}
            </div>
          )}

          {!success && (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-mono uppercase tracking-widest text-slate-400 mb-2">
                  Operator Email Address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="operator@cti.local"
                    className="w-full bg-slate-950 border border-cyber-border focus:border-cyber-cyan rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none placeholder-slate-600 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-lg bg-cyber-cyan hover:bg-cyber-cyan/90 text-white text-sm font-semibold tracking-wider flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.2)] disabled:opacity-50 transition-all duration-200 mt-2"
              >
                <span>{loading ? 'Processing Reset...' : 'Request Recovery'}</span>
              </button>
            </form>
          )}

          <div className="mt-6 text-center border-t border-cyber-border/40 pt-4">
            <Link 
              to="/login" 
              className="text-xs text-slate-400 hover:text-white flex items-center justify-center gap-1.5 font-sans"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Login terminal</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
