import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, generateUUID, Case, Customer } from './db';
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
  const customers = useLiveQuery(() => db.customers.toArray()) || [];

  React.useEffect(() => {
    if (!isAuthenticated || customers.length === 0) return;

    const checkAndCreateDefaultCases = async () => {
      for (const customer of customers) {
        const count = await db.cases.where('customerId').equals(customer.customerId).count();
        if (count === 0) {
          let caseCategory = 'その他';
          let caseTitle = customer.mainCategory || '新規案件';
          
          if (customer.mainCategory === '法律関係') {
            caseCategory = '法律関係';
            caseTitle = '法律関係案件';
          } else if (customer.mainCategory === '書類のみの翻訳') {
            caseCategory = '翻訳';
            caseTitle = '書類翻訳案件';
          } else if (customer.mainCategory === '在留カード更新サポート') {
            caseCategory = '査証申請';
            caseTitle = '在留カード更新サポート';
          } else if (customer.mainCategory === '通訳関係') {
            caseCategory = '通訳';
            caseTitle = '通訳案件';
          }
          
          const newCase: Case = {
            caseId: generateUUID(),
            customerId: customer.customerId,
            title: caseTitle,
            category: caseCategory,
            consultationContent: '顧客登録時に自動生成されたデフォルト案件です。',
            background: '',
            actionTaken: '',
            fee: 0,
            paymentStatus: 'unpaid',
            status: 'pending',
            progress: 0,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            syncStatus: 'pending',
          };
          
          await db.cases.put(newCase);
        }
      }
    };

    checkAndCreateDefaultCases();
  }, [customers, isAuthenticated]);

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
