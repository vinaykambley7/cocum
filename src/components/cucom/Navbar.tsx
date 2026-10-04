import React, { useState } from 'react';
import { useCUCOM } from '../../context/CUCOMContext';
import { MANAGER_STAFF_IDS } from '../../data/cucomAccounts';
import { 
  Building2, 
  Clock, 
  Calendar, 
  FileText, 
  BarChart3, 
  Table, 
  BookOpen, 
  ShieldCheck, 
  Users, 
  Search, 
  X, 
  ChevronDown, 
  AlertTriangle, 
  CheckCircle2, 
  LogOut, 
  TrendingUp, 
  Sun, 
  Moon, 
  Sparkles,
  ArrowRight,
  ChevronRight,
  UserCheck,
  Briefcase,
  Mail
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { 
    currentUser, 
    logout, 
    staffList, 
    currentStaff, 
    isAdmin, 
    setCurrentStaff, 
    setIsAdmin, 
    activeView, 
    setActiveView, 
    selectedDate, 
    deadlineFormatted, 
    staffScope, 
    theme, 
    toggleTheme, 
    getMetricsForDate,
    isMobileNavOpen,
    setIsMobileNavOpen
  } = useCUCOM();

  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('ALL');

  const metrics = getMetricsForDate(selectedDate);
  
  // Filter for Manager-level personnel only (25 Candidates)
  const managerStaff = staffList.filter(s => MANAGER_STAFF_IDS.includes(s.id));
  const departments = ['ALL', ...Array.from(new Set(managerStaff.map(s => s.department)))];

  const filteredStaff = managerStaff.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          s.designation.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.department.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = selectedDeptFilter === 'ALL' || s.department === selectedDeptFilter;
    return matchesSearch && matchesDept;
  });

  const handleSelectNav = (view: typeof activeView) => {
    setActiveView(view);
    setIsMobileNavOpen(false);
  };

  const handleLogout = () => {
    logout();
    setIsMobileNavOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop Overlay (Active only on small screens when mobile nav is open) */}
      {isMobileNavOpen && (
        <div 
          onClick={() => setIsMobileNavOpen(false)}
          className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-xs z-40 transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* ================= FIXED LEFT-SIDE NAVBAR WITH ROUNDED BORDERS ================= */}
      <aside 
        className={`fixed z-40 bg-white/95 dark:bg-[#111827]/95 backdrop-blur-md flex flex-col justify-between font-sans transition-all duration-200 ease-in-out shadow-xl shadow-slate-200/50 dark:shadow-black/60
          /* Desktop: Floating rounded side navbar with rounded-3xl borders */
          md:top-3 md:left-3 md:bottom-3 md:w-64 md:h-[calc(100vh-1.5rem)] md:rounded-3xl md:border md:border-slate-200/90 md:dark:border-slate-800 md:overflow-hidden
          /* Mobile Drawer: Floating rounded drawer */
          top-3 left-3 bottom-3 w-72 max-w-[calc(100vw-24px)] rounded-3xl border border-slate-200/90 dark:border-slate-800 overflow-hidden ${
          isMobileNavOpen ? 'translate-x-0' : '-translate-x-[115%] md:translate-x-0'
        }`}
      >
        {/* Top: Brand Header & University Monogram */}
        <div className="p-4 border-b border-slate-200/80 dark:border-slate-800/80 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-10 w-10 rounded-2xl bg-white p-1 border border-slate-200 dark:border-slate-700 shadow-xs flex items-center justify-center shrink-0">
                <img src="/cucom-crest.png" alt="CUCOM Crest" className="h-8 w-auto object-contain" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-slate-900 dark:text-white text-base tracking-tight uppercase">
                    CUCOM
                  </span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 font-extrabold border border-red-200 dark:border-red-900">
                    PORTAL
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold truncate max-w-[130px]">
                  Commonwealth Univ.
                </p>
              </div>
            </div>

            {/* Mobile close button */}
            <button
              onClick={() => setIsMobileNavOpen(false)}
              className="md:hidden p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Institutional Status Badge */}
          <div className="mt-3 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between text-[11px]">
            <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
              <span>Due: {deadlineFormatted}</span>
            </span>
            <span className="text-[10px] font-bold text-red-700 dark:text-red-400 uppercase">
              {staffScope === 'ALL_25' ? '25 Candidates' : '25 Candidates'}
            </span>
          </div>
        </div>

        {/* Middle: Navigation Links */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          
          {/* Section 1: Executive Management (If Admin) */}
          {isAdmin && (
            <div>
              <div className="px-3 mb-2 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Executive Leadership
              </div>
              <div className="space-y-1">
                <button
                  onClick={() => handleSelectNav('USERS')}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                    activeView === 'USERS'
                      ? 'bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white shadow-md shadow-red-600/30'
                      : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Users className="w-4 h-4 shrink-0" />
                    <span>Staff & User Authority</span>
                  </div>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold ${
                    activeView === 'USERS'
                      ? 'bg-white/20 text-white'
                      : 'bg-red-50 dark:bg-red-950/60 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-900'
                  }`}>
                    {staffList.length}
                  </span>
                </button>

                <button
                  onClick={() => handleSelectNav('DASHBOARD')}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                    activeView === 'DASHBOARD'
                      ? 'bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white shadow-md shadow-red-600/30'
                      : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <BarChart3 className="w-4 h-4 shrink-0" />
                    <span>Executive Dashboard</span>
                  </div>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold ${
                    activeView === 'DASHBOARD'
                      ? 'bg-white/20 text-white'
                      : 'bg-red-50 dark:bg-red-950/60 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-900'
                  }`}>
                    {metrics.submittedOnTime + metrics.late}/{metrics.totalRequired}
                  </span>
                </button>

                <button
                  onClick={() => handleSelectNav('ANALYTICS')}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                    activeView === 'ANALYTICS'
                      ? 'bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white shadow-md shadow-red-600/30'
                      : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <TrendingUp className="w-4 h-4 shrink-0" />
                    <span>Analytics & Insights</span>
                  </div>
                  <span className="text-[10px] uppercase font-bold text-red-700 dark:text-red-400">
                    24 Depts
                  </span>
                </button>

                <button
                  onClick={() => handleSelectNav('REMINDERS')}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                    activeView === 'REMINDERS'
                      ? 'bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white shadow-md shadow-red-600/30'
                      : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Mail className="w-4 h-4 shrink-0" />
                    <span>Email Reminders</span>
                  </div>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold ${
                    activeView === 'REMINDERS'
                      ? 'bg-white/20 text-white'
                      : 'bg-red-50 dark:bg-red-950/60 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-900'
                  }`}>
                    Auto
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Section 2: Daily Operations */}
          <div>
            <div className="px-3 mb-2 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Daily Operations
            </div>
            <div className="space-y-1">
              <button
                onClick={() => handleSelectNav('REPORT')}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                  activeView === 'REPORT'
                    ? 'bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white shadow-md shadow-red-600/30'
                    : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4 shrink-0" />
                  <span>{isAdmin ? 'Staff Report Form' : 'My Daily Report'}</span>
                </div>
                <span className="text-[10px] font-bold text-slate-400">
                  6 KPIs
                </span>
              </button>

              <button
                onClick={() => handleSelectNav('MASTER_LOG')}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                  activeView === 'MASTER_LOG'
                    ? 'bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white shadow-md shadow-red-600/30'
                    : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Table className="w-4 h-4 shrink-0" />
                  <span>Daily Master Log</span>
                </div>
                <span className="text-[10px] font-bold text-slate-400">
                  Excel/PDF
                </span>
              </button>

              <button
                onClick={() => handleSelectNav('INSTRUCTIONS')}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                  activeView === 'INSTRUCTIONS'
                    ? 'bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white shadow-md shadow-red-600/30'
                    : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <BookOpen className="w-4 h-4 shrink-0" />
                  <span>Staff SOP & Policy</span>
                </div>
                <span className="text-[10px] font-bold text-slate-400">
                  11 Steps
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Section: Theme Toggle + User Profile Card + PROMINENT RED LOG OUT BUTTON */}
        <div className="p-3 border-t border-slate-200/80 dark:border-slate-800/80 space-y-2.5 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
          
          {/* Dark / Light Mode Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-2xs hover:border-red-400 dark:hover:border-red-500 transition cursor-pointer"
          >
            <div className="flex items-center gap-2">
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400 shrink-0" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700 shrink-0" />
              )}
              <span>Theme: {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
            </div>
            <span className="text-[10px] font-extrabold text-red-600 dark:text-red-400 uppercase">
              Toggle
            </span>
          </button>

          {/* User Profile Card */}
          {isAdmin ? (
            <button
              onClick={() => setIsStaffModalOpen(true)}
              className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-left flex items-center justify-between hover:border-red-400 dark:hover:border-red-500 transition cursor-pointer shadow-2xs group"
              title="Admin: Preview Manager Account"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-red-600 to-rose-600 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-2xs">
                  AD
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-xs text-slate-900 dark:text-white truncate">
                    {currentUser?.name}
                  </div>
                  <div className="text-[10px] text-red-700 dark:text-red-400 font-semibold truncate">
                    Executive Dean / Admin
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-red-600 transition shrink-0" />
            </button>
          ) : (
            <div className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-left flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-red-600 to-rose-600 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-2xs">
                  {currentUser?.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-xs text-slate-900 dark:text-white truncate">
                    {currentUser?.name}
                  </div>
                  <div className="text-[10px] text-red-700 dark:text-red-400 font-semibold truncate">
                    {currentUser?.department}
                  </div>
                </div>
              </div>
              <div className="p-1 rounded-md bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-[10px] font-bold">
                LOCKED
              </div>
            </div>
          )}

          {/* PROMINENT, SOLID RED LOG OUT BUTTON */}
          <button
            onClick={handleLogout}
            className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-98 text-white font-black text-xs flex items-center justify-center gap-2 shadow-md shadow-rose-600/30 transition cursor-pointer"
            title="Sign out of CUCOM Reporting System"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span className="tracking-wider uppercase">LOG OUT</span>
          </button>
        </div>
      </aside>

      {/* ================= STAFF SWITCHER MODAL ================= */}
      {isStaffModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150 font-sans">
          <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh]">
            
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-red-700 via-red-600 to-rose-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Briefcase className="w-5 h-5 text-red-100" />
                <div>
                  <h3 className="font-bold text-base">Switch Manager Account / Test Portal</h3>
                  <p className="text-xs text-red-100">Switch between Executive Dean and 25 Candidates</p>
                </div>
              </div>
              <button
                onClick={() => setIsStaffModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-white/20 text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Admin Option */}
            <div className="p-4 bg-red-50/60 dark:bg-red-950/20 border-b border-red-100 dark:border-red-900/60 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-tr from-red-600 to-rose-600 text-white shadow-xs">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-sm text-slate-900 dark:text-slate-100">Executive Dean / Administration</div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">Full 25-candidate institutional oversight, compliance analytics, and executive review</div>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsAdmin(true);
                  setIsStaffModalOpen(false);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer ${
                  isAdmin
                    ? 'bg-red-600 text-white'
                    : 'bg-white dark:bg-slate-800 hover:bg-red-100 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-700'
                }`}
              >
                {isAdmin ? 'Active' : 'Switch to Admin'}
              </button>
            </div>

            {/* Search Controls */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-3 bg-slate-50/50 dark:bg-slate-800/40">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search staff by name, title, or department..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500 shadow-2xs"
                />
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin text-xs">
                <span className="text-slate-500 dark:text-slate-400 text-[11px] font-semibold uppercase shrink-0">Department:</span>
                {departments.slice(0, 8).map(dept => (
                  <button
                    key={dept}
                    onClick={() => setSelectedDeptFilter(dept)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium shrink-0 transition cursor-pointer ${
                      selectedDeptFilter === dept
                        ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white font-semibold shadow-2xs'
                        : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {dept}
                  </button>
                ))}
              </div>
            </div>

            {/* Staff List */}
            <div className="overflow-y-auto p-4 space-y-2 flex-1 divide-y divide-slate-100 dark:divide-slate-800">
              {filteredStaff.map(staff => {
                const isCurrent = !isAdmin && currentStaff?.id === staff.id;
                return (
                  <div
                    key={staff.id}
                    onClick={() => {
                      setCurrentStaff(staff);
                      setIsStaffModalOpen(false);
                    }}
                    className={`p-3 rounded-2xl flex items-center justify-between gap-3 cursor-pointer transition pt-3.5 ${
                      isCurrent ? 'bg-red-50/80 dark:bg-red-950/30 border border-red-200 dark:border-red-800' : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                        {staff.sNo}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                          <span>{staff.name}</span>
                          {isCurrent && (
                            <span className="px-2 py-0.5 bg-red-600 text-white text-[10px] rounded-full font-bold">
                              Active
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">{staff.designation}</div>
                        <div className="text-[11px] text-red-700 dark:text-red-400 font-semibold">{staff.department}</div>
                      </div>
                    </div>

                    <span className="text-[11px] font-bold text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 px-3 py-1 rounded-xl">
                      Select →
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer with Direct LOG OUT button */}
            <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <button
                onClick={() => { setIsStaffModalOpen(false); handleLogout(); }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs transition cursor-pointer shadow-xs"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out from Portal</span>
              </button>

              <div className="flex items-center gap-3">
                <span className="text-slate-500 text-[11px]">{filteredStaff.length} department managers listed</span>
                <button
                  onClick={() => setIsStaffModalOpen(false)}
                  className="px-4 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
