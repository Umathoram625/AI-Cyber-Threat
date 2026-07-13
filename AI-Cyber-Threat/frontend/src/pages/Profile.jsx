import React, { useState } from 'react';
import { User, Lock, Save, ShieldAlert, Key, UserCog, CheckCircle, AlertCircle } from 'lucide-react';
import { authService } from '../services/api';
import GlassCard from '../components/GlassCard';

const Profile = () => {
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : { full_name: 'CTI Operator', email: 'operator@cti.local', role: 'user' };

  const [fullName, setFullName] = useState(user.full_name);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password && password.length < 6) {
      setError('New Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Password confirmation does not match.');
      return;
    }

    setLoading(true);

    try {
      await authService.updateProfile(fullName, password || null);
      setSuccess('Profile successfully updated.');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to update operator profile.');
    } finally {
      setLoading(false);
    }
  };

  const jwtToken = localStorage.getItem('token') || '';
  const maskedToken = jwtToken ? `${jwtToken.substring(0, 15)}...${jwtToken.substring(jwtToken.length - 15)}` : 'None';

  return (
    <div className="space-y-6 animate-in fade-in duration-300 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-cyber-border pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <UserCog className="w-6 h-6 text-cyber-cyan" />
            <span>Operator Terminal Settings</span>
          </h1>
          <p className="text-xs text-cyber-gray mt-1">
            Configure authorization keys, verify credentials, and review node encryption metrics.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Form update */}
        <div className="lg:col-span-2 space-y-6">
          <GlassCard border="border-cyber-border">
            <h2 className="text-base font-bold text-white mb-5 flex items-center gap-2 border-b border-cyber-border/40 pb-3">
              <User className="w-5 h-5 text-cyber-cyan" />
              <span>Identity Configuration</span>
            </h2>

            {error && (
              <div className="mb-5 p-3 rounded bg-cyber-red/10 border border-cyber-red/35 flex items-start gap-2.5 text-xs text-cyber-red">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="mb-5 p-3 rounded bg-cyber-emerald/10 border border-cyber-emerald/35 flex items-start gap-2.5 text-xs text-cyber-emerald">
                <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleUpdate} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-widest text-slate-400 mb-2">
                    Email Identifier (Read Only)
                  </label>
                  <input
                    type="text"
                    value={user.email}
                    disabled
                    className="w-full bg-slate-950 border border-cyber-border/60 rounded-lg px-4 py-2 text-sm text-slate-500 font-mono focus:outline-none cursor-not-allowed"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-mono uppercase tracking-widest text-slate-400 mb-2">
                    Operator Display Name
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-cyber-border focus:border-cyber-cyan rounded-lg px-4 py-2 text-sm text-white focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="border-t border-cyber-border/40 pt-4 mt-2">
                <h3 className="text-xs font-mono uppercase tracking-widest text-cyber-cyan mb-4 font-bold flex items-center gap-1.5">
                  <Lock className="w-4 h-4" />
                  <span>Update Cryptographic Access Key (Password)</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-widest text-slate-400 mb-2">
                      New Key
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Leave empty to retain current key"
                      className="w-full bg-slate-950 border border-cyber-border focus:border-cyber-cyan rounded-lg px-4 py-2 text-sm text-white focus:outline-none transition-colors placeholder-slate-650"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase tracking-widest text-slate-400 mb-2">
                      Confirm Key
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Verify new key"
                      className="w-full bg-slate-950 border border-cyber-border focus:border-cyber-cyan rounded-lg px-4 py-2 text-sm text-white focus:outline-none transition-colors placeholder-slate-650"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-cyber-cyan hover:bg-cyber-cyan/90 text-white text-sm font-semibold shadow-[0_0_12px_rgba(6,182,212,0.15)] disabled:opacity-50 transition-all"
              >
                <Save className="w-4 h-4" />
                <span>{loading ? 'Executing updates...' : 'Save Parameters'}</span>
              </button>
            </form>
          </GlassCard>
        </div>

        {/* Right Column: Key details */}
        <div className="space-y-6">
          <GlassCard glowColor="cyan" border="border-cyber-cyan/20">
            <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2 border-b border-cyber-border/40 pb-3">
              <Key className="w-5 h-5 text-cyber-cyan animate-pulse" />
              <span>Token Audit Log</span>
            </h2>

            <div className="space-y-4 text-xs font-mono">
              <div className="bg-slate-950/60 p-3 rounded border border-cyber-border">
                <span className="text-cyber-gray block uppercase text-[10px] tracking-wider mb-1 font-bold">
                  ACTIVE AUTH_JWT:
                </span>
                <span className="text-slate-300 break-all text-[10px] select-all">
                  {maskedToken}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-950/60 p-3 rounded border border-cyber-border">
                  <span className="text-cyber-gray block uppercase text-[10px] tracking-wider mb-1 font-bold">
                    ROLE_CLAIM:
                  </span>
                  <span className="text-cyber-cyan uppercase font-bold text-sm">
                    {user.role}
                  </span>
                </div>
                <div className="bg-slate-950/60 p-3 rounded border border-cyber-border">
                  <span className="text-cyber-gray block uppercase text-[10px] tracking-wider mb-1 font-bold">
                    DEFCON LEVEL:
                  </span>
                  <span className="text-cyber-amber uppercase font-bold text-sm">
                    3 (Amber)
                  </span>
                </div>
              </div>

              <div className="bg-slate-950/60 p-3 rounded border border-cyber-border flex items-start gap-2.5 text-slate-400">
                <ShieldAlert className="w-5 h-5 text-cyber-cyan shrink-0 mt-0.5 animate-pulse" />
                <p className="font-sans leading-relaxed text-[11px]">
                  Sessions terminate automatically after 24 hours. Under DEFCON-3 protocols, audit logging monitors outbound exports and AI queries.
                </p>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

export default Profile;
