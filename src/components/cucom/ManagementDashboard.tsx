import React, { useState } from 'react';
import { useCUCOM } from '../../context/CUCOMContext';
import { StaffMember, DailyReport, ComplianceStatus } from '../../types/cucom';
import { exportDashboardToExcel, exportReportToPDF } from '../../utils/cucomExport';
import { 
  Users, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  FileSpreadsheet, 
  Download, 
  Search, 
  Filter, 
  Eye, 
  MessageSquare, 
  Calendar, 
  CheckCheck, 
  ChevronRight, 
  TrendingUp, 
  Award, 
  AlertOctagon, 
  X, 
  Send,
  Sparkles,
  Mail,
  FileText,
  DollarSign,
  ShieldAlert,
  ListChecks
} from 'lucide-react';

export const ManagementDashboard: React.FC = () => {
  const { 
    staffList, 
    filteredStaffList, 
    reports, 
    selectedDate, 
    setSelectedDate, 
    deadlineFormatted, 
    staffScope, 
    setStaffScope, 
    getMetricsForDate, 
    reviewReport, 
    setCurrentStaff, 
    setActiveView,
    setSelectedAnalyticsStaffId 
  } = useCUCOM();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('ALL');
  const [activeTabFilter, setActiveTabFilter] = useState<'ALL' | 'ON_TIME' | 'LATE' | 'PENDING' | 'HELP'>('ALL');
  const [activeReportDrawer, setActiveReportDrawer] = useState<DailyReport | null>(null);
  const [managerReviewInput, setManagerReviewInput] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const metrics = getMetricsForDate(selectedDate);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Map of staffId -> DailyReport for the selected date
  const reportsByStaff = new Map<string, DailyReport>();
  reports.filter(r => r.date === selectedDate).forEach(r => {
    reportsByStaff.set(r.staffId, r);
  });

  // Extract unique departments for filter dropdown
  const departments = ['ALL', ...Array.from(new Set(filteredStaffList.map(s => s.department)))];

  // Filter staff rows based on Search, Dept, and Active Tab
  const filteredStaff = filteredStaffList.filter(staff => {
    const report = reportsByStaff.get(staff.id);
    const submissionStatus: ComplianceStatus = report ? report.complianceStatus : 'NOT SUBMITTED';
    const hasHelpNeeded = Boolean(report?.supportNeeded);

    const matchesSearch = 
      staff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staff.designation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staff.department.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDept = selectedDeptFilter === 'ALL' || staff.department === selectedDeptFilter;

    let matchesTab = true;
    if (activeTabFilter === 'ON_TIME') matchesTab = submissionStatus === 'SUBMITTED ON TIME';
    else if (activeTabFilter === 'LATE') matchesTab = submissionStatus === 'LATE';
    else if (activeTabFilter === 'PENDING') matchesTab = submissionStatus === 'NOT SUBMITTED';
    else if (activeTabFilter === 'HELP') matchesTab = hasHelpNeeded;

    return matchesSearch && matchesDept && matchesTab;
  });

  const handleOpenDrawer = (staff: StaffMember) => {
    const report = reportsByStaff.get(staff.id);
    if (report) {
      setActiveReportDrawer(report);
      setManagerReviewInput(report.managerReview || '');
    } else {
      if (window.confirm(`No report submitted yet for ${staff.name}. Open submission form as ${staff.name}?`)) {
        setCurrentStaff(staff);
        setActiveView('REPORT');
      }
    }
  };

  const handleSaveManagerReview = () => {
    if (!activeReportDrawer) return;
    reviewReport(activeReportDrawer.id, managerReviewInput, 'Dean / Management Office');
    setActiveReportDrawer(prev => prev ? { ...prev, managerReview: managerReviewInput } : null);
    showToast('Manager review remarks successfully recorded.');
  };

  const sendEmailReminder = (staff: StaffMember) => {
    const subject = `URGENT REMINDER: Daily Work Report Pending for ${selectedDate} - CUCOM`;
    const body = `Dear ${staff.name},

This is an official compliance notification from the Executive Leadership Office of Commonwealth University College of Medicine (CUCOM).

Our records indicate that your Daily Work Report for today (${selectedDate}) has NOT been submitted. The institutional daily deadline is ${deadlineFormatted}.

Please log in to the CUCOM Daily Reporting Portal immediately and submit your report:
Portal: http://localhost:3000/

If you are experiencing any technical issues or need assistance, please contact the IT Administration office promptly.

Sincerely,
Office of the Executive Dean & Vice Chancellor
Commonwealth University College of Medicine (CUCOM)`;

    const mailtoUrl = `mailto:${encodeURIComponent(staff.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoUrl, '_blank');
    showToast(`Reminder email draft opened for ${staff.name} (${staff.email})`);
  };

  const sendEmailToAllPending = () => {
    const pendingStaff = filteredStaffList.filter(s => !reportsByStaff.has(s.id));
    if (pendingStaff.length === 0) {
      showToast('All staff in the selected scope have submitted their reports for today!');
      return;
    }
    const emails = pendingStaff.map(s => s.email).join(',');
    const subject = `URGENT COMPLIANCE NOTICE: Daily Work Report Due Today (${selectedDate}) - CUCOM`;
    const body = `Dear Department Managers and Faculty,

This is an official compliance notification from the Executive Dean's Office of Caribbean University College of Medicine (CUCOM).

According to institutional compliance records for ${selectedDate}, your department's Daily Work Report is currently PENDING submission. Daily reports must be logged by ${deadlineFormatted}.

Please sign in to the portal and submit your report as soon as possible:
Portal: http://localhost:3000/

Thank you for your prompt compliance.

Sincerely,
Office of the Executive Dean & Vice Chancellor
Caribbean University College of Medicine (CUCOM)`;

    const mailtoUrl = `mailto:${encodeURIComponent(emails)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoUrl, '_blank');
    showToast(`Dispatched reminder email to ${pendingStaff.length} pending staff members!`);
  };

  return (
    <div className="space-y-6 pb-16 font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-700 text-xs font-bold animate-in slide-in-from-top-4">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ================= 1. EXECUTIVE ACTION & SCOPE BAR ================= */}
      <div className="bg-white dark:bg-[#111827] rounded-3xl p-5 sm:p-6 shadow-xs border border-slate-200/90 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Executive Roster Overview
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5">
            {metrics.submittedOnTime + metrics.late} of {metrics.totalRequired} Reports Submitted
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Tracking daily compliance for <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedDate}</span> • Due daily by <span className="font-semibold text-red-700 dark:text-red-400">{deadlineFormatted}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Scope Selector: Core Managers vs All Staff */}
          <div className="flex items-center rounded-2xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700 text-xs font-bold">
            <button
              type="button"
              onClick={() => setStaffScope('CORE_18')}
              className={`px-3.5 py-1.5 rounded-xl transition cursor-pointer ${
                staffScope === 'CORE_18' 
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-black' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Core Managers (14)
            </button>
            <button
              type="button"
              onClick={() => setStaffScope('ALL_35')}
              className={`px-3.5 py-1.5 rounded-xl transition cursor-pointer ${
                staffScope === 'ALL_35' 
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-black' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All Staff (35)
            </button>
          </div>

          {/* Email All Pending Button */}
          {metrics.notSubmitted > 0 && (
            <button
              type="button"
              onClick={sendEmailToAllPending}
              className="px-4 py-2 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition cursor-pointer active:scale-98"
              title="Send urgent email reminder to all pending staff"
            >
              <Mail className="w-4 h-4" />
              <span>Email All Pending ({metrics.notSubmitted})</span>
            </button>
          )}

          {/* Export Excel Button */}
          <button
            type="button"
            onClick={() => exportDashboardToExcel(selectedDate, filteredStaffList, reports, metrics)}
            className="px-4 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition cursor-pointer active:scale-98"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* ================= 2. FOUR HIGH-IMPACT EXECUTIVE KPI CARDS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Overall Compliance Rate */}
        <div className="bg-white dark:bg-[#111827] rounded-3xl p-5 shadow-xs border border-slate-200/90 dark:border-slate-800 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Compliance Rate
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 text-[11px] font-bold border border-red-200 dark:border-red-900">
              Target: 100%
            </span>
          </div>

          <div>
            <div className="text-3xl font-black text-slate-900 dark:text-white">
              {metrics.complianceRate.toFixed(1)}%
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {metrics.submittedOnTime + metrics.late} of {metrics.totalRequired} submitted
            </div>
          </div>

          {/* Clean Progress Meter */}
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div 
              style={{ width: `${metrics.complianceRate}%` }}
              className="bg-gradient-to-r from-red-600 via-rose-500 to-red-700 h-full rounded-full transition-all duration-500"
            />
          </div>
        </div>

        {/* KPI 2: On-Time Submissions */}
        <div className="bg-white dark:bg-[#111827] rounded-3xl p-5 shadow-xs border border-slate-200/90 dark:border-slate-800 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              On Time
            </span>
            <div className="p-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>

          <div>
            <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
              {metrics.submittedOnTime}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Received before {deadlineFormatted}
            </div>
          </div>

          <div className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-400">
            {metrics.totalRequired > 0 ? ((metrics.submittedOnTime / metrics.totalRequired) * 100).toFixed(0) : 0}% of roster on schedule
          </div>
        </div>

        {/* KPI 3: Late Submissions */}
        <div className="bg-white dark:bg-[#111827] rounded-3xl p-5 shadow-xs border border-slate-200/90 dark:border-slate-800 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Late Submissions
            </span>
            <div className="p-1.5 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>

          <div>
            <div className="text-3xl font-black text-amber-600 dark:text-amber-400">
              {metrics.late}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Filed after {deadlineFormatted}
            </div>
          </div>

          <div className="text-[11px] font-semibold text-amber-700 dark:text-amber-400">
            {metrics.late > 0 ? 'Requires acknowledgment' : 'Zero late submissions'}
          </div>
        </div>

        {/* KPI 4: Pending Reports */}
        <div className="bg-white dark:bg-[#111827] rounded-3xl p-5 shadow-xs border border-slate-200/90 dark:border-slate-800 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Pending Reports
            </span>
            <div className="p-1.5 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>

          <div>
            <div className="text-3xl font-black text-rose-600 dark:text-rose-400">
              {metrics.notSubmitted}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Reports not yet received
            </div>
          </div>

          <div className="text-[11px] font-semibold text-rose-700 dark:text-rose-400">
            {metrics.notSubmitted > 0 ? 'Follow-up required' : 'All reports completed'}
          </div>
        </div>
      </div>

      {/* ================= 3. INSTANT FILTER TABS & SEARCH TOOLBAR ================= */}
      <div className="bg-white dark:bg-[#111827] rounded-3xl p-4 sm:p-5 shadow-xs border border-slate-200/90 dark:border-slate-800 space-y-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          
          {/* 1-Click Interactive Status Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTabFilter('ALL')}
              className={`px-3.5 py-1.5 rounded-2xl text-xs font-bold transition cursor-pointer ${
                activeTabFilter === 'ALL'
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              All Staff ({metrics.totalRequired})
            </button>

            <button
              type="button"
              onClick={() => setActiveTabFilter('ON_TIME')}
              className={`px-3.5 py-1.5 rounded-2xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeTabFilter === 'ON_TIME'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>On Time ({metrics.submittedOnTime})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTabFilter('LATE')}
              className={`px-3.5 py-1.5 rounded-2xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeTabFilter === 'LATE'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 hover:bg-amber-100 border border-amber-200 dark:border-amber-800'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Late ({metrics.late})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTabFilter('PENDING')}
              className={`px-3.5 py-1.5 rounded-2xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeTabFilter === 'PENDING'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 hover:bg-rose-100 border border-rose-200 dark:border-rose-800'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>Pending ({metrics.notSubmitted})</span>
            </button>
          </div>

          {/* Search Box & Department Filter */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative min-w-[220px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search name, title, department..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none shadow-2xs"
              />
            </div>

            <select
              value={selectedDeptFilter}
              onChange={e => setSelectedDeptFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer shadow-2xs"
            >
              {departments.map(dept => (
                <option key={dept} value={dept}>
                  {dept === 'ALL' ? 'All Departments' : dept}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ================= 4. STREAMLINED, HIGH-LEGIBILITY ROSTER TABLE ================= */}
      <div className="bg-white dark:bg-[#111827] rounded-3xl shadow-xs border border-slate-200/90 dark:border-slate-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-900/60">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
            <Users className="w-4 h-4 text-red-600 dark:text-red-400" />
            <span>Staff Submission Status Roster ({filteredStaff.length} Listed)</span>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Click <strong className="text-red-700 dark:text-red-400">Review Report</strong> to audit details or provide executive remarks
          </span>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-bold uppercase text-[11px] border-b border-slate-200 dark:border-slate-800 tracking-wider">
                <th className="py-3.5 px-6">Staff Member & Department</th>
                <th className="py-3.5 px-4 text-center">Work Status</th>
                <th className="py-3.5 px-4 text-center">Submission Status</th>
                <th className="py-3.5 px-4 text-center">Time</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
              {filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500 text-xs">
                    <div className="space-y-3">
                      <p className="font-semibold text-slate-700 dark:text-slate-300">
                        {filteredStaffList.length === 0 ? 'No staff accounts created yet.' : 'No staff records match your current filter criteria.'}
                      </p>
                      {filteredStaffList.length === 0 && (
                        <button
                          type="button"
                          onClick={() => setActiveView('USERS')}
                          className="px-4 py-2 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
                        >
                          + Create Staff Account in Staff &amp; User Authority
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredStaff.map((staff) => {
                  const report = reportsByStaff.get(staff.id);
                  const complianceStatus: ComplianceStatus = report ? report.complianceStatus : 'NOT SUBMITTED';
                  const taskCount = report ? report.tasks.filter(t => t.description.trim() !== '').length : 0;
                  const workStatus = report ? report.overallStatus : 'Pending';

                  return (
                    <tr 
                      key={staff.id} 
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition duration-150 ${
                        complianceStatus === 'NOT SUBMITTED' ? 'bg-rose-50/20 dark:bg-rose-950/5' : ''
                      }`}
                    >
                      {/* Column 1: Avatar, Name, Designation & Department */}
                      <td className="py-3.5 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-red-600 via-rose-600 to-red-700 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                            {staff.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="font-bold text-slate-900 dark:text-white text-sm">
                                {staff.name}
                              </span>
                              {report?.issuesHeld && !report.issuesHeld.toLowerCase().includes('none') && report.issuesHeld !== 'No issues held' && (
                                <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[10px] font-extrabold border border-amber-300 dark:border-amber-800 flex items-center gap-1" title={report.issuesHeld}>
                                  <AlertTriangle className="w-2.5 h-2.5" />
                                  <span>Issues Held</span>
                                </span>
                              )}
                              {report?.hasUnusualActivities && (
                                <span className="px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 text-[10px] font-extrabold border border-rose-300 dark:border-rose-800 flex items-center gap-1 animate-pulse" title={report.unusualActivitiesDetails}>
                                  <ShieldAlert className="w-2.5 h-2.5" />
                                  <span>Incident</span>
                                </span>
                              )}
                              {report?.cashCollected && report.cashCollected !== '$0.00 (No cash handling role)' && report.cashCollected !== '$0.00' && report.cashCollected !== '$0' && report.cashCollected !== '0' && (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold font-mono border border-emerald-300 dark:border-emerald-800 flex items-center gap-0.5">
                                  <DollarSign className="w-2.5 h-2.5" />
                                  <span>{report.cashCollected}</span>
                                </span>
                              )}
                              {report?.supportNeeded && (
                                <span className="px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 text-[10px] font-extrabold border border-teal-200 dark:border-teal-800">
                                  Support Req
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                              <span className="font-semibold text-slate-700 dark:text-slate-300">{staff.department}</span>
                              <span className="mx-1 text-slate-300 dark:text-slate-600">•</span>
                              <span>{staff.designation}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Column 2: Work Status & KPI Count */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            workStatus === 'Done'
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                              : workStatus === 'In Progress'
                              ? 'bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                          }`}>
                            {workStatus}
                          </span>
                          <span className="text-[10px] text-slate-400 font-semibold mt-0.5">
                            {report ? 'Report Filed' : 'Awaiting Submission'}
                          </span>
                        </div>
                      </td>

                      {/* Column 3: Submission Status */}
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-block px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wide border ${
                          complianceStatus === 'SUBMITTED ON TIME'
                            ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                            : complianceStatus === 'LATE'
                            ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                            : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                        }`}>
                          {complianceStatus === 'SUBMITTED ON TIME' ? 'On Time' : complianceStatus === 'LATE' ? 'Late' : 'Not Submitted'}
                        </span>
                      </td>

                      {/* Column 4: Submission Time */}
                      <td className="py-3.5 px-4 text-center text-xs font-mono text-slate-600 dark:text-slate-400">
                        {report?.submissionTime || '—'}
                      </td>

                      {/* Column 5: Clear Actions */}
                      <td className="py-3.5 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!report && (
                            <button
                              type="button"
                              onClick={() => sendEmailReminder(staff)}
                              title={`Send email reminder to ${staff.name}`}
                              className="px-3 py-1.5 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-2xs bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800"
                            >
                              <Mail className="w-3.5 h-3.5" />
                              <span>Email Reminder</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleOpenDrawer(staff)}
                            className={`px-3.5 py-1.5 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-2xs ${
                              report
                                ? 'bg-red-600 hover:bg-red-700 text-white shadow-xs'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                            }`}
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>{report ? 'Review Report' : 'Open'}</span>
                          </button>

                          {report && (
                            <button
                              type="button"
                              onClick={() => exportReportToPDF(report)}
                              title="Download PDF Copy"
                              className="p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition cursor-pointer"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* REPORT SLIDE-OVER REVIEW DRAWER */}
      {activeReportDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs animate-in fade-in duration-200 font-sans">
          <div className="w-full max-w-3xl bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 overflow-hidden text-slate-900 dark:text-slate-100">
            {/* Drawer Header with Gradient */}
            <div className="bg-white dark:bg-slate-900 p-6 flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 border-t-4 border-t-red-600">
              <div>
                <div className="text-xs text-red-700 dark:text-red-400 font-extrabold uppercase tracking-wider">
                  REPORT REVIEW & EXECUTIVE MANAGEMENT AUDIT
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                  {activeReportDrawer.staffName} — {activeReportDrawer.department}
                </h3>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {activeReportDrawer.designation} • Date: <strong className="text-slate-800 dark:text-slate-200 font-bold">{activeReportDrawer.date}</strong> • Submitted: <strong className="text-slate-800 dark:text-slate-200 font-bold">{activeReportDrawer.submissionTime || 'Pending'}</strong>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveReportDrawer(null)}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
              {/* Submission Status Pill */}
              <div className="p-4 rounded-2xl border flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold ${
                    activeReportDrawer.complianceStatus === 'SUBMITTED ON TIME'
                      ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                      : activeReportDrawer.complianceStatus === 'LATE'
                      ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                      : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
                  }`}>
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-extrabold text-sm text-slate-900 dark:text-white uppercase">
                      {activeReportDrawer.complianceStatus}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Overall Work Status: <strong className="text-slate-800 dark:text-slate-200">{activeReportDrawer.overallStatus}</strong> • Priority: <strong className="text-slate-800 dark:text-slate-200">{activeReportDrawer.priority}</strong>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedAnalyticsStaffId(activeReportDrawer.staffId);
                      setActiveReportDrawer(null);
                      setActiveView('ANALYTICS');
                    }}
                    className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                  >
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>View Analytics Dossier</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => exportReportToPDF(activeReportDrawer)}
                    className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Download PDF</span>
                  </button>
                </div>
              </div>

              {/* 1. What Work Did You Do Today? */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-1.5 shadow-2xs">
                <div className="font-extrabold text-[11px] text-slate-900 dark:text-white uppercase flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                  <span>1. What Work Did You Do Today? (Primary Work Summary)</span>
                </div>
                <p className="text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {activeReportDrawer.workDoneSummary || activeReportDrawer.keyAchievementsSummary || 'Operational tasks executed per schedule.'}
                </p>
              </div>

              {/* 2. Activities Performed Today */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-1.5 shadow-2xs">
                <div className="font-extrabold text-[11px] text-slate-900 dark:text-white uppercase flex items-center gap-1.5">
                  <ListChecks className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                  <span>2. What Activities Have Been Performed Today?</span>
                </div>
                <p className="text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {activeReportDrawer.activitiesPerformed || 'No specific activities recorded.'}
                </p>
              </div>

              {/* 3. Issues Held */}
              <div className={`p-4 rounded-2xl border space-y-1.5 ${
                activeReportDrawer.issuesHeld && !activeReportDrawer.issuesHeld.toLowerCase().includes('none') && activeReportDrawer.issuesHeld !== 'No issues held'
                  ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-300 dark:border-amber-900/60'
                  : 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50'
              }`}>
                <div className="font-extrabold text-[11px] uppercase flex items-center gap-1.5">
                  <AlertTriangle className={`w-3.5 h-3.5 ${
                    activeReportDrawer.issuesHeld && !activeReportDrawer.issuesHeld.toLowerCase().includes('none') && activeReportDrawer.issuesHeld !== 'No issues held'
                      ? 'text-amber-600'
                      : 'text-emerald-600'
                  }`} />
                  <span className={
                    activeReportDrawer.issuesHeld && !activeReportDrawer.issuesHeld.toLowerCase().includes('none') && activeReportDrawer.issuesHeld !== 'No issues held'
                      ? 'text-amber-950 dark:text-amber-300'
                      : 'text-emerald-950 dark:text-emerald-300'
                  }>
                    3. Were There Any Issues or Problems Held Today?
                  </span>
                </div>
                <p className="text-slate-800 dark:text-slate-200 leading-relaxed text-xs">
                  {activeReportDrawer.issuesHeld || activeReportDrawer.challengeBlocker || 'No issues held - operations ran smoothly.'}
                </p>
              </div>

              {/* 4. Cash / Revenue Generated & Collected */}
              <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/60 space-y-2">
                <div className="font-extrabold text-[11px] text-emerald-950 dark:text-emerald-300 uppercase flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                    <span>4. Cash / Revenue Generated &amp; Collected Today</span>
                  </div>
                  <span className="font-mono font-black text-sm text-emerald-800 dark:text-emerald-300">
                    {activeReportDrawer.cashCollected || '$0.00 / N/A'}
                  </span>
                </div>
                {activeReportDrawer.supportDetails && (
                  <p className="text-slate-700 dark:text-slate-300 text-xs">
                    <strong className="text-slate-900 dark:text-white">Receipt Breakdown: </strong>
                    {activeReportDrawer.supportDetails.startsWith('Cash Source:') 
                      ? activeReportDrawer.supportDetails.replace('Cash Source: ', '') 
                      : activeReportDrawer.supportDetails}
                  </p>
                )}
              </div>

              {/* 5. Unusual, Extra or Unwanted Activities */}
              <div className={`p-4 rounded-2xl border space-y-1.5 ${
                activeReportDrawer.hasUnusualActivities 
                  ? 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-300 dark:border-rose-900/70' 
                  : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
              }`}>
                <div className="font-extrabold text-[11px] uppercase flex items-center gap-1.5">
                  <ShieldAlert className={`w-3.5 h-3.5 ${activeReportDrawer.hasUnusualActivities ? 'text-rose-600' : 'text-slate-500'}`} />
                  <span className={activeReportDrawer.hasUnusualActivities ? 'text-rose-950 dark:text-rose-300' : 'text-slate-800 dark:text-slate-200'}>
                    5. Unusual, Extra or Unwanted Activities / Incidents: {activeReportDrawer.hasUnusualActivities ? `[FLAGGED: ${activeReportDrawer.unusualActivityType || 'Incident'}]` : '[Normal Operations - None]'}
                  </span>
                </div>
                <p className={`text-xs leading-relaxed ${activeReportDrawer.hasUnusualActivities ? 'text-rose-950 dark:text-rose-200 font-medium' : 'text-slate-600 dark:text-slate-400'}`}>
                  {activeReportDrawer.hasUnusualActivities 
                    ? (activeReportDrawer.unusualActivitiesDetails || 'Unusual incident reported without description.') 
                    : 'Zero unusual, unwanted, or emergency activities reported for this shift.'}
                </p>
              </div>

              {/* 6. Priority for Tomorrow */}
              {activeReportDrawer.priorityTomorrow && (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
                  <div className="font-bold text-slate-900 dark:text-white uppercase text-[11px]">
                    6. Priority Task for Tomorrow:
                  </div>
                  <p className="text-slate-800 dark:text-slate-200 leading-relaxed">{activeReportDrawer.priorityTomorrow}</p>
                </div>
              )}

              {/* Manager Review Input Block */}
              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/60 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 dark:text-slate-200 uppercase text-xs flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-red-600 dark:text-red-400" />
                    <span>Official Dean / Executive Review & Guidance</span>
                  </label>
                  {activeReportDrawer.reviewedAt && (
                    <span className="text-[10px] text-slate-400">
                      Reviewed on {new Date(activeReportDrawer.reviewedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>

                <textarea
                  rows={3}
                  value={managerReviewInput}
                  onChange={e => setManagerReviewInput(e.target.value)}
                  placeholder="Enter feedback, acknowledgment, instructions or approvals for this staff member..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:outline-none leading-relaxed shadow-2xs"
                />

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleSaveManagerReview}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-700 hover:to-rose-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-red-600/30 transition cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Save Executive Review</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
