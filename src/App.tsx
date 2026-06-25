import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { Navbar } from './components/layout/Navbar';
import { Login } from './views/Login';
import { Dashboard } from './views/Dashboard';
import { Customers } from './views/Customers';
import { CustomerDetail } from './views/CustomerDetail';
import { Cases } from './views/Cases';
import { CaseDetail } from './views/CaseDetail';
import { EvidencePage } from './views/Evidence';

const AppContent: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 border-4 border-indigo-900/30 border-t-indigo-900 rounded-full animate-spin" />
          <span className="text-xs font-bold text-slate-500">M-A Work JP Loading...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-850">
        <Navbar />
        
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/customers/:id" element={<CustomerDetail />} />
            <Route path="/cases" element={<Cases />} />
            <Route path="/cases/:id" element={<CaseDetail />} />
            <Route path="/evidence" element={<EvidencePage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        
        <footer className="bg-white border-t border-slate-100 py-6 text-center text-[10px] text-slate-400 font-semibold">
          <div>&copy; {new Date().getFullYear()} M-A Work JP 業務管理システム. All rights reserved.</div>
        </footer>
      </div>
    </Router>
  );
};

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </LanguageProvider>
  );
}
