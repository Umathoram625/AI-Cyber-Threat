import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import ThreatDetail from './pages/ThreatDetail';
import Analytics from './pages/Analytics';
import Chat from './pages/Chat';
import Profile from './pages/Profile';
import Admin from './pages/Admin';

// Components
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import ChatBot from './components/ChatBot';
import { authService } from './services/api';

// Route Guards
const PrivateRoute = ({ children }) => {
  return authService.isAuthenticated() ? children : <Navigate to="/login" replace />;
};

const AdminRoute = ({ children }) => {
  return authService.isAuthenticated() && authService.isAdmin() 
    ? children 
    : <Navigate to="/" replace />;
};

// Dynamic Title Helper based on URL path
const LayoutWrapper = () => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const location = useLocation();
  
  const getPageTitle = (pathname) => {
    if (pathname === '/') return 'Operational Command Center';
    if (pathname.startsWith('/threats/')) return 'Cyber Threat Analysis';
    if (pathname === '/analytics') return 'Threat Matrix Analytics';
    if (pathname === '/chat') return 'AI Cyber Threat Assistant';
    if (pathname === '/profile') return 'Security Operator Settings';
    if (pathname === '/admin') return 'Core Network Administration';
    return 'Security Hub';
  };

  return (
    <div className="min-h-screen bg-cyber-dark flex">
      {/* Sidebar Panel Navigation */}
      <Sidebar 
        isMobileOpen={isMobileSidebarOpen} 
        setIsMobileOpen={setIsMobileSidebarOpen} 
      />

      {/* Main view container */}
      <div className="flex-1 flex flex-col min-h-screen lg:pl-64 overflow-x-hidden">
        {/* Top Navbar */}
        <Navbar 
          onMenuClick={() => setIsMobileSidebarOpen(true)} 
          title={getPageTitle(location.pathname)}
        />
        
        {/* Pages Content Viewport */}
        <main className="flex-grow p-6 md:p-8 max-w-7xl w-full mx-auto pb-24">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/threats/:id" element={<ThreatDetail />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        
        {/* Standalone floating ChatBot widget */}
        {location.pathname !== '/chat' && <ChatBot />}
      </div>
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <Routes>
        {/* Public Authentication terminals */}
        <Route path="/login" element={authService.isAuthenticated() ? <Navigate to="/" replace /> : <Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        
        {/* Protected Dashboard pages */}
        <Route 
          path="/*" 
          element={
            <PrivateRoute>
              <LayoutWrapper />
            </PrivateRoute>
          } 
        />
      </Routes>
    </Router>
  );
};

export default App;
