import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BarChart3, 
  MessageSquareCode, 
  ShieldAlert, 
  UserCog, 
  LogOut, 
  Shield,
  Activity
} from 'lucide-react';
import { authService } from '../services/api';

const Sidebar = ({ isMobileOpen, setIsMobileOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = authService.isAdmin();
  
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : { full_name: 'CTI Operator', role: 'user' };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard, roleRequired: 'user' },
    { name: 'Analytics', path: '/analytics', icon: BarChart3, roleRequired: 'user' },
    { name: 'AI Chatbot', path: '/chat', icon: MessageSquareCode, roleRequired: 'user' },
    { name: 'Admin Panel', path: '/admin', icon: ShieldAlert, roleRequired: 'admin' },
    { name: 'Settings', path: '/profile', icon: UserCog, roleRequired: 'user' },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-cyber-card border-r border-cyber-border text-slate-200">
      {/* Title Header */}
      <div className="p-6 border-b border-cyber-border flex items-center gap-3">
        <div className="p-2 bg-cyber-cyan/10 rounded-lg text-cyber-cyan border border-cyber-cyan/30 shadow-[0_0_10px_rgba(6,182,212,0.2)]">
          <Shield className="w-6 h-6 animate-pulse" />
        </div>
        <div>
          <h1 className="font-bold text-lg leading-tight tracking-wider text-white font-sans">CTI ASSISTANT</h1>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="h-2 w-2 rounded-full bg-cyber-emerald animate-ping"></span>
            <span className="text-[10px] text-cyber-gray font-mono uppercase tracking-widest flex items-center gap-1">
              Active Monitoring <Activity className="w-3 h-3 text-cyber-emerald inline" />
            </span>
          </div>
        </div>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          if (item.roleRequired === 'admin' && !isAdmin) return null;
          
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <NavLink
              key={item.name}
              to={item.path}
              onClick={() => setIsMobileOpen(false)}
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all group duration-200
                ${isActive 
                  ? 'bg-cyber-cyan/10 text-cyber-cyan border border-cyber-cyan/30 shadow-[0_0_15px_rgba(6,182,212,0.1)]' 
                  : 'hover:bg-slate-800/50 text-slate-400 hover:text-white border border-transparent'
                }
              `}
            >
              <Icon className={`w-5 h-5 transition-transform duration-200 group-hover:scale-105 ${isActive ? 'text-cyber-cyan' : 'text-slate-400 group-hover:text-cyber-cyan'}`} />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Profile */}
      <div className="p-4 border-t border-cyber-border bg-slate-950/40">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="h-10 w-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-cyber-cyan uppercase shadow-inner">
            {user.full_name.charAt(0)}
          </div>
          <div className="overflow-hidden">
            <h4 className="font-semibold text-sm truncate text-white leading-tight">{user.full_name}</h4>
            <span className="text-[10px] text-cyber-gray font-mono uppercase bg-slate-800 px-1.5 py-0.5 rounded border border-cyber-border inline-block mt-1">
              {user.role}
            </span>
          </div>
        </div>
        
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all duration-150"
        >
          <LogOut className="w-5 h-5" />
          <span>Terminate Session</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 z-20">
        {sidebarContent}
      </aside>

      {/* Mobile Backdrop & Drawer */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
      <aside 
        className={`
          fixed inset-y-0 left-0 w-64 z-40 lg:hidden transform transition-transform duration-300 ease-in-out
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {sidebarContent}
      </aside>
    </>
  );
};

export default Sidebar;
