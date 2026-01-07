import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import GlobalIntel from './pages/GlobalIntel';
import Sidebar from './components/Sidebar';
import EvidenceLocker from './pages/EvidenceLocker'; 
import DarkWeb from './pages/DarkWeb';

// Layout wrapper for authenticated pages (Adds the Sidebar)
const AppLayout = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-[#020617] text-slate-200">
      <Sidebar />
      <main className="flex-1 ml-64 overflow-hidden relative">
        {children}
      </main>
    </div>
  );
};

// Protected Route Logic (Checks for token)
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('veritas_token');
  // If no token, kick them back to Login
  if (!token) return <Navigate to="/login" replace />;
  return <AppLayout>{children}</AppLayout>;
};

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Protected Routes (Wrapped in Layout) */}
        
        {/* 1. DASHBOARD */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        
        {/* 2. GLOBAL INTEL (Map) */}
        <Route path="/intel" element={
          <ProtectedRoute>
            <GlobalIntel />
          </ProtectedRoute>
        } />

        {/* 3. DARK WEB MONITOR */}
        <Route path="/darkweb" element={
          <ProtectedRoute>
            <DarkWeb />
          </ProtectedRoute>
        } />

        {/* 4. EVIDENCE LOCKER (Real Database) */}
        <Route path="/archive" element={
          <ProtectedRoute>
            <EvidenceLocker />
          </ProtectedRoute>
        } />

      </Routes>
    </BrowserRouter>
  );
};

export default App;