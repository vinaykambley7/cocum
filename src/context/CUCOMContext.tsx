import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { StaffMember, DailyReport, DashboardMetrics, ComplianceStatus, TaskStatus, SyncStatus, StaffScope, UserAccount, ActiveView, ThemeMode } from '../types/cucom';
import { CUCOM_STAFF, createEmptyReport, getInitialDemoReports } from '../data/cucomCatalog';
import { ADMIN_USER, STAFF_ACCOUNTS, authenticateUser } from '../data/cucomAccounts';
import { syncReportToCloud, subscribeToCloudReports, broadcastReportUpdate, onBroadcastUpdate } from '../services/cucomSync';
import { generateHistoricalReports } from '../services/cucomAnalytics';

interface CUCOMContextType {
  currentUser: UserAccount | null;
  staffList: StaffMember[];
  filteredStaffList: StaffMember[];
  currentStaff: StaffMember | null;
  isAdmin: boolean;
  selectedDate: string;
  deadlineTime: string; // "16:00" (4:00 PM) or "17:00" (5:00 PM)
  deadlineFormatted: string; // "4:00 PM" or "5:00 PM"
  staffScope: StaffScope;
  syncStatus: SyncStatus;
  reports: DailyReport[];
  activeView: ActiveView;
  selectedAnalyticsStaffId: string;
  theme: ThemeMode;
  isMobileNavOpen: boolean;
  
  login: (usernameOrEmail: string, password: string) => boolean;
  quickLoginAs: (user: UserAccount) => void;
  logout: () => void;
  
  setActiveView: (view: ActiveView) => void;
  setIsMobileNavOpen: (open: boolean) => void;
  setCurrentStaff: (staff: StaffMember | null) => void;
  setSelectedAnalyticsStaffId: (id: string) => void;
  setIsAdmin: (isAdmin: boolean) => void;
  setSelectedDate: (date: string) => void;
  setDeadlineTime: (time: string) => void;
  setStaffScope: (scope: StaffScope) => void;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
  
  getReportForStaff: (staffId: string, date: string) => DailyReport;
  saveReport: (report: DailyReport, isSubmit?: boolean) => void;
  reviewReport: (reportId: string, reviewText: string, reviewerName?: string) => void;
  deleteReport: (reportId: string) => void;
  getMetricsForDate: (date: string) => DashboardMetrics;
  resetToDemoData: () => void;
  checkIsLate: (submissionDate: string, submissionTimeStr: string) => boolean;
}

const CUCOMContext = createContext<CUCOMContextType | undefined>(undefined);

const STORAGE_KEY = 'cucom_25_candidates_v1';
const AUTH_SESSION_KEY = 'cucom_auth_25_candidates_v1';
const DEADLINE_KEY = 'cucom_deadline_time_v4';
const SCOPE_KEY = 'cucom_staff_scope_v4';
const THEME_KEY = 'cucom_theme_mode_v4';
const LAYOUT_KEY = 'cucom_active_layout_v4';

export const CUCOMProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const staffList = useMemo(() => CUCOM_STAFF, []);

  // 1. Authentication State
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    try {
      const saved = localStorage.getItem(AUTH_SESSION_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to parse auth session', e);
    }
    return ADMIN_USER;
  });

  const isAdmin = currentUser?.role === 'ADMIN';

  const currentStaff = useMemo(() => {
    if (!currentUser) return staffList[0];
    if (currentUser.role === 'STAFF' && currentUser.staffId) {
      return staffList.find(s => s.id === currentUser.staffId) || staffList[0];
    }
    return staffList[0];
  }, [currentUser, staffList]);

  // Persistent Active layout/view
  const [activeView, setActiveViewState] = useState<ActiveView>(() => {
    try {
      const saved = localStorage.getItem(LAYOUT_KEY) as ActiveView;
      const validViews: ActiveView[] = ['REPORT', 'DASHBOARD', 'MASTER_LOG', 'INSTRUCTIONS', 'ANALYTICS', 'REMINDERS'];
      if (saved && validViews.includes(saved)) {
        // If staff, verify not restricted to admin
        if (currentUser?.role === 'STAFF' && (saved === 'DASHBOARD' || saved === 'ANALYTICS')) {
          return 'REPORT';
        }
        return saved;
      }
    } catch (e) {
      console.warn('Failed to parse active layout', e);
    }
    return currentUser?.role === 'ADMIN' ? 'DASHBOARD' : 'REPORT';
  });

  const setActiveView = useCallback((view: ActiveView) => {
    setActiveViewState(view);
    try {
      localStorage.setItem(LAYOUT_KEY, view);
    } catch (e) {}
  }, []);

  const [selectedAnalyticsStaffId, setSelectedAnalyticsStaffId] = useState<string>('staff-01');
  const [isMobileNavOpen, setIsMobileNavOpen] = useState<boolean>(false);

  // Theme Mode: light vs dark
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved === 'dark' || saved === 'light') return saved;
    } catch (e) {}
    return 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const toggleTheme = () => {
    setThemeState(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const setTheme = (mode: ThemeMode) => {
    setThemeState(mode);
  };

  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('LOCAL_ACTIVE');

  // Deadline: default 4:00 PM matching the latest dashboard screenshot
  const [deadlineTime, setDeadlineTimeState] = useState<string>(() => {
    return localStorage.getItem(DEADLINE_KEY) || '16:00';
  });

  const deadlineFormatted = useMemo(() => {
    return deadlineTime === '16:00' ? '4:00 PM' : deadlineTime === '17:00' ? '5:00 PM' : deadlineTime;
  }, [deadlineTime]);

  const setDeadlineTime = (time: string) => {
    setDeadlineTimeState(time);
    localStorage.setItem(DEADLINE_KEY, time);
  };

  // Staff Scope: All 25 vs Core 18
  const [staffScope, setStaffScopeState] = useState<StaffScope>(() => {
    return (localStorage.getItem(SCOPE_KEY) as StaffScope) || 'ALL_25';
  });

  const setStaffScope = (scope: StaffScope) => {
    setStaffScopeState(scope);
    localStorage.setItem(SCOPE_KEY, scope);
  };

  const filteredStaffList = useMemo(() => {
    if (staffScope === 'CORE_18') {
      return staffList.filter(s => s.isCoreStaff || s.sNo <= 18);
    }
    return staffList;
  }, [staffList, staffScope]);

  // Auth Functions
  const login = (usernameOrEmail: string, passwordInput: string): boolean => {
    const user = authenticateUser(usernameOrEmail, passwordInput);
    if (user) {
      setCurrentUser(user);
      localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(user));
      if (user.role === 'ADMIN') {
        setActiveView('DASHBOARD');
      } else {
        setActiveView('REPORT');
      }
      return true;
    }
    return false;
  };

  const quickLoginAs = (user: UserAccount) => {
    setCurrentUser(user);
    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(user));
    if (user.role === 'ADMIN') {
      setActiveView('DASHBOARD');
    } else {
      setActiveView('REPORT');
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem(AUTH_SESSION_KEY);
    setActiveView('DASHBOARD');
  };

  const setIsAdmin = (admin: boolean) => {
    if (admin) {
      setCurrentUser(ADMIN_USER);
      localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(ADMIN_USER));
      setActiveView('DASHBOARD');
    }
  };

  const setCurrentStaff = (staff: StaffMember | null) => {
    if (staff) {
      const user = STAFF_ACCOUNTS.find(u => u.staffId === staff.id);
      if (user) {
        setCurrentUser(user);
        localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(user));
      }
      setActiveView('REPORT');
    }
  };

  // Reports state: fresh start with zero dummy data
  const [reports, setReports] = useState<DailyReport[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse stored CUCOM reports', e);
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
    } catch (e) {
      console.error('LocalStorage write error:', e);
    }
  }, [reports]);

  // Real-time Cloud listeners & BroadcastChannel
  useEffect(() => {
    const unsubscribeBroadcast = onBroadcastUpdate((incomingReport) => {
      setReports(prev => {
        const idx = prev.findIndex(r => r.id === incomingReport.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = incomingReport;
          return next;
        }
        return [incomingReport, ...prev];
      });
      setSyncStatus('CLOUD_SYNCED');
    });

    const unsubscribeCloud = subscribeToCloudReports((cloudReports) => {
      setReports(prev => {
        const map = new Map<string, DailyReport>();
        prev.forEach(r => map.set(r.id, r));
        cloudReports.forEach(r => map.set(r.id, r));
        return Array.from(map.values());
      });
      setSyncStatus('CLOUD_SYNCED');
    });

    // Central SQLite Database initial fetch
    fetch('/api/reports')
      .then(res => res.json())
      .then(data => {
        if (data && data.success && Array.isArray(data.reports) && data.reports.length > 0) {
          const mappedReports: DailyReport[] = data.reports.map((r: any) => ({
            id: r.id,
            staffId: r.staff_id || r.id.split('_')[1] || r.user_id?.replace('user-', '') || '',
            staffName: r.staff_name,
            department: r.department,
            designation: r.designation,
            date: r.date,
            deadline: r.deadline || '4:00 PM',
            submissionTime: r.submission_time,
            submissionTimestamp: r.submission_timestamp,
            complianceStatus: r.compliance_status,
            overallStatus: r.overall_status,
            priority: r.priority || 'Normal',
            tasks: typeof r.tasks_json === 'string' ? JSON.parse(r.tasks_json || '[]') : (r.tasks || []),
            workDoneSummary: r.work_done_summary || '',
            activitiesPerformed: r.activities_performed || '',
            issuesHeld: r.issues_held || '',
            cashCollected: r.cash_collected || '',
            hasUnusualActivities: Boolean(r.has_unusual_activities),
            unusualActivityType: r.unusual_activity_type,
            unusualActivitiesDetails: r.unusual_activities_details || '',
            keyAchievementsSummary: r.key_achievements || '',
            challengeBlocker: r.challenges || '',
            supportNeeded: Boolean(r.support_needed),
            supportDetails: r.support_details || '',
            priorityTomorrow: r.priority_tomorrow || '',
            managerReview: r.manager_review || '',
            reviewedBy: r.reviewed_by || '',
            reviewedAt: r.reviewed_at || '',
            isDraft: Boolean(r.is_draft),
            updatedAt: r.updated_at
          }));

          setReports(prev => {
            const map = new Map<string, DailyReport>();
            prev.forEach(item => map.set(item.id, item));
            mappedReports.forEach(item => map.set(item.id, item));
            return Array.from(map.values());
          });
        }
      })
      .catch(err => console.warn('Could not fetch initial reports from central DB API:', err));

    return () => {
      unsubscribeBroadcast();
      if (unsubscribeCloud) unsubscribeCloud();
    };
  }, []);

  const checkIsLate = useCallback((submissionDate: string, submissionTimeStr: string): boolean => {
    try {
      let hours = 0;
      let minutes = 0;
      const normalized = submissionTimeStr.trim().toUpperCase();

      if (normalized.includes('AM') || normalized.includes('PM')) {
        const parts = normalized.replace('AM', '').replace('PM', '').trim().split(':');
        hours = parseInt(parts[0], 10);
        minutes = parseInt(parts[1] || '0', 10);
        if (normalized.includes('PM') && hours < 12) hours += 12;
        if (normalized.includes('AM') && hours === 12) hours = 0;
      } else {
        const parts = normalized.split(':');
        hours = parseInt(parts[0], 10);
        minutes = parseInt(parts[1] || '0', 10);
      }

      const [dHours, dMinutes] = deadlineTime.split(':').map(Number);
      return (hours > dHours) || (hours === dHours && minutes > dMinutes);
    } catch (e) {
      return false;
    }
  }, [deadlineTime]);

  const getReportForStaff = useCallback((staffId: string, date: string): DailyReport => {
    const existing = reports.find(r => r.staffId === staffId && r.date === date);
    if (existing) {
      return existing;
    }
    const staff = staffList.find(s => s.id === staffId);
    if (!staff) {
      throw new Error(`Staff ${staffId} not found`);
    }
    const empty = createEmptyReport(staff, date);
    empty.deadline = deadlineFormatted;
    return empty;
  }, [reports, staffList, deadlineFormatted]);

  const saveReport = (updatedReport: DailyReport, isSubmit: boolean = false) => {
    const now = new Date();
    const formattedTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

    let finalReport = { 
      ...updatedReport, 
      deadline: deadlineFormatted,
      updatedAt: now.toISOString() 
    };

    if (isSubmit) {
      const isLate = checkIsLate(updatedReport.date, formattedTime);
      finalReport = {
        ...finalReport,
        isDraft: false,
        submissionTimestamp: now.toISOString(),
        submissionTime: formattedTime,
        complianceStatus: (isLate ? 'LATE' : 'SUBMITTED ON TIME') as ComplianceStatus,
      };
    }

    setReports(prev => {
      const idx = prev.findIndex(r => r.id === finalReport.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = finalReport;
        return next;
      }
      return [finalReport, ...prev];
    });

    broadcastReportUpdate(finalReport);
    syncReportToCloud(finalReport).then(ok => {
      if (ok) setSyncStatus('CLOUD_SYNCED');
    });

    // Central SQLite Database API Sync
    fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(finalReport)
    }).catch(err => console.warn('Could not sync report to central DB API:', err));
  };

  const reviewReport = (reportId: string, reviewText: string, reviewerName: string = 'Dean / Management Office') => {
    const now = new Date().toISOString();
    let updated: DailyReport | null = null;

    setReports(prev =>
      prev.map(r => {
        if (r.id === reportId) {
          updated = {
            ...r,
            managerReview: reviewText,
            reviewedBy: reviewerName,
            reviewedAt: now,
            updatedAt: now,
          };
          return updated;
        }
        return r;
      })
    );

    if (updated) {
      broadcastReportUpdate(updated);
      syncReportToCloud(updated);
    }
  };

  const deleteReport = (reportId: string) => {
    setReports(prev => prev.filter(r => r.id !== reportId));
  };

  const getMetricsForDate = useCallback((date: string): DashboardMetrics => {
    const targetStaff = filteredStaffList;
    const targetStaffIds = new Set(targetStaff.map(s => s.id));
    const dateReports = reports.filter(r => r.date === date && !r.isDraft && targetStaffIds.has(r.staffId));
    const totalRequired = targetStaff.length;

    let submittedOnTime = 0;
    let late = 0;
    let totalTaskEntries = 0;
    let pendingTasks = 0;
    let inProgressTasks = 0;
    let completedTasks = 0;

    dateReports.forEach(r => {
      if (r.complianceStatus === 'SUBMITTED ON TIME') submittedOnTime++;
      else if (r.complianceStatus === 'LATE') late++;

      r.tasks.forEach(t => {
        if (t.description && t.description.trim() !== '') {
          totalTaskEntries++;
          if (t.status === 'Done') completedTasks++;
          else if (t.status === 'In Progress') inProgressTasks++;
          else pendingTasks++;
        }
      });
    });

    const notSubmitted = Math.max(0, totalRequired - (submittedOnTime + late));
    const complianceRate = totalRequired > 0 ? ((submittedOnTime + late) / totalRequired) * 100 : 0;

    return {
      totalRequired,
      submittedOnTime,
      late,
      notSubmitted,
      complianceRate,
      totalTaskEntries,
      pendingTasks,
      inProgressTasks,
      completedTasks,
    };
  }, [filteredStaffList, reports]);

  const resetToDemoData = () => {
    const todayReports = getInitialDemoReports(selectedDate);
    const historicalReports = generateHistoricalReports(14, staffList);
    const map = new Map<string, DailyReport>();
    historicalReports.forEach(r => map.set(r.id, r));
    todayReports.forEach(r => map.set(r.id, r));
    const demo = Array.from(map.values());

    setReports(demo);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(demo));
    demo.slice(0, 5).forEach(r => {
      broadcastReportUpdate(r);
      syncReportToCloud(r);
    });
  };

  return (
    <CUCOMContext.Provider
      value={{
        currentUser,
        staffList,
        filteredStaffList,
        currentStaff,
        isAdmin,
        selectedDate,
        deadlineTime,
        deadlineFormatted,
        staffScope,
        syncStatus,
        reports,
        activeView,
        selectedAnalyticsStaffId,
        theme,
        isMobileNavOpen,
        login,
        quickLoginAs,
        logout,
        setActiveView,
        setIsMobileNavOpen,
        setCurrentStaff,
        setSelectedAnalyticsStaffId,
        setIsAdmin,
        setSelectedDate,
        setDeadlineTime,
        setStaffScope,
        toggleTheme,
        setTheme,
        getReportForStaff,
        saveReport,
        reviewReport,
        deleteReport,
        getMetricsForDate,
        resetToDemoData,
        checkIsLate,
      }}
    >
      {children}
    </CUCOMContext.Provider>
  );
};

export const useCUCOM = (): CUCOMContextType => {
  const context = useContext(CUCOMContext);
  if (!context) {
    throw new Error('useCUCOM must be used within CUCOMProvider');
  }
  return context;
};
