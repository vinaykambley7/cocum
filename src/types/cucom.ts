export type DepartmentRole = string;

export type TaskStatus = 'Done' | 'In Progress' | 'Pending';
export type ComplianceStatus = 'SUBMITTED ON TIME' | 'LATE' | 'NOT SUBMITTED';
export type PriorityLevel = 'Normal' | 'Urgent';
export type SyncStatus = 'CLOUD_SYNCED' | 'LOCAL_ACTIVE';
export type StaffScope = 'ALL_25' | 'ALL_35' | 'CORE_18';
export type UserRole = 'ADMIN' | 'STAFF';
export type ThemeMode = 'light' | 'dark';

export interface UserAccount {
  id: string;
  name: string;
  username: string;
  role: UserRole;
  staffId?: string; // If role === 'STAFF'
  department: string;
  designation: string;
  email: string;
  password?: string;
  isActive?: boolean;
  createdAt?: string;
}

export interface StaffMember {
  sNo: number;
  id: string;
  name: string;
  department: string;
  designation: string;
  email: string;
  username?: string;
  password?: string;
  defaultKpis: string[];
  isCoreStaff?: boolean; // Core operational staff
  isActive?: boolean;
  createdAt?: string;
}

export interface TaskEntry {
  id: string;
  kpi: string;
  description: string;
  status: TaskStatus;
  kpiValue: string; // e.g. "12", "4 requests", "2 classes"
  keyAchievement?: string;
  isCustom?: boolean;
}

export interface DailyReport {
  id: string; // YYYY-MM-DD_staffId
  date: string; // YYYY-MM-DD
  staffId: string;
  staffName: string;
  department: DepartmentRole;
  designation: string;
  deadline: string; // "4:00 PM" or "5:00 PM"
  submissionTimestamp?: string;
  submissionTime?: string; // e.g. "03:45 PM"
  complianceStatus: ComplianceStatus;
  priority: PriorityLevel;
  workDoneSummary?: string; // What work did you do today
  activitiesPerformed?: string; // What activities were performed today
  issuesHeld?: string; // Were there any issues or problems held today
  cashCollected?: string; // How much cash was generated and collected today
  hasUnusualActivities?: boolean; // Were there any unusual, unwanted, or extra activities
  unusualActivityType?: string; // Type of unusual activity (e.g. Unwanted incident, extra unscheduled duty, security issue)
  unusualActivitiesDetails?: string; // Detailed description of unusual, extra or unwanted activities
  tasks: TaskEntry[];
  overallStatus: TaskStatus;
  supportNeeded: boolean;
  supportDetails: string;
  challengeBlocker: string;
  priorityTomorrow: string;
  keyAchievementsSummary: string;
  managerReview?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  isDraft?: boolean;
  updatedAt: string;
}

export type ActiveView = 'REPORT' | 'DASHBOARD' | 'MASTER_LOG' | 'INSTRUCTIONS' | 'ANALYTICS' | 'REMINDERS' | 'USERS';

export type AnalyticsDateRange = 'TODAY' | '7D' | '14D' | '30D' | 'ALL';

export interface KpiMetricProgress {
  kpi: string;
  totalLogged: number;
  completedCount: number;
  inProgressCount: number;
  completionRate: number;
  latestValue?: string;
  status: 'Excellent' | 'Good' | 'Needs Attention';
}

export interface EmployeeAnalytics {
  staff: StaffMember;
  totalDaysTracked: number;
  submittedReportsCount: number;
  onTimeSubmissions: number;
  lateSubmissions: number;
  submissionRate: number; // %
  onTimeRate: number; // %
  totalTasksLogged: number;
  completedTasks: number;
  inProgressTasks: number;
  taskCompletionRate: number; // %
  kpiProgressList: KpiMetricProgress[];
  blockersReportedCount: number;
  recentBlockers: Array<{ date: string; blocker: string }>;
  supportRequestsCount: number;
  recentSupportRequests: Array<{ date: string; details: string }>;
  performanceRating: 'High Performer' | 'On Track' | 'Attention Required';
  submissionsHistory: DailyReport[];
}

export interface DepartmentWorkSummary {
  department: DepartmentRole;
  staffCount: number;
  reportsExpected: number;
  reportsSubmitted: number;
  complianceRate: number;
  tasksLogged: number;
  tasksCompleted: number;
  tasksInProgress: number;
  completionRate: number;
  blockersCount: number;
  supportNeededCount: number;
  status: 'Optimal' | 'Average' | 'Lagging';
}

export interface WorkAnalytics {
  dateRangeLabel: string;
  totalReportsExpected: number;
  totalReportsSubmitted: number;
  overallComplianceRate: number;
  totalTasksLogged: number;
  tasksCompleted: number;
  tasksInProgress: number;
  tasksPending: number;
  overallTaskCompletionRate: number;
  departmentSummaries: DepartmentWorkSummary[];
  activeBlockers: Array<{
    date: string;
    staffId: string;
    staffName: string;
    department: DepartmentRole;
    blocker: string;
    resolved?: boolean;
  }>;
  managementSupportQueue: Array<{
    reportId: string;
    date: string;
    staffId: string;
    staffName: string;
    department: DepartmentRole;
    details: string;
    priority: PriorityLevel;
    managerReview?: string;
  }>;
  topPerformingStaff: Array<{ staffName: string; department: string; onTimeRate: number; completionRate: number }>;
  attentionRequiredStaff: Array<{ staffName: string; department: string; issue: string }>;
}

export interface DashboardMetrics {
  totalRequired: number;
  submittedOnTime: number;
  late: number;
  notSubmitted: number;
  complianceRate: number;
  totalTaskEntries: number;
  pendingTasks: number;
  inProgressTasks: number;
  completedTasks: number;
  missingReports?: number;
  submissionRate?: number;
  onTimeRate?: number;
  criticalBlockersCount?: number;
  pendingTasksCount?: number;
}

