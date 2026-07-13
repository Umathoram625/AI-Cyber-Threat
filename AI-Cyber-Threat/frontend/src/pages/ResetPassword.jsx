import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Lock, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { authService } from '../services/api';

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const email = searchParams.get('email') || '';
  const token = searchParams.get('token') || '';

  useEffect(() => {
    if (!email || !token) {
      setError('Invalid or expired password reset parameters.');
    }
  }, [email, token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!newPassword || !confirmPassword) return;

    if (newPassword.length < 6) {
      setError('Access Key must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      await authService.resetPassword(email, token, newPassword);
      setSuccess('Access Key updated successfully.');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to execute password reset.');
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
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-wider font-sans text-white text-center leading-tight">
            ESTABLISH NEW ACCESS KEY
          </h1>
          <p className="text-xs text-cyber-gray font-mono mt-1 uppercase tracking-widest text-center">
            AI Cyber Threat Intelligence Assistant
          </p>
        </div>

        <div className="glass-panel rounded-xl p-8 border border-cyber-border shadow-2xl relative overflow-hidden">
          <div className="scanner-beam" />
          
          <h2 className="text-lg font-bold text-white mb-4">
            <span>Reset Access Key</span>
          </h2>
          
          <p className="text-xs text-slate-400 mb-6 font-mono font-bold uppercase truncate bg-slate-950 px-2.5 py-1.5 rounded border border-cyber-border">
            TARGET: {email || 'No target specified'}
          </p>

          {error && (
            <div className="mb-5 p-3 rounded bg-cyber-red/10 border border-cyber-red/35 flex items-start gap-2.5 text-xs text-cyber-red">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-5 p-3 rounded bg-cyber-emerald/10 border border-cyber-emerald/35 flex items-start gap-2.5 text-xs text-cyber-emerald animate-bounce">
              <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{success} Redirecting to login terminal...</span>
            </div>
          )}

          {!success && email && token && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-widest text-slate-400 mb-2">
                  New Access Key (Password)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    placeholder="Min. 6 characters"
                    className="w-full bg-slate-950 border border-cyber-border focus:border-cyber-cyan rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none placeholder-slate-650 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-widest text-slate-400 mb-2">
                  Confirm Access Key
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Verify key password"
                    className="w-full bg-slate-950 border border-cyber-border focus:border-cyber-cyan rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none placeholder-slate-650 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-lg bg-cyber-cyan hover:bg-cyber-cyan/90 text-white text-sm font-semibold tracking-wider flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.2)] disabled:opacity-50 transition-all duration-200 mt-2"
              >
                <span>{loading ? 'Re-keying Account...' : 'Set Access Key'}</span>
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

export default ResetPassword;
