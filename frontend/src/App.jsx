import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import GlobalIntel from './pages/GlobalIntel';
import Sidebar from './components/Sidebar';

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
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/intel" element={
          <ProtectedRoute>
            <GlobalIntel />
          </ProtectedRoute>
        } />

        {/* Placeholder for Archive */}
        <Route path="/archive" element={
          <ProtectedRoute>
            <div className="p-10 text-center text-slate-500 mt-20 flex flex-col items-center justify-center h-full">
               <h2 className="text-2xl font-bold text-white mb-2">Evidence Locker</h2>
               <p className="font-mono text-xs uppercase tracking-widest text-cyan-500">Access Restricted // Level 5 Clearance Required</p>
            </div>
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
};

export default App;