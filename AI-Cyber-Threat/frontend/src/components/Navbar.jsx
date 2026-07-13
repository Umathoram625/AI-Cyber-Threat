import React, { useState } from 'react';
import { Menu, FileDown, ShieldAlert, Wifi, Bell } from 'lucide-react';
import { reportService } from '../services/api';

const Navbar = ({ onMenuClick, title = 'Security Hub' }) => {
  const [downloading, setDownloading] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  
  const handlePdfDownload = async () => {
    try {
      setDownloading(true);
      await reportService.downloadPdfReport();
    } catch (error) {
      console.error('Failed to download PDF report:', error);
      alert('Failed to generate CTI security report.');
    } finally {
      setDownloading(false);
    }
  };

  const dummyAlerts = [
    { id: 1, title: 'LockBit active threat logged', time: '10m ago', type: 'Critical' },
    { id: 2, title: 'System API key refresh executed', time: '1h ago', type: 'Info' },
    { id: 3, title: 'VPN vulnerability exploit in wild', time: '4h ago', type: 'High' }
  ];

  return (
    <header className="sticky top-0 z-10 flex h-16 w-full items-center justify-between border-b border-cyber-border bg-cyber-dark/80 px-6 backdrop-blur-md">
      {/* Left: Mobile Menu Toggle & Title */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="text-slate-400 hover:text-white lg:hidden focus:outline-none p-1.5 rounded bg-slate-800/40 border border-cyber-border"
          aria-label="Toggle Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        
        <h2 className="text-xl font-bold tracking-tight text-white font-sans hidden sm:block">
          {title}
        </h2>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-4">
        {/* Status Indicators */}
        <div className="hidden md:flex items-center gap-4 text-xs font-mono border-r border-cyber-border pr-4 mr-1">
          <div className="flex items-center gap-1.5 text-cyber-emerald">
            <Wifi className="w-4.5 h-4.5" />
            <span>NODE_CONN: ACTIVE</span>
          </div>
          <div className="flex items-center gap-1.5 text-cyber-amber">
            <ShieldAlert className="w-4.5 h-4.5 animate-pulse" />
            <span>DEFCON: 3</span>
          </div>
        </div>

        {/* Global Export PDF Report Button */}
        <button
          onClick={handlePdfDownload}
          disabled={downloading}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg bg-cyber-cyan/10 hover:bg-cyber-cyan/20 text-cyber-cyan border border-cyber-cyan/30 hover:border-cyber-cyan/50 hover:shadow-[0_0_10px_rgba(6,182,212,0.15)] disabled:opacity-50 transition-all duration-150"
        >
          <FileDown className={`w-4 h-4 ${downloading ? 'animate-bounce' : ''}`} />
          <span>{downloading ? 'Compiling PDF...' : 'Export Intelligence PDF'}</span>
        </button>

        {/* Alerts / Bell Indicator */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/40 border border-transparent hover:border-cyber-border transition-colors relative"
            aria-label="View notifications"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-cyber-red"></span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-72 rounded-lg bg-cyber-card border border-cyber-border shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2">
              <h3 className="font-bold text-sm text-white mb-2 pb-1 border-b border-cyber-border flex items-center justify-between">
                <span>Recent Threat Alerts</span>
                <span className="text-[10px] bg-cyber-red/20 text-cyber-red px-1.5 py-0.5 rounded">3 Active</span>
              </h3>
              <div className="space-y-3">
                {dummyAlerts.map(alert => (
                  <div key={alert.id} className="text-xs hover:bg-slate-800/20 p-1.5 rounded transition-colors">
                    <div className="flex justify-between items-center">
                      <span className={`font-semibold ${alert.type === 'Critical' ? 'text-cyber-red' : alert.type === 'High' ? 'text-cyber-amber' : 'text-cyber-cyan'}`}>
                        {alert.type}
                      </span>
                      <span className="text-slate-500 font-mono text-[9px]">{alert.time}</span>
                    </div>
                    <p className="text-slate-300 mt-0.5 truncate">{alert.title}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
