import React from 'react';
import { CUCOMProvider, useCUCOM } from './context/CUCOMContext';
import { LoginPage } from './components/cucom/LoginPage';
import { Navbar } from './components/cucom/Navbar';
import { PageHeader } from './components/cucom/PageHeader';
import { StaffReportForm } from './components/cucom/StaffReportForm';
import { ManagementDashboard } from './components/cucom/ManagementDashboard';
import { MasterLogView } from './components/cucom/MasterLogView';
import { StaffInstructionsView } from './components/cucom/StaffInstructionsView';
import { AdminAnalyticsDashboard } from './components/cucom/AdminAnalyticsDashboard';
import { AdminRemindersView } from './components/cucom/AdminRemindersView';
import { AdminUserManagementView } from './components/cucom/AdminUserManagementView';
import { Building2, FileSpreadsheet, ShieldCheck } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { currentUser, activeView } = useCUCOM();

  // If not logged in, render dedicated Login screen
  if (!currentUser) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200 selection:bg-red-600 selection:text-white">
      {/* 1. FIXED / FLOATING LEFT-SIDE NAVBAR WITH ROUNDED BORDERS */}
      <Navbar />

      {/* 2. MAIN APPLICATION CONTENT WRAPPER (Starts cleanly beside floating rounded navbar: md:pl-72) */}
      <div className="flex-1 flex flex-col min-w-0 md:pl-72 transition-all duration-200 p-2 sm:p-3 space-y-3">
        
        {/* 2A. PAGE HEADER (Rounded-3xl container, sticky top) */}
        <PageHeader />

        {/* 2B. MAIN CONTENT: Active Layout Component */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-2 space-y-6">
          {activeView === 'USERS' && <AdminUserManagementView />}
          {activeView === 'DASHBOARD' && <ManagementDashboard />}
          {activeView === 'ANALYTICS' && <AdminAnalyticsDashboard />}
          {activeView === 'REMINDERS' && <AdminRemindersView />}
          {activeView === 'REPORT' && <StaffReportForm />}
          {activeView === 'MASTER_LOG' && <MasterLogView />}
          {activeView === 'INSTRUCTIONS' && <StaffInstructionsView />}
        </main>

        {/* 2C. OFFICIAL INSTITUTIONAL FOOTER WITH ROUNDED BORDERS */}
        <footer className="bg-white/90 dark:bg-[#111827]/90 backdrop-blur-md border border-slate-200/90 dark:border-slate-800 rounded-3xl py-4 mt-auto transition-colors duration-200 shadow-2xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2.5">
              <img src="/cucom-crest.png" alt="CUCOM Crest" className="h-5 w-auto object-contain" />
              <span className="font-bold text-slate-800 dark:text-slate-200">
                Commonwealth University College of Medicine (CUCOM)
              </span>
              <span className="hidden sm:inline text-slate-300 dark:text-slate-700">|</span>
              <span className="hidden sm:inline text-slate-500 dark:text-slate-400">
                Daily Reporting System & Management Dashboard
              </span>
            </div>
            <div className="flex items-center gap-4 text-[11px] text-slate-400 dark:text-slate-500">
              <span className="flex items-center gap-1">
                <FileSpreadsheet className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                Preserved Excel & Master Log Standard
              </span>
              <span className="flex items-center gap-1 text-red-700 dark:text-red-400 font-bold">
                <ShieldCheck className="w-3.5 h-3.5" />
                Compliance Verified
              </span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export function App() {
  return (
    <CUCOMProvider>
      <MainLayout />
    </CUCOMProvider>
  );
}

export default App;
