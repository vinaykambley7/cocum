import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { StaffMember, DailyReport, DashboardMetrics } from '../types/cucom';

// 1. Export Management Submission Dashboard to Excel
export function exportDashboardToExcel(
  date: string,
  staffList: StaffMember[],
  reports: DailyReport[],
  metrics: DashboardMetrics
) {
  const wb = XLSX.utils.book_new();

  // Create lookup for reports on this date
  const reportMap = new Map<string, DailyReport>();
  reports.filter(r => r.date === date).forEach(r => reportMap.set(r.staffId, r));

  // Build Dashboard Data Sheet
  const dashboardRows: any[] = [
    ['CUCOM DAILY REPORTING SYSTEM - SUBMISSION DASHBOARD'],
    [`Report Date: ${date}`],
    [`Submission Deadline: 5:00 PM Daily`],
    [],
    ['SUMMARY METRICS'],
    ['Total Required Candidates', metrics.totalRequired],
    ['Submitted On Time', metrics.submittedOnTime],
    ['Submitted Late', metrics.late],
    ['Not Submitted (Pending)', metrics.notSubmitted],
    ['Compliance Rate', `${metrics.complianceRate.toFixed(1)}%`],
    ['Total Operational Entries', metrics.totalTaskEntries],
    [],
    ['CANDIDATE SUBMISSION ROSTER (25 CANDIDATES)'],
    [
      'S.No',
      'Candidate Name',
      'Department / Unit',
      'Designation',
      'What Work Did You Do Today',
      'Activities Performed',
      'Issues Held',
      'Cash Collected ($)',
      'Cash Breakdown / Source',
      'Unusual Activities / Incidents',
      'Incident Details',
      'Submission Status',
      'Submission Time',
      'Tomorrow Priority',
      'Executive Review'
    ]
  ];

  staffList.forEach(staff => {
    const report = reportMap.get(staff.id);
    dashboardRows.push([
      staff.sNo,
      staff.name,
      staff.department,
      staff.designation,
      report?.workDoneSummary || report?.keyAchievementsSummary || '-',
      report?.activitiesPerformed || (report ? `${report.tasks.filter(t => t.status === 'Done').length} of ${report.tasks.length} tasks completed` : '-'),
      report?.issuesHeld || report?.challengeBlocker || 'No issues held',
      report?.cashCollected || '$0.00 / N/A',
      report?.supportDetails || '-',
      report?.hasUnusualActivities ? (report.unusualActivityType || 'FLAGGED') : 'None',
      report?.hasUnusualActivities ? (report.unusualActivitiesDetails || '-') : 'None',
      report ? report.complianceStatus : 'NOT SUBMITTED',
      report?.submissionTime || '-',
      report?.priorityTomorrow || '-',
      report?.managerReview || '-'
    ]);
  });

  const wsDashboard = XLSX.utils.aoa_to_sheet(dashboardRows);

  // Set column widths
  wsDashboard['!cols'] = [
    { wch: 6 },
    { wch: 25 },
    { wch: 30 },
    { wch: 35 },
    { wch: 45 },
    { wch: 40 },
    { wch: 25 },
    { wch: 18 },
    { wch: 30 },
    { wch: 25 },
    { wch: 40 },
    { wch: 22 },
    { wch: 18 },
    { wch: 35 },
    { wch: 35 }
  ];

  XLSX.utils.book_append_sheet(wb, wsDashboard, 'Submission Dashboard');

  // Trigger download
  XLSX.writeFile(wb, `CUCOM_Daily_Report_Dashboard_${date}.xlsx`);
}

// 2. Export Master Log to Excel
export function exportMasterLogToExcel(reports: DailyReport[], filename?: string) {
  const wb = XLSX.utils.book_new();

  const headers = [
    'Date',
    'Candidate Name',
    'Department',
    'Designation',
    'What Work Did You Do Today',
    'Activities Performed',
    'Issues Held',
    'Cash Collected ($)',
    'Cash Breakdown / Source',
    'Unusual / Incidents Flagged',
    'Incident Detailed Description',
    'Status',
    'Submission Time',
    'Tomorrow Priority',
    'Dean Review Remarks'
  ];

  const data = reports.map(r => {
    return [
      r.date,
      r.staffName,
      r.department,
      r.designation,
      r.workDoneSummary || r.keyAchievementsSummary || '-',
      r.activitiesPerformed || `${r.tasks.filter(t => t.status === 'Done').length} of ${r.tasks.length} tasks completed`,
      r.issuesHeld || r.challengeBlocker || 'No issues held',
      r.cashCollected || '$0.00 / N/A',
      r.supportDetails || '-',
      r.hasUnusualActivities ? (r.unusualActivityType || 'FLAGGED') : 'None',
      r.hasUnusualActivities ? (r.unusualActivitiesDetails || '-') : 'None',
      r.complianceStatus,
      r.submissionTime || '-',
      r.priorityTomorrow || '-',
      r.managerReview || '-'
    ];
  });

  const ws = XLSX.utils.aoa_to_sheet([
    ['CUCOM DAILY REPORT MASTER LOG'],
    [],
    headers,
    ...data
  ]);

  ws['!cols'] = [
    { wch: 12 },
    { wch: 25 },
    { wch: 30 },
    { wch: 30 },
    { wch: 45 },
    { wch: 40 },
    { wch: 25 },
    { wch: 18 },
    { wch: 30 },
    { wch: 25 },
    { wch: 40 },
    { wch: 22 },
    { wch: 16 },
    { wch: 35 },
    { wch: 35 }
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Master Log');
  XLSX.writeFile(wb, filename || `CUCOM_Master_Log_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

// 3. Export Single Report to Institutional PDF
export function exportReportToPDF(report: DailyReport) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const primaryColor = [198, 0, 3]; // Official CUCOM Red #C60003

  // Header Banner
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, 210, 22, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(`DAILY REPORT - ${report.department.toUpperCase()}`, 105, 12, { align: 'center' });
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text('COMMONWEALTH UNIVERSITY COLLEGE OF MEDICINE (CUCOM)', 105, 18, { align: 'center' });

  // Submitter Information Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, 26, 182, 28, 2, 2, 'FD');

  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('SUBMITTER INFORMATION', 18, 33);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.text(`Candidate Name: ${report.staffName}`, 18, 39);
  doc.text(`Designation: ${report.designation}`, 18, 45);
  doc.text(`Department: ${report.department}`, 18, 51);

  doc.text(`Report Date: ${report.date}`, 120, 39);
  doc.text(`Submission Time: ${report.submissionTime || 'Pending'}`, 120, 45);
  doc.text(`Submission Deadline: ${report.deadline} Daily`, 120, 51);

  // Compliance Badge
  if (report.complianceStatus === 'SUBMITTED ON TIME') {
    doc.setTextColor(22, 101, 52); // green
  } else if (report.complianceStatus === 'LATE') {
    doc.setTextColor(194, 65, 12); // orange
  } else {
    doc.setTextColor(185, 28, 28); // red
  }
  doc.setFont('helvetica', 'bold');
  doc.text(`Status: ${report.complianceStatus}`, 182, 33, { align: 'right' });

  let currentY = 58;

  // 1. WHAT WORK DID YOU DO TODAY?
  doc.setFillColor(254, 252, 232); // Light amber/neutral
  doc.setDrawColor(254, 240, 138);
  doc.roundedRect(14, currentY, 182, 22, 1.5, 1.5, 'FD');

  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('1. WHAT WORK DID YOU DO TODAY? (PRIMARY WORK SUMMARY)', 18, currentY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(8);
  const workLines = doc.splitTextToSize(report.workDoneSummary || report.keyAchievementsSummary || 'Operational duties completed per schedule.', 174);
  doc.text(workLines, 18, currentY + 11);

  currentY += 26;

  // 2. ACTIVITIES PERFORMED TODAY
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('2. ACTIVITIES PERFORMED TODAY', 14, currentY);

  currentY += 4;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, currentY, 182, 32, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(8);
  const actLines = doc.splitTextToSize(report.activitiesPerformed || 'Standard daily operations and scheduled duties carried out.', 174);
  doc.text(actLines, 18, currentY + 7);

  currentY += 38;

  // 3. ISSUES HELD & 4. CASH COLLECTED SPLIT BOX
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, currentY, 88, 24, 1.5, 1.5, 'FD');
  doc.roundedRect(108, currentY, 88, 24, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(185, 28, 28);
  doc.text('3. ISSUES / PROBLEMS HELD TODAY', 18, currentY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.setFontSize(7.5);
  const blockLines = doc.splitTextToSize(report.issuesHeld || report.challengeBlocker || 'No issues held - operations ran smoothly.', 80);
  doc.text(blockLines, 18, currentY + 10);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(22, 101, 52);
  doc.text(`4. CASH COLLECTED: ${report.cashCollected || '$0.00 / N/A'}`, 112, currentY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.setFontSize(7.5);
  const cashLines = doc.splitTextToSize(report.supportDetails || 'No cash receipts / tuition collected.', 80);
  doc.text(cashLines, 112, currentY + 10);

  currentY += 28;

  // 5. UNUSUAL, EXTRA OR UNWANTED ACTIVITIES
  if (report.hasUnusualActivities) {
    doc.setFillColor(255, 241, 242); // Rose alert
    doc.setDrawColor(244, 63, 94);
  } else {
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
  }
  doc.roundedRect(14, currentY, 182, 22, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(report.hasUnusualActivities ? 225 : 51, report.hasUnusualActivities ? 29 : 65, report.hasUnusualActivities ? 72 : 85);
  doc.text(
    `5. UNUSUAL, EXTRA OR UNWANTED ACTIVITIES: ${report.hasUnusualActivities ? `[FLAGGED: ${report.unusualActivityType || 'INCIDENT'}]` : '[NONE - NORMAL OPERATIONS]'}`,
    18,
    currentY + 5
  );

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(7.5);
  const unusualLines = doc.splitTextToSize(
    report.hasUnusualActivities 
      ? (report.unusualActivitiesDetails || 'Incident flagged without description.') 
      : 'No unusual, unscheduled, unwanted, or emergency activities reported for this shift.',
    174
  );
  doc.text(unusualLines, 18, currentY + 11);

  currentY += 26;

  // 6. PRIORITY FOR TOMORROW & EXECUTIVE DEAN REMARKS
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, currentY, 88, 22, 1.5, 1.5, 'FD');
  doc.roundedRect(108, currentY, 88, 22, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('6. PRIORITY TASK FOR TOMORROW', 18, currentY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.setFontSize(7.5);
  const prioLines = doc.splitTextToSize(report.priorityTomorrow || 'Continue scheduled operational workflows.', 80);
  doc.text(prioLines, 18, currentY + 10);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('OFFICIAL DEAN REVIEW & GUIDANCE', 112, currentY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.setFontSize(7.5);
  const reviewLines = doc.splitTextToSize(report.managerReview || 'Pending review by department head / Dean.', 80);
  doc.text(reviewLines, 112, currentY + 10);

  // Footer note
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Official Record of CUCOM Daily Reporting System | Generated: ${new Date().toLocaleString()}`,
    105,
    288,
    { align: 'center' }
  );

  doc.save(`CUCOM_Daily_Report_${report.department.replace(/[^a-zA-Z0-9]/g, '_')}_${report.date}.pdf`);
}

// 4. Export Management Master Log to PDF
export function exportMasterLogToPDF(reports: DailyReport[], date: string) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  // Banner
  doc.setFillColor(198, 0, 3);
  doc.rect(0, 0, 297, 18, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('CUCOM DAILY REPORT MASTER LOG & COMPLIANCE RECORD', 148.5, 11, { align: 'center' });

  const tableData = reports.map((r, i) => [
    i + 1,
    r.date,
    r.staffName,
    r.department,
    (r.workDoneSummary || r.keyAchievementsSummary || '-').slice(0, 45) + ((r.workDoneSummary || r.keyAchievementsSummary || '').length > 45 ? '...' : ''),
    r.issuesHeld && !r.issuesHeld.toLowerCase().includes('none') && r.issuesHeld !== 'No issues held' ? 'Issues Logged' : 'Smooth',
    r.cashCollected || '$0.00 / N/A',
    r.hasUnusualActivities ? (r.unusualActivityType || 'FLAGGED') : 'None',
    r.complianceStatus === 'SUBMITTED ON TIME' ? 'On Time' : r.complianceStatus === 'LATE' ? 'Late' : 'Pending',
    r.submissionTime || '-'
  ]);

  autoTable(doc, {
    startY: 24,
    head: [['#', 'Date', 'Candidate Name', 'Department', 'Work Done Today (Summary)', 'Issues Held', 'Cash Collected', 'Incidents', 'Status', 'Time']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [198, 0, 3],
      fontSize: 8,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59]
    },
    didParseCell: function(data: any) {
      if (data.column.index === 8 && data.cell.section === 'body') {
        if (data.cell.raw === 'On Time') {
          data.cell.styles.textColor = [22, 101, 52];
          data.cell.styles.fontStyle = 'bold';
        } else if (data.cell.raw === 'Late') {
          data.cell.styles.textColor = [194, 65, 12];
          data.cell.styles.fontStyle = 'bold';
        } else {
          data.cell.styles.textColor = [220, 38, 38];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    }
  });

  doc.save(`CUCOM_Master_Log_${date}.pdf`);
}

// 5. Export Employee Analytics Dossier to Excel
export function exportEmployeeAnalyticsToExcel(analytics: import('../types/cucom').EmployeeAnalytics) {
  const wb = XLSX.utils.book_new();

  // Overview Sheet
  const overviewRows: any[] = [
    ['CUCOM EMPLOYEE PERFORMANCE ANALYTICS DOSSIER'],
    [`Generated: ${new Date().toLocaleString()}`],
    [],
    ['EMPLOYEE INFORMATION'],
    ['Staff Name', analytics.staff.name],
    ['Department', analytics.staff.department],
    ['Designation', analytics.staff.designation],
    ['Email', analytics.staff.email],
    ['Performance Rating', analytics.performanceRating],
    [],
    ['COMPLIANCE & WORK PRODUCTIVITY SUMMARY'],
    ['Days Tracked in Period', analytics.totalDaysTracked],
    ['Total Reports Submitted', analytics.submittedReportsCount],
    ['Submitted On Time', analytics.onTimeSubmissions],
    ['Submitted Late', analytics.lateSubmissions],
    ['Submission Compliance Rate', `${analytics.submissionRate}%`],
    ['On-Time Reliability Rate', `${analytics.onTimeRate}%`],
    ['Total Task Entries Logged', analytics.totalTasksLogged],
    ['Tasks Completed (Done)', analytics.completedTasks],
    ['Tasks In Progress', analytics.inProgressTasks],
    ['Task Completion Rate', `${analytics.taskCompletionRate}%`],
    ['Operational Blockers Reported', analytics.blockersReportedCount],
    ['Management Support Requests', analytics.supportRequestsCount],
    [],
    ['KPI PERFORMANCE BREAKDOWN'],
    ['KPI / Core Responsibility', 'Total Logged', 'Completed', 'In Progress', 'Completion Rate', 'Latest Output', 'Status']
  ];

  analytics.kpiProgressList.forEach(k => {
    overviewRows.push([
      k.kpi,
      k.totalLogged,
      k.completedCount,
      k.inProgressCount,
      `${k.completionRate}%`,
      k.latestValue || '-',
      k.status
    ]);
  });

  const wsOverview = XLSX.utils.aoa_to_sheet(overviewRows);
  wsOverview['!cols'] = [
    { wch: 35 },
    { wch: 25 },
    { wch: 15 },
    { wch: 15 },
    { wch: 18 },
    { wch: 25 },
    { wch: 18 }
  ];
  XLSX.utils.book_append_sheet(wb, wsOverview, 'Employee Dossier');

  // Submissions History Sheet
  const historyRows: any[] = [
    ['SUBMISSION TIMELINE & DAILY ENTRIES'],
    [],
    ['Date', 'Time', 'Compliance', 'Status', 'Tasks Done', 'Work Done Summary', 'Issues Held', 'Cash Collected', 'Dean Review']
  ];

  analytics.submissionsHistory.forEach(rep => {
    const doneCount = rep.tasks.filter(t => t.status === 'Done').length;
    historyRows.push([
      rep.date,
      rep.submissionTime || '-',
      rep.complianceStatus,
      rep.overallStatus,
      `${doneCount} / ${rep.tasks.length}`,
      rep.workDoneSummary || rep.keyAchievementsSummary || '-',
      rep.issuesHeld || rep.challengeBlocker || 'No issues held',
      rep.cashCollected || '$0.00 / N/A',
      rep.managerReview || '-'
    ]);
  });

  const wsHistory = XLSX.utils.aoa_to_sheet(historyRows);
  wsHistory['!cols'] = [
    { wch: 12 },
    { wch: 14 },
    { wch: 22 },
    { wch: 14 },
    { wch: 14 },
    { wch: 40 },
    { wch: 35 },
    { wch: 25 },
    { wch: 35 }
  ];
  XLSX.utils.book_append_sheet(wb, wsHistory, 'Submissions History');

  const safeName = analytics.staff.name.replace(/[^a-zA-Z0-9]/g, '_');
  XLSX.writeFile(wb, `CUCOM_Employee_Analytics_${safeName}.xlsx`);
}

// 6. Export Work & Department Analytics to Excel
export function exportWorkAnalyticsToExcel(workAnalytics: import('../types/cucom').WorkAnalytics, rangeLabel: string) {
  const wb = XLSX.utils.book_new();

  // Institutional Summary Sheet
  const summaryRows: any[] = [
    ['CUCOM INSTITUTIONAL WORK & PRODUCTIVITY ANALYTICS'],
    [`Time Period: ${rangeLabel}`],
    [`Generated: ${new Date().toLocaleString()}`],
    [],
    ['GLOBAL PRODUCTIVITY METRICS'],
    ['Total Reports Expected', workAnalytics.totalReportsExpected],
    ['Total Reports Submitted', workAnalytics.totalReportsSubmitted],
    ['Overall Submission Compliance Rate', `${workAnalytics.overallComplianceRate}%`],
    ['Total Tasks Logged', workAnalytics.totalTasksLogged],
    ['Tasks Completed (Done)', workAnalytics.tasksCompleted],
    ['Tasks In Progress', workAnalytics.tasksInProgress],
    ['Tasks Pending', workAnalytics.tasksPending],
    ['Institutional Task Completion Rate', `${workAnalytics.overallTaskCompletionRate}%`],
    [],
    ['25-CANDIDATE / DEPARTMENT PRODUCTIVITY MATRIX'],
    [
      'Department / Academic Unit',
      'Staff Count',
      'Reports Expected',
      'Reports Submitted',
      'Compliance %',
      'Tasks Logged',
      'Tasks Done',
      'Completion %',
      'Blockers Reported',
      'Support Requests',
      'Operational Status'
    ]
  ];

  workAnalytics.departmentSummaries.forEach(d => {
    summaryRows.push([
      d.department,
      d.staffCount,
      d.reportsExpected,
      d.reportsSubmitted,
      `${d.complianceRate}%`,
      d.tasksLogged,
      d.tasksCompleted,
      `${d.completionRate}%`,
      d.blockersCount,
      d.supportNeededCount,
      d.status
    ]);
  });

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
  wsSummary['!cols'] = [
    { wch: 35 },
    { wch: 12 },
    { wch: 16 },
    { wch: 18 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 18 },
    { wch: 18 },
    { wch: 15 }
  ];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Work Analytics Matrix');

  // Support Queue Sheet
  const supportRows: any[] = [
    ['EXECUTIVE DEAN / MANAGEMENT SUPPORT QUEUE'],
    [],
    ['Date', 'Staff Name', 'Department', 'Priority', 'Support Details', 'Review Status']
  ];

  workAnalytics.managementSupportQueue.forEach(item => {
    supportRows.push([
      item.date,
      item.staffName,
      item.department,
      item.priority,
      item.details,
      item.managerReview ? `Reviewed: ${item.managerReview}` : 'Pending Dean Action'
    ]);
  });

  const wsSupport = XLSX.utils.aoa_to_sheet(supportRows);
  wsSupport['!cols'] = [
    { wch: 12 },
    { wch: 25 },
    { wch: 30 },
    { wch: 12 },
    { wch: 50 },
    { wch: 40 }
  ];
  XLSX.utils.book_append_sheet(wb, wsSupport, 'Dean Support Queue');

  // Operational Blockers Sheet
  const blockerRows: any[] = [
    ['OPERATIONAL BLOCKERS & RISK RADAR'],
    [],
    ['Date', 'Staff Name', 'Department', 'Blocker / Challenge Description', 'Status']
  ];

  workAnalytics.activeBlockers.forEach(b => {
    blockerRows.push([
      b.date,
      b.staffName,
      b.department,
      b.blocker,
      b.resolved ? 'Addressed by Dean' : 'Unresolved / Active'
    ]);
  });

  const wsBlockers = XLSX.utils.aoa_to_sheet(blockerRows);
  wsBlockers['!cols'] = [
    { wch: 12 },
    { wch: 25 },
    { wch: 30 },
    { wch: 60 },
    { wch: 20 }
  ];
  XLSX.utils.book_append_sheet(wb, wsBlockers, 'Blockers & Risk Radar');

  XLSX.writeFile(wb, `CUCOM_Work_Analytics_${new Date().toISOString().slice(0, 10)}.xlsx`);
}
