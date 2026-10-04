import React from 'react';
import { useCUCOM } from '../../context/CUCOMContext';
import { exportMasterLogToExcel, exportMasterLogToPDF } from '../../utils/cucomExport';
import { 
  Menu, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  FileSpreadsheet, 
  Download, 
  Sun, 
  Moon,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  UserCheck
} from 'lucide-react';

export const PageHeader: React.FC = () => {
  const { 
    activeView, 
    selectedDate, 
    setSelectedDate, 
    deadlineFormatted, 
    deadlineTime,
    isAdmin, 
    currentUser, 
    currentStaff,
    theme, 
    toggleTheme, 
    setIsMobileNavOpen,
    reports
  } = useCUCOM();

  const getDeadlineStatus = () => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const [dHours, dMinutes] = deadlineTime.split(':').map(Number);

    if (hours < dHours || (hours === dHours && minutes < dMinutes)) {
      const remainingHours = dHours - hours - (minutes > dMinutes ? 1 : 0);
      const remainingMinutes = (60 + dMinutes - minutes) % 60;
      return {
        isPast: false,
        text: `Due ${deadlineFormatted} (${remainingHours}h ${remainingMinutes}m left)`,
        badgeClass: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/70'
      };
    } else {
      return {
        isPast: true,
        text: `Deadline Passed (${deadlineFormatted})`,
        badgeClass: 'bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800/70'
      };
    }
  };

  const deadlineStatus = getDeadlineStatus();

  // Page title and descriptive subtitle based on active layout
  const getLayoutMetadata = () => {
    switch (activeView) {
      case 'DASHBOARD':
        return {
          breadcrumb: 'Executive Administration',
          title: 'Executive Submission Dashboard',
          subtitle: "Monitor daily submissions, audit 25-candidate compliance, and provide leadership guidance."
        };
      case 'ANALYTICS':
        return {
          breadcrumb: 'Executive Intelligence',
          title: 'Institutional Work & Employee Analytics',
          subtitle: 'Individual employee performance dossiers, departmental progress, and risk radar.'
        };
      case 'REPORT':
        return {
          breadcrumb: 'Daily Operations',
          title: isAdmin ? 'Staff Daily Work Report Preview' : 'My Daily Work Report Form',
          subtitle: `Submit work done, activities performed, issues held, cash collected, and operational details for ${selectedDate}.`
        };
      case 'MASTER_LOG':
        return {
          breadcrumb: 'Central Institutional Archive',
          title: 'Daily Report Central Master Log',
          subtitle: 'Historical spreadsheet archive of all departmental submissions with Excel & PDF exports.'
        };
      case 'INSTRUCTIONS':
        return {
          breadcrumb: 'Compliance & Policy',
          title: 'Standard Operating Procedures & Guidelines',
          subtitle: 'Mandatory 11-step institutional reporting policy, submission guidelines, and team announcement.'
        };
      default:
        return {
          breadcrumb: 'Daily Portal',
          title: 'CUCOM Daily Reporting System',
          subtitle: 'Institutional compliance portal.'
        };
    }
  };

  const meta = getLayoutMetadata();

  return (
    <header className="bg-white/95 dark:bg-[#111827]/95 backdrop-blur-md rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs sticky top-3 z-30 transition-all duration-200">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
        
        {/* Left Side: Mobile Hamburger + Breadcrumb + Title & Subtitle */}
        <div className="flex items-start gap-3">
          {/* Mobile hamburger menu button (Visible only on < md) */}
          <button
            type="button"
            onClick={() => setIsMobileNavOpen(true)}
            className="md:hidden p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition cursor-pointer shrink-0 mt-0.5"
            aria-label="Open left navigation bar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            {/* Breadcrumb */}
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-red-700 dark:text-red-400 uppercase tracking-wider mb-0.5">
              <span>CUCOM Portal</span>
              <ChevronRight className="w-3 h-3 text-slate-400" />
              <span>{meta.breadcrumb}</span>
            </div>

            {/* Main Page Title */}
            <h1 className="text-lg sm:text-xl lg:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {meta.title}
            </h1>

            {/* Subtitle */}
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-2xl line-clamp-1 sm:line-clamp-none">
              {meta.subtitle}
            </p>
          </div>
        </div>

        {/* Right Side: Date Selector + Deadline Status + Quick Actions + Theme Toggle */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-end md:self-center">
          
          {/* Active Date Selector */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 text-xs font-semibold text-slate-800 dark:text-slate-200 shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-red-600 dark:text-red-400 shrink-0" />
            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-bold uppercase hidden sm:inline">Date:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-900 dark:text-white focus:outline-none cursor-pointer"
            />
          </div>

          {/* Deadline Status Pill */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border font-bold text-[11px] shadow-2xs ${deadlineStatus.badgeClass}`}>
            {deadlineStatus.isPast ? (
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            )}
            <span className="whitespace-nowrap">{deadlineStatus.text}</span>
          </div>

          {/* Theme Mode Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            className="p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition cursor-pointer shadow-2xs shrink-0"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700" />
            )}
          </button>
        </div>

      </div>
    </header>
  );
};
