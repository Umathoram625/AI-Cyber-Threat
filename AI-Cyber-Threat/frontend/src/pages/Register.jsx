import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldAlert, User, Mail, Lock, UserPlus, AlertCircle, CheckCircle } from 'lucide-react';
import { authService } from '../services/api';

const Register = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Validations
    if (!fullName || !email || !password || !confirmPassword) {
      setError('Please fill in all security parameter blocks.');
      return;
    }
    
    if (password.length < 6) {
      setError('Access Key (Password) must be at least 6 characters.');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Access Key verification does not match.');
      return;
    }

    setLoading(true);

    try {
      await authService.register(email, password, fullName);
      setSuccess('Operator credentials registered successfully.');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.detail || 
        'Registration denied. Email might already be cataloged in database.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-cyber-dark cyber-grid-bg flex items-center justify-center p-4 relative">
      <div className="absolute top-1/4 left-1/4 h-72 w-72 rounded-full bg-cyber-cyan/10 blur-[80px] cyber-pulse-glow" />
      <div className="absolute bottom-1/4 right-1/4 h-72 w-72 rounded-full bg-cyber-purple/10 blur-[80px] cyber-pulse-glow delay-1000" />
      
      <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="flex flex-col items-center mb-6">
          <div className="h-16 w-16 rounded-xl bg-cyber-cyan/10 border border-cyber-cyan/30 text-cyber-cyan flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.3)] mb-4">
            <UserPlus className="w-8 h-8 animate-pulse" />
          </div>
          <h1 className="text-2xl font-bold tracking-wider text-white text-center leading-tight font-sans">
            REGISTER NEW OPERATOR
          </h1>
          <p className="text-xs text-cyber-gray font-mono mt-1 uppercase tracking-widest">
            AI Cyber Threat Intelligence Assistant
          </p>
        </div>

        {/* Card */}
        <div className="glass-panel rounded-xl p-8 border border-cyber-border shadow-2xl relative overflow-hidden">
          <div className="scanner-beam" />
          
          <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-cyber-cyan" />
            <span>Create Credentials</span>
          </h2>

          {error && (
            <div className="mb-5 p-3 rounded bg-cyber-red/10 border border-cyber-red/35 flex items-start gap-2.5 text-xs text-cyber-red font-sans">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-5 p-3 rounded bg-cyber-emerald/10 border border-cyber-emerald/35 flex items-start gap-2.5 text-xs text-cyber-emerald font-sans animate-bounce">
              <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{success} Redirecting to login terminal...</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-widest text-slate-400 mb-2">
                Operator Full Name
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  placeholder="Agent John Doe"
                  className="w-full bg-slate-950 border border-cyber-border focus:border-cyber-cyan rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none placeholder-slate-600 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-widest text-slate-400 mb-2">
                Operator Email
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
                  placeholder="jdoe@cti.local"
                  className="w-full bg-slate-950 border border-cyber-border focus:border-cyber-cyan rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none placeholder-slate-600 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-widest text-slate-400 mb-2">
                Create Access Key (Password)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Min. 6 characters"
                  className="w-full bg-slate-950 border border-cyber-border focus:border-cyber-cyan rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none placeholder-slate-600 transition-colors"
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
                  placeholder="Verify password"
                  className="w-full bg-slate-950 border border-cyber-border focus:border-cyber-cyan rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none placeholder-slate-600 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !!success}
              className="w-full py-3 px-4 rounded-lg bg-cyber-cyan hover:bg-cyber-cyan/90 text-white text-sm font-semibold tracking-wider flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.2)] hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] disabled:opacity-50 transition-all duration-200 mt-4"
            >
              <span>{loading ? 'Registering...' : 'Register Operator'}</span>
            </button>
          </form>

          <div className="mt-6 text-center border-t border-cyber-border/40 pt-4">
            <span className="text-xs text-slate-400">
              Already cataloged?{' '}
              <Link to="/login" className="text-cyber-cyan hover:underline font-semibold font-sans">
                Establish Session
              </Link>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
