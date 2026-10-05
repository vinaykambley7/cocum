import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { StaffMember, DailyReport, DashboardMetrics, ComplianceStatus, TaskStatus, SyncStatus, StaffScope, UserAccount, ActiveView, ThemeMode, UserRole } from '../types/cucom';
import { DEFAULT_DEPARTMENTS, DEFAULT_DESIGNATIONS, createEmptyReport, getInitialDemoReports } from '../data/cucomCatalog';
import { ADMIN_USER, authenticateUser } from '../data/cucomAccounts';
import { 
  syncReportToCloud, 
  subscribeToCloudReports, 
  broadcastReportUpdate, 
  onBroadcastUpdate, 
  fetchReportsFromSupabase,
  syncProfileToCloud,
  fetchProfilesFromCloud,
  deleteProfileFromCloud,
  deleteReportFromCloud
} from '../services/cucomSync';
import { supabase } from '../services/supabaseClient';
import { generateHistoricalReports } from '../services/cucomAnalytics';

interface CUCOMContextType {
  currentUser: UserAccount | null;
  users: UserAccount[];
  staffList: StaffMember[];
  filteredStaffList: StaffMember[];
  currentStaff: StaffMember | null;
  departments: string[];
  designations: string[];
  isAdmin: boolean;
  selectedDate: string;
  deadlineTime: string;
  deadlineFormatted: string;
  staffScope: StaffScope;
  syncStatus: SyncStatus;
  reports: DailyReport[];
  activeView: ActiveView;
  selectedAnalyticsStaffId: string;
  theme: ThemeMode;
  isMobileNavOpen: boolean;
  
  login: (usernameOrEmail: string, password: string) => Promise<{ success: boolean; message?: string }>;
  quickLoginAs: (user: UserAccount) => void;
  logout: () => Promise<void>;
  
  // Admin User Authority methods
  createUser: (data: {
    name: string;
    username: string;
    email: string;
    password?: string;
    department: string;
    designation: string;
  }) => Promise<{ success: boolean; message: string; user?: UserAccount }>;
  updateUser: (userId: string, updates: Partial<UserAccount>) => Promise<{ success: boolean; message: string }>;
  deleteUser: (userId: string) => Promise<{ success: boolean; message: string }>;
  addDepartment: (deptName: string) => void;
  addDesignation: (roleName: string) => void;
  
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
  saveReport: (report: DailyReport, isSubmit?: boolean) => Promise<{ success: boolean; error?: string }>;
  reviewReport: (reportId: string, reviewText: string, reviewerName?: string) => Promise<void>;
  deleteReport: (reportId: string) => Promise<{ success: boolean; error?: string }>;
  getMetricsForDate: (date: string) => DashboardMetrics;
  resetToDemoData: () => void;
  checkIsLate: (submissionDate: string, submissionTimeStr: string) => boolean;
}

const CUCOMContext = createContext<CUCOMContextType | undefined>(undefined);

const STORAGE_KEY = 'cucom_reports_data_v2';
const USERS_STORAGE_KEY = 'cucom_admin_managed_users_v3';
const DEPARTMENTS_STORAGE_KEY = 'cucom_departments_v2';
const DESIGNATIONS_STORAGE_KEY = 'cucom_designations_v2';
const AUTH_SESSION_KEY = 'cucom_auth_user_session_v2';
const DEADLINE_KEY = 'cucom_deadline_time_v4';
const SCOPE_KEY = 'cucom_staff_scope_v4';
const THEME_KEY = 'cucom_theme_mode_v4';
const LAYOUT_KEY = 'cucom_active_layout_v4';

export const CUCOMProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  // 1. Dynamic Users Management (Admin has total authority)
  const [users, setUsers] = useState<UserAccount[]>(() => {
    try {
      const saved = localStorage.getItem(USERS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse users from storage', e);
    }
    return [];
  });

  // Dynamic Department Suggestions (Admin can add new ones anytime)
  const [departments, setDepartments] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(DEPARTMENTS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return DEFAULT_DEPARTMENTS;
  });

  // Dynamic Role Suggestions (Admin can add new ones anytime)
  const [designations, setDesignations] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(DESIGNATIONS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return DEFAULT_DESIGNATIONS;
  });

  // Staff list derived dynamically from active staff users created by Admin
  const staffList: StaffMember[] = useMemo(() => {
    return users
      .filter(u => u.role === 'STAFF' && u.isActive !== false)
      .map((u, idx) => ({
        sNo: idx + 1,
        id: u.staffId || u.id.replace('user-', ''),
        name: u.name,
        department: u.department,
        designation: u.designation,
        email: u.email,
        username: u.username,
        password: u.password,
        defaultKpis: [],
        isCoreStaff: true,
        isActive: u.isActive !== false,
        createdAt: u.createdAt,
      }));
  }, [users]);

  // 2. Authentication State - strictly requires explicit login on opening the app
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    try {
      const saved = sessionStorage.getItem(AUTH_SESSION_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to parse auth session', e);
    }
    return null;
  });

  const isAdmin = currentUser?.role === 'ADMIN';

  const currentStaff = useMemo(() => {
    if (!currentUser) return staffList[0] || null;
    if (currentUser.role === 'STAFF' && currentUser.staffId) {
      return staffList.find(s => s.id === currentUser.staffId) || staffList[0] || null;
    }
    return staffList[0] || null;
  }, [currentUser, staffList]);

  // Persistent Active layout/view
  const [activeView, setActiveViewState] = useState<ActiveView>(() => {
    try {
      const saved = localStorage.getItem(LAYOUT_KEY) as ActiveView;
      const validViews: ActiveView[] = ['REPORT', 'DASHBOARD', 'MASTER_LOG', 'INSTRUCTIONS', 'ANALYTICS', 'REMINDERS', 'USERS'];
      if (saved && validViews.includes(saved)) {
        if (currentUser?.role === 'STAFF' && (saved === 'DASHBOARD' || saved === 'ANALYTICS' || saved === 'USERS')) {
          return 'REPORT';
        }
        return saved;
      }
    } catch (e) {
      console.warn('Failed to parse active layout', e);
    }
    return currentUser?.role === 'ADMIN' ? 'USERS' : 'REPORT';
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

  // Deadline: default 4:00 PM
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

  // Staff Scope: All vs Core
  const [staffScope, setStaffScopeState] = useState<StaffScope>(() => {
    return (localStorage.getItem(SCOPE_KEY) as StaffScope) || 'ALL_25';
  });

  const setStaffScope = (scope: StaffScope) => {
    setStaffScopeState(scope);
    localStorage.setItem(SCOPE_KEY, scope);
  };

  const filteredStaffList = useMemo(() => {
    if (!currentUser) return staffList;
    if (currentUser.role === 'ADMIN') return staffList;
    // Section User / Manager: strictly isolate to their own assigned department
    const userDept = (currentUser.department || '').trim().toLowerCase();
    const deptStaff = staffList.filter(s => (s.department || '').trim().toLowerCase() === userDept);
    return deptStaff.length > 0 ? deptStaff : staffList.filter(s => s.id === currentUser.staffId);
  }, [staffList, currentUser]);

  // Dynamic Suggestion Helpers
  const addDepartment = useCallback((deptName: string) => {
    const trimmed = deptName.trim();
    if (!trimmed) return;
    setDepartments(prev => {
      if (prev.includes(trimmed)) return prev;
      const next = [...prev, trimmed];
      try {
        localStorage.setItem(DEPARTMENTS_STORAGE_KEY, JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  }, []);

  const addDesignation = useCallback((roleName: string) => {
    const trimmed = roleName.trim();
    if (!trimmed) return;
    setDesignations(prev => {
      if (prev.includes(trimmed)) return prev;
      const next = [...prev, trimmed];
      try {
        localStorage.setItem(DESIGNATIONS_STORAGE_KEY, JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  }, []);

  // Helper to resolve user profile from Supabase Auth or DB profiles
  const resolveUserProfile = useCallback(async (authUser: any): Promise<UserAccount> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      if (data && !error) {
        return {
          id: data.id,
          name: data.name,
          username: data.username,
          role: data.role as UserRole,
          department: data.department,
          designation: data.designation,
          email: data.email,
          staffId: data.staff_id || data.id,
          isActive: data.is_active !== false,
          createdAt: data.created_at
        };
      }
    } catch (e) {
      console.warn('Profiles fetch note:', e);
    }

    const meta = authUser.user_metadata || {};
    const emailLower = (authUser.email || '').toLowerCase();
    const isSuperAdmin = 
      emailLower === 'admin@cocum.edu.ag' || 
      emailLower === 'admin@cocum' ||
      meta.role === 'ADMIN' || 
      meta.username?.toLowerCase() === 'admin@cocum';

    return {
      id: authUser.id,
      name: meta.name || (isSuperAdmin ? "Executive Administration (Dean's Office)" : (authUser.email || 'Staff').split('@')[0]),
      username: meta.username || (isSuperAdmin ? 'Admin@cocum' : (authUser.email || 'staff').split('@')[0]),
      role: isSuperAdmin ? 'ADMIN' : (meta.role || 'STAFF'),
      department: meta.department || (isSuperAdmin ? 'Executive Leadership' : 'Department of Clinical Medicine'),
      designation: meta.designation || (isSuperAdmin ? 'Executive Dean & Vice Chancellor' : 'Staff Member'),
      email: authUser.email || '',
      staffId: meta.staff_id || authUser.id,
      isActive: true,
      createdAt: authUser.created_at
    };
  }, []);

  // Supabase Auth Session Initialization & Realtime Auth Listener
  useEffect(() => {
    let isMounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user && isMounted) {
        resolveUserProfile(session.user).then(profile => {
          if (isMounted) {
            setCurrentUser(profile);
            sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(profile));
          }
        });
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user && isMounted) {
        const profile = await resolveUserProfile(session.user);
        if (isMounted) {
          setCurrentUser(profile);
          sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(profile));
        }
      } else if (event === 'SIGNED_OUT' && isMounted) {
        setCurrentUser(null);
        sessionStorage.removeItem(AUTH_SESSION_KEY);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [resolveUserProfile]);

  // Admin User Authority: Create, Update, Delete
  const createUser = useCallback(async (data: {
    name: string;
    username: string;
    email: string;
    password?: string;
    department: string;
    designation: string;
  }): Promise<{ success: boolean; message: string; user?: UserAccount }> => {
    const cleanName = data.name.trim();
    const cleanUsername = data.username.trim().toLowerCase().replace(/\s+/g, '.');
    const cleanEmail = data.email.trim().toLowerCase() || `${cleanUsername}@cucom.edu.ag`;
    const cleanPassword = data.password?.trim() || 'Cocum@2026';
    const cleanDept = data.department.trim();
    const cleanRole = data.designation.trim();

    if (!cleanName) return { success: false, message: 'Full Name is required.' };
    if (!cleanUsername) return { success: false, message: 'Username is required.' };
    if (!cleanDept) return { success: false, message: 'Department is required.' };
    if (!cleanRole) return { success: false, message: 'Designation / Role is required.' };

    let createdAccount: UserAccount | null = null;

    // Try backend admin endpoint if available
    try {
      const resp = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: cleanName,
          username: cleanUsername,
          email: cleanEmail,
          password: cleanPassword,
          department: cleanDept,
          designation: cleanRole,
          role: 'STAFF'
        })
      });
      const resData = await resp.json();
      if (resData.success && resData.user) {
        createdAccount = {
          id: resData.user.id,
          name: cleanName,
          username: cleanUsername,
          role: 'STAFF',
          staffId: `staff-${resData.user.id.substring(0, 6)}`,
          department: cleanDept,
          designation: cleanRole,
          email: cleanEmail,
          password: cleanPassword,
          isActive: true,
          createdAt: new Date().toISOString()
        };
      }
    } catch (e) {
      console.warn('Backend admin create user endpoint unavailable, using local provision:', e);
    }

    if (!createdAccount) {
      const staffId = `staff-${Date.now()}`;
      createdAccount = {
        id: `user-${staffId}`,
        name: cleanName,
        username: cleanUsername,
        role: 'STAFF',
        staffId: staffId,
        department: cleanDept,
        designation: cleanRole,
        email: cleanEmail,
        password: cleanPassword,
        isActive: true,
        createdAt: new Date().toISOString()
      };
    }

    setUsers(prev => {
      const next = [...prev.filter(u => u.username !== cleanUsername), createdAccount!];
      try {
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(next));
      } catch (e) {}
      return next;
    });

    addDepartment(cleanDept);
    addDesignation(cleanRole);

    syncProfileToCloud(createdAccount).catch(err => console.warn('User profile sync notice:', err));

    return { 
      success: true, 
      message: `Account '${cleanName}' created successfully!`, 
      user: createdAccount 
    };
  }, [addDepartment, addDesignation]);

  const updateUser = useCallback(async (userId: string, updates: Partial<UserAccount>): Promise<{ success: boolean; message: string }> => {
    let updatedUser: UserAccount | null = null;
    setUsers(prev => {
      const next = prev.map(u => {
        if (u.id === userId) {
          updatedUser = { ...u, ...updates };
          return updatedUser;
        }
        return u;
      });
      try {
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(next));
      } catch (e) {}
      return next;
    });

    if (updatedUser) {
      syncProfileToCloud(updatedUser).catch(err => console.warn('User cloud sync notice:', err));
      if (currentUser?.id === userId) {
        setCurrentUser(updatedUser);
      }
      if (updates.department) addDepartment(updates.department);
      if (updates.designation) addDesignation(updates.designation);
      return { success: true, message: 'User updated successfully.' };
    }
    return { success: false, message: 'User not found.' };
  }, [currentUser, addDepartment, addDesignation]);

  const deleteUser = useCallback(async (userId: string): Promise<{ success: boolean; message: string }> => {
    setUsers(prev => {
      const next = prev.filter(u => u.id !== userId);
      try {
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(next));
      } catch (e) {}
      return next;
    });
    deleteProfileFromCloud(userId).catch(err => console.warn('User cloud delete notice:', err));
    return { success: true, message: 'User deleted successfully.' };
  }, []);

  // Auth Functions
  const login = async (usernameOrEmail: string, passwordInput: string): Promise<{ success: boolean; message?: string }> => {
    const cleanInput = usernameOrEmail.trim().toLowerCase();
    const cleanPass = passwordInput.trim();

    // Map admin and usernames to institutional Supabase email format
    let authEmail = cleanInput;
    if (cleanInput === 'admin@cocum' || cleanInput === 'admin') {
      authEmail = 'admin@cocum.edu.ag';
    } else if (!authEmail.includes('@')) {
      authEmail = `${cleanInput}@cucom.edu.ag`;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: authEmail,
        password: cleanPass
      });

      if (!error && data?.user) {
        const profile = await resolveUserProfile(data.user);
        setCurrentUser(profile);
        sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(profile));
        if (profile.role === 'ADMIN') {
          setActiveView('USERS');
        } else {
          setActiveView('REPORT');
        }
        return { success: true };
      }

      // Check local dynamic accounts as fallback
      const localUser = authenticateUser(usernameOrEmail, passwordInput, users);
      if (localUser) {
        setCurrentUser(localUser);
        sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(localUser));
        if (localUser.role === 'ADMIN') setActiveView('USERS');
        else setActiveView('REPORT');
        return { success: true };
      }

      return { success: false, message: error?.message || 'Invalid username or password.' };
    } catch (err: any) {
      const localUser = authenticateUser(usernameOrEmail, passwordInput, users);
      if (localUser) {
        setCurrentUser(localUser);
        sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(localUser));
        if (localUser.role === 'ADMIN') setActiveView('USERS');
        else setActiveView('REPORT');
        return { success: true };
      }
      return { success: false, message: err?.message || 'Authentication failed' };
    }
  };

  const quickLoginAs = (user: UserAccount) => {
    setCurrentUser(user);
    try {
      sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(user));
    } catch (e) {}
    if (user.role === 'ADMIN') {
      setActiveView('USERS');
    } else {
      setActiveView('REPORT');
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Sign out note:', e);
    }
    setCurrentUser(null);
    try {
      sessionStorage.removeItem(AUTH_SESSION_KEY);
      localStorage.removeItem(AUTH_SESSION_KEY);
      localStorage.removeItem('cucom_auth_session');
    } catch (e) {}
    setActiveView('REPORT');
  };

  const setIsAdmin = (admin: boolean) => {
    if (admin) {
      setCurrentUser(ADMIN_USER);
      try {
        sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(ADMIN_USER));
      } catch (e) {}
      setActiveView('USERS');
    }
  };

  const setCurrentStaff = (staff: StaffMember | null) => {
    if (staff) {
      const user = users.find(u => u.staffId === staff.id) || null;
      if (user) {
        setCurrentUser(user);
        try {
          sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(user));
        } catch (e) {}
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

  // Purge legacy persistent auto-login session keys on mount
  useEffect(() => {
    try {
      localStorage.removeItem('cucom_auth_session');
      localStorage.removeItem('cucom_auth_25_candidates_v1');
    } catch (e) {}
  }, []);

  // Fetch Profiles from Cloud on Mount
  useEffect(() => {
    fetchProfilesFromCloud().then(cloudProfiles => {
      if (cloudProfiles && cloudProfiles.length > 0) {
        setUsers(prev => {
          const map = new Map<string, UserAccount>();
          prev.forEach(u => map.set(u.id, u));
          cloudProfiles.forEach(u => map.set(u.id, u));
          const merged = Array.from(map.values());
          try {
            localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(merged));
          } catch (e) {}
          return merged;
        });
      }
    });
  }, []);

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

    // Central Supabase Database initial fetch
    fetchReportsFromSupabase().then(res => {
      if (res.success && res.reports && res.reports.length > 0) {
        setReports(prev => {
          const map = new Map<string, DailyReport>();
          prev.forEach(r => map.set(r.id, r));
          res.reports.forEach(r => map.set(r.id, r));
          return Array.from(map.values());
        });
        setSyncStatus('CLOUD_SYNCED');
      }
    });

    // Central Supabase Profiles initial fetch (Admin & Dynamic Users)
    fetchProfilesFromCloud().then(cloudUsers => {
      setUsers(cloudUsers);
      try {
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(cloudUsers));
      } catch (e) {}
    });

    // Realtime Supabase Profile changes listener
    const profileChannel = supabase
      .channel('public:profiles_live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        async () => {
          const cloudUsers = await fetchProfilesFromCloud();
          setUsers(cloudUsers);
          try {
            localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(cloudUsers));
          } catch (e) {}
        }
      )
      .subscribe();

    // Central SQLite Database initial fetch (local dev)
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
      supabase.removeChannel(profileChannel);
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
      if (hours > dHours) return true;
      if (hours === dHours && minutes > dMinutes) return true;
      return false;
    } catch (e) {
      return false;
    }
  }, [deadlineTime]);

  const getReportForStaff = useCallback(
    (staffId: string, date: string): DailyReport => {
      const existing = reports.find(r => r.staffId === staffId && r.date === date);
      if (existing) return existing;

      const staff = staffList.find(s => s.id === staffId);
      if (staff) {
        return createEmptyReport(staff, date);
      }

      return {
        id: `${date}_${staffId}`,
        date,
        staffId,
        staffName: currentUser?.name || 'Staff Member',
        department: currentUser?.department || 'Department',
        designation: currentUser?.designation || 'Staff',
        deadline: deadlineFormatted,
        complianceStatus: 'NOT SUBMITTED',
        priority: 'Normal',
        workDoneSummary: '',
        activitiesPerformed: '',
        issuesHeld: '',
        cashCollected: '',
        hasUnusualActivities: false,
        unusualActivityType: '',
        unusualActivitiesDetails: '',
        tasks: [],
        overallStatus: 'Pending',
        supportNeeded: false,
        supportDetails: '',
        challengeBlocker: '',
        priorityTomorrow: '',
        keyAchievementsSummary: '',
        updatedAt: new Date().toISOString(),
      };
    },
    [reports, staffList, deadlineFormatted, currentUser]
  );

  const saveReport = async (report: DailyReport, isSubmit: boolean = false): Promise<{ success: boolean; error?: string }> => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const isLate = checkIsLate(report.date, timeStr);

    const finalReport: DailyReport = {
      ...report,
      userId: currentUser?.id || report.userId,
      isDraft: !isSubmit,
      submissionTime: isSubmit ? timeStr : report.submissionTime,
      submissionTimestamp: isSubmit ? now.toISOString() : report.submissionTimestamp,
      complianceStatus: isSubmit ? (isLate ? 'LATE' : 'SUBMITTED ON TIME') : (report.complianceStatus || 'NOT SUBMITTED'),
      deadline: deadlineFormatted,
      updatedAt: now.toISOString(),
    };

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
    const syncRes = await syncReportToCloud(finalReport, currentUser?.id);
    if (syncRes.success) {
      setSyncStatus('CLOUD_SYNCED');
    }

    // Central SQLite Database API Sync
    fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(finalReport)
    }).catch(err => console.warn('Could not sync report to central DB API:', err));

    return syncRes;
  };

  const reviewReport = async (reportId: string, reviewText: string, reviewerName: string = 'Dean / Management Office'): Promise<void> => {
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
      await syncReportToCloud(updated, currentUser?.id);
    }
  };

  const deleteReport = async (reportId: string): Promise<{ success: boolean; error?: string }> => {
    setReports(prev => prev.filter(r => r.id !== reportId));
    return await deleteReportFromCloud(reportId);
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

    dateReports.forEach(r => {
      if (r.complianceStatus === 'SUBMITTED ON TIME') submittedOnTime++;
      if (r.complianceStatus === 'LATE') late++;
      (r.tasks || []).forEach(t => {
        totalTaskEntries++;
        if (t.status === 'Pending') pendingTasks++;
      });
    });

    const totalSubmitted = submittedOnTime + late;
    const notSubmitted = Math.max(0, totalRequired - totalSubmitted);
    const missingReports = notSubmitted;
    const complianceRate = totalRequired > 0 ? (totalSubmitted / totalRequired) * 100 : 0;
    const submissionRate = Math.round(complianceRate);
    const onTimeRate = totalSubmitted > 0 ? Math.round((submittedOnTime / totalSubmitted) * 100) : 0;

    return {
      totalRequired,
      submittedOnTime,
      late,
      notSubmitted,
      complianceRate,
      totalTaskEntries,
      pendingTasks,
      inProgressTasks: 0,
      completedTasks: 0,
      missingReports,
      submissionRate,
      onTimeRate,
      criticalBlockersCount: dateReports.filter(r => Boolean(r.issuesHeld || r.hasUnusualActivities)).length,
      pendingTasksCount: pendingTasks,
    };
  }, [filteredStaffList, reports]);

  const resetToDemoData = () => {
    setReports([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {}
  };

  return (
    <CUCOMContext.Provider
      value={{
        currentUser,
        users,
        staffList,
        filteredStaffList,
        currentStaff,
        departments,
        designations,
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
        createUser,
        updateUser,
        deleteUser,
        addDepartment,
        addDesignation,
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

export const useCUCOM = () => {
  const context = useContext(CUCOMContext);
  if (!context) {
    throw new Error('useCUCOM must be used within a CUCOMProvider');
  }
  return context;
};
