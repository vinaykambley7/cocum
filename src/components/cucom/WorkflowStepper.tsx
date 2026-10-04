import React, { useState } from 'react';
import { useCUCOM } from '../../context/CUCOMContext';
import { ActiveView } from '../../types/cucom';
import { 
  CheckCircle2, 
  Clock, 
  FileText, 
  BarChart3, 
  TrendingUp, 
  Table, 
  BookOpen, 
  ChevronRight, 
  Info,
  ChevronDown,
  Sparkles,
  ArrowRight
} from 'lucide-react';

export const WorkflowStepper: React.FC = () => {
  const { 
    currentUser, 
    isAdmin, 
    activeView, 
    setActiveView, 
    deadlineFormatted,
    currentStaff,
    reports,
    selectedDate
  } = useCUCOM();

  const [isCollapsed, setIsCollapsed] = useState(false);

  // Check if current staff submitted today's report
  const currentStaffReport = reports.find(r => r.staffId === currentStaff?.id && r.date === selectedDate);
  const isSubmitted: boolean = Boolean(currentStaffReport && currentStaffReport.complianceStatus !== 'NOT SUBMITTED' && !currentStaffReport.isDraft);

  // Step definitions based on role
  const staffSteps: Array<{
    id: number;
    title: string;
    subtitle: string;
    targetView?: ActiveView;
    isCompleted: boolean;
    isActive: boolean;
    icon: React.ReactNode;
  }> = [
    {
      id: 1,
      title: 'Sign In Verified',
      subtitle: currentUser?.name ? `${currentUser.name}` : 'Authenticated',
      isCompleted: true,
      isActive: false,
      icon: <CheckCircle2 className="w-3.5 h-3.5" />
    },
    {
      id: 2,
      title: 'Enter 6 Core KPIs',
      subtitle: `${currentStaff?.department || 'Department Tasks'}`,
      targetView: 'REPORT',
      isCompleted: Boolean(isSubmitted || (currentStaffReport && currentStaffReport.tasks.some(t => t.description.trim() !== ''))),
      isActive: activeView === 'REPORT',
      icon: <FileText className="w-3.5 h-3.5" />
    },
    {
      id: 3,
      title: 'Blockers & Dean Support',
      subtitle: currentStaffReport?.supportNeeded ? 'Assistance Requested' : 'Standard Operations',
      targetView: 'REPORT',
      isCompleted: isSubmitted,
      isActive: activeView === 'REPORT' && !!currentStaffReport?.challengeBlocker,
      icon: <Info className="w-3.5 h-3.5" />
    },
    {
      id: 4,
      title: 'Submit Daily Report',
      subtitle: `Deadline: ${deadlineFormatted} Daily`,
      targetView: 'REPORT',
      isCompleted: isSubmitted,
      isActive: activeView === 'REPORT',
      icon: <Clock className="w-3.5 h-3.5" />
    },
    {
      id: 5,
      title: 'Audit & Master Log',
      subtitle: 'Official Archive Record',
      targetView: 'MASTER_LOG',
      isCompleted: isSubmitted,
      isActive: activeView === 'MASTER_LOG',
      icon: <Table className="w-3.5 h-3.5" />
    }
  ];

  const adminSteps: Array<{
    id: number;
    title: string;
    subtitle: string;
    targetView: ActiveView;
    isCompleted: boolean;
    isActive: boolean;
    icon: React.ReactNode;
  }> = [
    {
      id: 1,
      title: '1. Executive Dashboard',
      subtitle: "Today's 25-Candidate Roster",
      targetView: 'DASHBOARD',
      isCompleted: true,
      isActive: activeView === 'DASHBOARD',
      icon: <BarChart3 className="w-3.5 h-3.5" />
    },
    {
      id: 2,
      title: '2. Audit & Feedback',
      subtitle: 'Review & Guidance Remarks',
      targetView: 'DASHBOARD',
      isCompleted: reports.some(r => r.date === selectedDate && !!r.managerReview),
      isActive: activeView === 'DASHBOARD',
      icon: <CheckCircle2 className="w-3.5 h-3.5" />
    },
    {
      id: 3,
      title: '3. Analytics & Insights',
      subtitle: 'Employee & Work Matrices',
      targetView: 'ANALYTICS',
      isCompleted: true,
      isActive: activeView === 'ANALYTICS',
      icon: <TrendingUp className="w-3.5 h-3.5" />
    },
    {
      id: 4,
      title: '4. Master Log Sheet',
      subtitle: 'Excel / PDF Compliance Archive',
      targetView: 'MASTER_LOG',
      isCompleted: true,
      isActive: activeView === 'MASTER_LOG',
      icon: <Table className="w-3.5 h-3.5" />
    },
    {
      id: 5,
      title: '5. Staff SOP Protocol',
      subtitle: 'Mandatory Department Guidelines',
      targetView: 'INSTRUCTIONS',
      isCompleted: true,
      isActive: activeView === 'INSTRUCTIONS',
      icon: <BookOpen className="w-3.5 h-3.5" />
    }
  ];

  const steps = isAdmin ? adminSteps : staffSteps;

  return (
    <div className="w-full bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
        <div className="flex items-center justify-between gap-3">
          {/* Header Tag */}
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-5 h-5 rounded-md bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 text-white shadow-2xs">
              <Sparkles className="w-3 h-3" />
            </span>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              {isAdmin ? 'Dean Executive Workflow Stepper' : 'Daily Work Submission Process'}
            </span>
            <span className="hidden sm:inline text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold">
              {isAdmin ? 'Executive Administration' : `${currentStaff?.name} (${currentStaff?.department})`}
            </span>
          </div>

          {/* Stepper Collapse Toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-[11px] font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 flex items-center gap-1 cursor-pointer transition"
          >
            <span>{isCollapsed ? 'Show Process Guide' : 'Compact'}</span>
            <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isCollapsed ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Stepper Steps Row */}
        {!isCollapsed && (
          <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/60 overflow-x-auto pb-1 scrollbar-none">
            <div className="flex items-center justify-between min-w-[650px] gap-2">
              {steps.map((step, idx) => {
                const canNavigate = !!step.targetView;
                return (
                  <React.Fragment key={step.id}>
                    <div
                      onClick={() => {
                        if (canNavigate && step.targetView) {
                          setActiveView(step.targetView);
                        }
                      }}
                      className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl border transition-all duration-200 ${
                        canNavigate ? 'cursor-pointer' : 'cursor-default'
                      } ${
                        step.isActive
                          ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white border-emerald-500 shadow-md shadow-emerald-600/20'
                          : step.isCompleted
                          ? 'bg-emerald-50/70 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/60 hover:bg-emerald-100/60'
                          : 'bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700/60 hover:bg-slate-100'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${
                          step.isActive
                            ? 'bg-white text-emerald-700 font-extrabold shadow-2xs'
                            : step.isCompleted
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {step.isCompleted && !step.isActive ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : (
                          step.id
                        )}
                      </div>

                      <div className="text-left leading-tight">
                        <div className={`text-[11px] font-bold whitespace-nowrap ${
                          step.isActive ? 'text-white' : 'text-slate-900 dark:text-slate-100'
                        }`}>
                          {step.title}
                        </div>
                        <div className={`text-[9px] font-medium whitespace-nowrap truncate max-w-[120px] ${
                          step.isActive ? 'text-emerald-100' : 'text-slate-500 dark:text-slate-400'
                        }`}>
                          {step.subtitle}
                        </div>
                      </div>
                    </div>

                    {idx < steps.length - 1 && (
                      <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-700 shrink-0" />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
