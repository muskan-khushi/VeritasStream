import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Globe2, FolderLock, LogOut, Shield, Eye } from 'lucide-react';

const Sidebar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('veritas_token');
    navigate('/');
  };

  const NavItem = ({ to, icon: Icon, label }) => (
    <NavLink 
      to={to} 
      className={({ isActive }) => 
        `flex items-center gap-3 p-3 rounded-xl transition-all duration-300 group
        ${isActive 
          ? 'bg-cyan-900/30 text-cyan-400 border border-cyan-800/50 shadow-[0_0_15px_rgba(6,182,212,0.15)]' 
          : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'
        }`
      }
    >
      <Icon size={20} />
      <span className="font-bold text-sm tracking-wide">{label}</span>
    </NavLink>
  );

  return (
    <div className="w-64 h-screen bg-[#020617] border-r border-white/5 flex flex-col p-6 fixed left-0 top-0 z-50">
      {/* Logo */}
      <div className="mb-10 flex items-center gap-3 text-white">
        <Shield className="text-cyan-500" size={28} />
        <div>
          <h1 className="text-xl font-black tracking-tighter">VERITAS</h1>
          <p className="text-[10px] text-slate-500 tracking-[0.2em] uppercase">Intelligence</p>
        </div>
      </div>

      {/* Menu */}
      <nav className="flex-1 space-y-2">
        <NavItem to="/dashboard" icon={LayoutDashboard} label="Live Dashboard" />
        <NavItem to="/intel" icon={Globe2} label="Global Intel" />
        <NavItem to="/darkweb" icon={Eye} label="Dark Web Monitor" />
        <NavItem to="/archive" icon={FolderLock} label="Evidence Locker" />
      </nav>

      {/* Logout */}
      <button 
        onClick={handleLogout}
        className="flex items-center gap-3 p-3 text-red-500/70 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
      >
        <LogOut size={20} />
        <span className="font-bold text-sm">Disconnect</span>
      </button>
    </div>
  );
};

export default Sidebar;