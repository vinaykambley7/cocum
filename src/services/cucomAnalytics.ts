import { 
  StaffMember, 
  DailyReport, 
  AnalyticsDateRange, 
  EmployeeAnalytics, 
  WorkAnalytics, 
  DepartmentWorkSummary, 
  KpiMetricProgress,
  DepartmentRole 
} from '../types/cucom';
import { DEPARTMENT_KPIS } from '../data/cucomCatalog';

/**
 * Returns date string YYYY-MM-DD for a given offset from a reference date string
 */
export function getDateOffset(referenceDate: string, daysOffset: number): string {
  const d = new Date(referenceDate);
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString().slice(0, 10);
}

/**
 * Returns array of date strings for the specified date range
 */
export function getDateListForRange(referenceDate: string, range: AnalyticsDateRange): string[] {
  const days = range === 'TODAY' ? 1 : range === '7D' ? 7 : range === '14D' ? 14 : range === '30D' ? 30 : 60;
  const dates: string[] = [];
  for (let i = 0; i < days; i++) {
    dates.push(getDateOffset(referenceDate, -i));
  }
  return dates;
}

/**
 * Filters reports matching the chosen date range
 */
export function filterReportsByDateRange(
  reports: DailyReport[],
  range: AnalyticsDateRange,
  referenceDate: string = new Date().toISOString().slice(0, 10)
): DailyReport[] {
  if (range === 'ALL') return reports;

  const validDates = new Set(getDateListForRange(referenceDate, range));
  return reports.filter(r => validDates.has(r.date));
}

/**
 * Computes detailed individual analytics for a single staff member
 */
export function calculateEmployeeAnalytics(
  staffId: string,
  allReports: DailyReport[],
  staffList: StaffMember[],
  range: AnalyticsDateRange = '14D',
  referenceDate: string = new Date().toISOString().slice(0, 10)
): EmployeeAnalytics {
  const staff = staffList.find(s => s.id === staffId) || staffList[0];
  const dateList = getDateListForRange(referenceDate, range);
  const totalDaysTracked = range === 'ALL' ? Math.max(1, new Set(allReports.map(r => r.date)).size) : dateList.length;

  // Filter reports for this staff
  const staffReports = filterReportsByDateRange(allReports, range, referenceDate)
    .filter(r => r.staffId === staff.id)
    .sort((a, b) => b.date.localeCompare(a.date));

  const submittedReportsCount = staffReports.length;
  let onTimeSubmissions = 0;
  let lateSubmissions = 0;
  let totalTasksLogged = 0;
  let completedTasks = 0;
  let inProgressTasks = 0;

  const recentBlockers: Array<{ date: string; blocker: string }> = [];
  const recentSupportRequests: Array<{ date: string; details: string }> = [];

  // Track KPI-level metrics
  const kpiMap = new Map<string, { total: number; done: number; inProgress: number; latestValue: string }>();

  // Initialize with staff default KPIs
  (staff.defaultKpis || []).forEach(k => {
    kpiMap.set(k, { total: 0, done: 0, inProgress: 0, latestValue: '' });
  });

  staffReports.forEach(r => {
    if (r.complianceStatus === 'SUBMITTED ON TIME') onTimeSubmissions++;
    else if (r.complianceStatus === 'LATE') lateSubmissions++;

    if (r.challengeBlocker && r.challengeBlocker.trim() !== '' && r.challengeBlocker.toLowerCase() !== 'none' && !r.challengeBlocker.toLowerCase().includes('no critical')) {
      recentBlockers.push({ date: r.date, blocker: r.challengeBlocker });
    }

    if (r.supportNeeded && r.supportDetails && r.supportDetails.trim() !== '') {
      recentSupportRequests.push({ date: r.date, details: r.supportDetails });
    }

    r.tasks.forEach(t => {
      if (t.description && t.description.trim() !== '') {
        totalTasksLogged++;
        if (t.status === 'Done') completedTasks++;
        else if (t.status === 'In Progress') inProgressTasks++;

        // Update KPI map
        const existing = kpiMap.get(t.kpi) || { total: 0, done: 0, inProgress: 0, latestValue: '' };
        existing.total++;
        if (t.status === 'Done') existing.done++;
        else if (t.status === 'In Progress') existing.inProgress++;
        if (t.kpiValue && !existing.latestValue) {
          existing.latestValue = t.kpiValue;
        }
        kpiMap.set(t.kpi, existing);
      }
    });
  });

  const submissionRate = Math.min(100, Math.round((submittedReportsCount / Math.max(1, totalDaysTracked)) * 100));
  const onTimeRate = submittedReportsCount > 0 ? Math.round((onTimeSubmissions / submittedReportsCount) * 100) : 0;
  const taskCompletionRate = totalTasksLogged > 0 ? Math.round((completedTasks / totalTasksLogged) * 100) : 0;

  // Build KPI list
  const kpiProgressList: KpiMetricProgress[] = Array.from(kpiMap.entries()).map(([kpi, stats]) => {
    const rate = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;
    let status: 'Excellent' | 'Good' | 'Needs Attention' = 'Good';
    if (rate >= 80) status = 'Excellent';
    else if (rate < 50) status = 'Needs Attention';

    return {
      kpi,
      totalLogged: stats.total,
      completedCount: stats.done,
      inProgressCount: stats.inProgress,
      completionRate: rate,
      latestValue: stats.latestValue || undefined,
      status
    };
  });

  // Calculate overall performance rating
  let performanceRating: 'High Performer' | 'On Track' | 'Attention Required' = 'On Track';
  if (onTimeRate >= 80 && taskCompletionRate >= 75) {
    performanceRating = 'High Performer';
  } else if (onTimeRate < 50 || (submittedReportsCount > 0 && taskCompletionRate < 45)) {
    performanceRating = 'Attention Required';
  }

  return {
    staff,
    totalDaysTracked,
    submittedReportsCount,
    onTimeSubmissions,
    lateSubmissions,
    submissionRate,
    onTimeRate,
    totalTasksLogged,
    completedTasks,
    inProgressTasks,
    taskCompletionRate,
    kpiProgressList,
    blockersReportedCount: recentBlockers.length,
    recentBlockers,
    supportRequestsCount: recentSupportRequests.length,
    recentSupportRequests,
    performanceRating,
    submissionsHistory: staffReports
  };
}

/**
 * Computes institutional work analytics across all 24 departments and 25 candidates
 */
export function calculateWorkAnalytics(
  allReports: DailyReport[],
  staffList: StaffMember[],
  range: AnalyticsDateRange = '14D',
  referenceDate: string = new Date().toISOString().slice(0, 10)
): WorkAnalytics {
  const dateList = getDateListForRange(referenceDate, range);
  const totalDays = range === 'ALL' ? Math.max(1, new Set(allReports.map(r => r.date)).size) : dateList.length;
  const filteredReports = filterReportsByDateRange(allReports, range, referenceDate);

  const totalReportsExpected = staffList.length * totalDays;
  const totalReportsSubmitted = filteredReports.length;
  const overallComplianceRate = totalReportsExpected > 0 ? Math.min(100, Math.round((totalReportsSubmitted / totalReportsExpected) * 100)) : 0;

  let totalTasksLogged = 0;
  let tasksCompleted = 0;
  let tasksInProgress = 0;
  let tasksPending = 0;

  const activeBlockers: WorkAnalytics['activeBlockers'] = [];
  const managementSupportQueue: WorkAnalytics['managementSupportQueue'] = [];

  // Group by department
  const deptStats = new Map<DepartmentRole, {
    staffCount: number;
    reportsSubmitted: number;
    tasksLogged: number;
    tasksDone: number;
    tasksInProgress: number;
    blockersCount: number;
    supportCount: number;
  }>();

  // Initialize all departments
  staffList.forEach(s => {
    if (!deptStats.has(s.department)) {
      deptStats.set(s.department, {
        staffCount: 0,
        reportsSubmitted: 0,
        tasksLogged: 0,
        tasksDone: 0,
        tasksInProgress: 0,
        blockersCount: 0,
        supportCount: 0
      });
    }
    const d = deptStats.get(s.department)!;
    d.staffCount++;
  });

  filteredReports.forEach(r => {
    const d = deptStats.get(r.department) || {
      staffCount: 1,
      reportsSubmitted: 0,
      tasksLogged: 0,
      tasksDone: 0,
      tasksInProgress: 0,
      blockersCount: 0,
      supportCount: 0
    };

    d.reportsSubmitted++;

    if (r.challengeBlocker && r.challengeBlocker.trim() !== '' && r.challengeBlocker.toLowerCase() !== 'none' && !r.challengeBlocker.toLowerCase().includes('no critical')) {
      d.blockersCount++;
      activeBlockers.push({
        date: r.date,
        staffId: r.staffId,
        staffName: r.staffName,
        department: r.department,
        blocker: r.challengeBlocker,
        resolved: !!r.managerReview
      });
    }

    if (r.supportNeeded) {
      d.supportCount++;
      managementSupportQueue.push({
        reportId: r.id,
        date: r.date,
        staffId: r.staffId,
        staffName: r.staffName,
        department: r.department,
        details: r.supportDetails || 'Dean/Management assistance requested',
        priority: r.priority,
        managerReview: r.managerReview
      });
    }

    r.tasks.forEach(t => {
      if (t.description && t.description.trim() !== '') {
        totalTasksLogged++;
        d.tasksLogged++;
        if (t.status === 'Done') {
          tasksCompleted++;
          d.tasksDone++;
        } else if (t.status === 'In Progress') {
          tasksInProgress++;
          d.tasksInProgress++;
        } else {
          tasksPending++;
        }
      }
    });

    deptStats.set(r.department, d);
  });

  const overallTaskCompletionRate = totalTasksLogged > 0 ? Math.round((tasksCompleted / totalTasksLogged) * 100) : 0;

  // Build Department summaries
  const departmentSummaries: DepartmentWorkSummary[] = Array.from(deptStats.entries()).map(([department, stat]) => {
    const expected = stat.staffCount * totalDays;
    const complianceRate = expected > 0 ? Math.min(100, Math.round((stat.reportsSubmitted / expected) * 100)) : 0;
    const completionRate = stat.tasksLogged > 0 ? Math.round((stat.tasksDone / stat.tasksLogged) * 100) : 0;

    let status: 'Optimal' | 'Average' | 'Lagging' = 'Optimal';
    if (complianceRate < 60 || completionRate < 50) {
      status = 'Lagging';
    } else if (complianceRate < 80 || completionRate < 70) {
      status = 'Average';
    }

    return {
      department,
      staffCount: stat.staffCount,
      reportsExpected: expected,
      reportsSubmitted: stat.reportsSubmitted,
      complianceRate,
      tasksLogged: stat.tasksLogged,
      tasksCompleted: stat.tasksDone,
      tasksInProgress: stat.tasksInProgress,
      completionRate,
      blockersCount: stat.blockersCount,
      supportNeededCount: stat.supportCount,
      status
    };
  }).sort((a, b) => b.completionRate - a.completionRate);

  // Compute staff leaderboards
  const staffPerformance = staffList.map(s => {
    const analytics = calculateEmployeeAnalytics(s.id, allReports, staffList, range, referenceDate);
    return {
      staffName: s.name,
      department: s.department,
      onTimeRate: analytics.onTimeRate,
      completionRate: analytics.taskCompletionRate,
      submissionRate: analytics.submissionRate,
      blockers: analytics.blockersReportedCount
    };
  });

  const topPerformingStaff = [...staffPerformance]
    .filter(s => s.submissionRate >= 50)
    .sort((a, b) => (b.onTimeRate + b.completionRate) - (a.onTimeRate + a.completionRate))
    .slice(0, 5)
    .map(s => ({
      staffName: s.staffName,
      department: s.department,
      onTimeRate: s.onTimeRate,
      completionRate: s.completionRate
    }));

  const attentionRequiredStaff = [...staffPerformance]
    .filter(s => s.submissionRate < 60 || s.onTimeRate < 50 || s.blockers >= 2)
    .slice(0, 5)
    .map(s => {
      let issue = 'Low Submission Rate';
      if (s.blockers >= 2) issue = `${s.blockers} Blockers Reported`;
      else if (s.onTimeRate < 50) issue = 'Frequent Late Submissions';
      return {
        staffName: s.staffName,
        department: s.department,
        issue
      };
    });

  const dateRangeLabel = range === 'TODAY' 
    ? `Today (${referenceDate})` 
    : range === '7D' 
    ? `Last 7 Days (Ending ${referenceDate})` 
    : range === '14D' 
    ? `Last 14 Days (Ending ${referenceDate})` 
    : range === '30D' 
    ? `Last 30 Days (Ending ${referenceDate})` 
    : `Institutional All-Time (${totalDays} Days)`;

  return {
    dateRangeLabel,
    totalReportsExpected,
    totalReportsSubmitted,
    overallComplianceRate,
    totalTasksLogged,
    tasksCompleted,
    tasksInProgress,
    tasksPending,
    overallTaskCompletionRate,
    departmentSummaries,
    activeBlockers: activeBlockers.slice(0, 20),
    managementSupportQueue: managementSupportQueue.slice(0, 20),
    topPerformingStaff,
    attentionRequiredStaff
  };
}

/**
 * Generates rich, realistic historical institutional reports for the previous 14 days
 * across staff members, so Dean/Admin can immediately view deep trends, blocker queues,
 * and KPI completion rates without needing weeks of manual entries.
 */
export function generateHistoricalReports(daysBack: number = 14, staffList: StaffMember[]): DailyReport[] {
  const reports: DailyReport[] = [];
  const today = new Date();

  // Pick diverse sample templates
  const sampleDescriptions: Record<string, Array<{ desc: string; val: string; ach: string }>> = {
    'Human Resources': [
      { desc: 'Reviewed faculty leave applications and updated biometrics attendance log', val: '4 leaves', ach: '100% staff payroll alignment' },
      { desc: 'Conducted screening interviews for Clinical Simulation coordinator candidate', val: '3 candidates', ach: 'Shortlist submitted to Dean' },
      { desc: 'Updated institutional faculty visa renewals file for Ministry of Education', val: '2 renewals', ach: 'Compliance certificates cleared' },
      { desc: 'Audited staff health insurance enrollment logs for new quarter', val: '35 files', ach: 'All premium schedules verified' },
      { desc: 'Facilitated grievance resolution meeting with lab technician team', val: '1 session', ach: 'Shift scheduling agreement reached' },
      { desc: 'Compiled monthly institutional staffing report for Academic Leadership', val: '1 report', ach: 'Completed ahead of schedule' }
    ],
    'Library': [
      { desc: 'Assisted MD3 and MD4 students with PubMed and UpToDate clinical queries', val: '18 students', ach: 'Zero research retrieval delays' },
      { desc: 'Cataloged new shipment of Lippincott Pharmacology and Robbins Pathology textbooks', val: '24 volumes', ach: 'QR shelf labels printed' },
      { desc: 'Reconciled e-resource license renewals and proxy server access tokens', val: '6 subscriptions', ach: 'Continuous journal access secured' },
      { desc: 'Issued reminder notices for overdue anatomy atlas reference volumes', val: '12 notices', ach: '8 books returned within 24h' },
      { desc: 'Conducted digital literacy workshop for incoming PreMed students', val: '22 attendees', ach: 'Positive student evaluations' },
      { desc: 'Audited reading hall noise levels and environmental climate control', val: '3 inspections', ach: 'Quiet study environment maintained' }
    ],
    'Finance & Accounts': [
      { desc: 'Reconciled student tuition fee wires and issued official clearance receipts', val: '15 vouchers', ach: 'Bank ledger matched to the dollar' },
      { desc: 'Processed campus utility invoices and lab supplier payment disbursements', val: '7 invoices', ach: 'Zero vendor overdue penalties' },
      { desc: 'Audited clinical rotation fee schedules with affiliated teaching hospitals', val: '3 hospital agreements', ach: 'Audit memorandum drafted' },
      { desc: 'Prepared cash flow statement for Dean and Board of Trustees briefing', val: '1 report', ach: 'Reviewed by Chief Financial Officer' },
      { desc: 'Followed up on overdue semester installment plans with international students', val: '9 contacts', ach: '5 payment plans restructured' },
      { desc: 'Generated tax compliance deduction forms for administrative staff payroll', val: '35 payroll entries', ach: 'Statutory compliance ensured' }
    ],
    'Campus Facilities': [
      { desc: 'Inspected backup diesel generator system and fuel storage capacity', val: '400L reserve', ach: 'Auto-transfer switch passed 30s test' },
      { desc: 'Closed electrical HVAC ticket in Gross Anatomy dissection laboratory', val: '3 chillers serviced', ach: 'Target temperature 18°C stabilized' },
      { desc: 'Tested fire extinguisher pressure seals and emergency exit lighting', val: '28 units inspected', ach: 'Safety audit log signed' },
      { desc: 'Coordinated plumbing repairs on Second Floor student restroom facilities', val: '2 fixtures replaced', ach: 'Water conservation valves fitted' },
      { desc: 'Supervised waste collection and hazardous medical bio-waste disposal', val: '6 containers', ach: 'Certified biohazard manifest filed' },
      { desc: 'Scheduled quarterly elevator maintenance with certified vendor technician', val: '1 contract visit', ach: 'Safety certificate updated' }
    ],
    'Examinations': [
      { desc: 'Prepared question papers and cryptographic sealing for MD2 Pathology midterm', val: '3 sets verified', ach: 'Zero leaks, audited proctor chain' },
      { desc: 'Coordinated NBME shelf examination proctor scheduling for clinical students', val: '14 proctors', ach: 'Collision-free proctor roster' },
      { desc: 'Published provisional score sheets for PreMed Biochemistry module', val: '45 scorecards', ach: 'Uploaded to student portal securely' },
      { desc: 'Processed special examination accommodation request for injured student', val: '1 accommodation', ach: 'Wheelchair access proctor station ready' },
      { desc: 'Audited CCTV surveillance and lockbox protocols in secure exam vault', val: '2 inspections', ach: 'Full institutional compliance' },
      { desc: 'Generated historical grade distribution analytics for Curriculum Committee', val: '1 report', ach: 'Passed Dean review' }
    ]
  };

  // Generate historical reports for past days
  for (let dayOffset = 1; dayOffset <= daysBack; dayOffset++) {
    const reportDate = getDateOffset(today.toISOString().slice(0, 10), -dayOffset);
    const dayOfWeek = new Date(reportDate).getDay();

    // Skip Sundays
    if (dayOfWeek === 0) continue;

    staffList.forEach((staff, staffIdx) => {
      // 85% submission probability to create natural, realistic compliance variations
      const seed = (staffIdx * 17 + dayOffset * 31) % 100;
      if (seed < 12) {
        // Skip submission (not submitted / absent)
        return;
      }

      const isLate = seed >= 78; // ~14% late rate
      const submissionHour = isLate ? 17 : 15;
      const submissionMin = (seed * 3) % 60;
      const submissionTime = `${String(submissionHour).padStart(2, '0')}:${String(submissionMin).padStart(2, '0')} ${submissionHour >= 12 ? 'PM' : 'AM'}`;
      const complianceStatus = isLate ? 'LATE' : 'SUBMITTED ON TIME';

      // Pick default KPI templates or department templates
      const kpis = staff.defaultKpis || DEPARTMENT_KPIS[staff.department] || [
        'Core Department Task 1',
        'Core Department Task 2',
        'Core Department Task 3',
        'Core Department Task 4',
        'Core Department Task 5',
        'Core Department Task 6'
      ];

      const deptTemplates = sampleDescriptions[staff.department] || [
        { desc: `Executed daily departmental responsibilities for ${staff.department}`, val: 'Completed', ach: 'Standards maintained' },
        { desc: `Processed routine administrative and operational requirements`, val: '3 items', ach: 'Follow-ups logged' },
        { desc: `Participated in departmental coordination and workflow sync`, val: '1 meeting', ach: 'Action items noted' },
        { desc: `Updated documentation and physical/digital logs`, val: '6 records', ach: 'Compliant with policy' },
        { desc: `Handled inquiries and support tickets from faculty and students`, val: '5 tickets', ach: 'Resolved within SLA' },
        { desc: `Planned operational priorities for upcoming academic cycle`, val: 'Draft plan', ach: 'Shared with management' }
      ];

      const tasks = kpis.slice(0, 6).map((kpi, kIdx) => {
        const tSeed = (seed + kIdx * 19) % 100;
        const status = tSeed < 70 ? 'Done' : tSeed < 92 ? 'In Progress' : 'Pending';
        const template = deptTemplates[kIdx % deptTemplates.length];

        return {
          id: `task-${dayOffset}-${staff.id}-${kIdx}`,
          kpi,
          description: template.desc,
          status: status as any,
          kpiValue: template.val,
          keyAchievement: template.ach
        };
      });

      const hasBlocker = seed % 7 === 0;
      const blockerText = hasBlocker
        ? `Delayed pending supplier invoice confirmation for ${staff.department}`
        : '';

      const needsSupport = seed % 9 === 0;
      const supportDetails = needsSupport
        ? `Requesting Dean approval for expedited departmental budget allocation`
        : '';

      const report: DailyReport = {
        id: `${reportDate}_${staff.id}`,
        date: reportDate,
        staffId: staff.id,
        staffName: staff.name,
        department: staff.department,
        designation: staff.designation,
        deadline: '5:00 PM',
        submissionTimestamp: `${reportDate}T${submissionHour}:${String(submissionMin).padStart(2, '0')}:00Z`,
        submissionTime,
        complianceStatus: complianceStatus as any,
        priority: needsSupport ? 'Urgent' : 'Normal',
        tasks,
        overallStatus: tasks.filter(t => t.status === 'Done').length >= 4 ? 'Done' : 'In Progress',
        supportNeeded: needsSupport,
        supportDetails,
        challengeBlocker: blockerText,
        priorityTomorrow: `Finalize remaining action items and coordinate with Dean's office`,
        keyAchievementsSummary: `Completed core institutional deliverables for ${staff.department}.`,
        managerReview: seed % 5 === 0 ? 'Acknowledged and reviewed by Dean Office.' : undefined,
        reviewedBy: seed % 5 === 0 ? 'Dean & Academic Leadership' : undefined,
        reviewedAt: seed % 5 === 0 ? `${reportDate}T18:10:00Z` : undefined,
        updatedAt: `${reportDate}T${submissionHour}:${String(submissionMin).padStart(2, '0')}:00Z`
      };

      reports.push(report);
    });
  }

  return reports;
}
