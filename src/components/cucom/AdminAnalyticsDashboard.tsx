import React, { useState, useMemo } from 'react';
import { useCUCOM } from '../../context/CUCOMContext';
import { AnalyticsDateRange, StaffMember, DailyReport } from '../../types/cucom';
import { calculateEmployeeAnalytics, calculateWorkAnalytics } from '../../services/cucomAnalytics';
import { exportEmployeeAnalyticsToExcel, exportWorkAnalyticsToExcel, exportReportToPDF } from '../../utils/cucomExport';
import { 
  Users, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  FileSpreadsheet, 
  Search, 
  Filter, 
  Award, 
  AlertOctagon, 
  ChevronRight, 
  Building2, 
  Calendar, 
  CheckCheck, 
  HelpCircle, 
  ShieldCheck, 
  Layers, 
  BarChart3, 
  ArrowUpRight, 
  FileText,
  Download,
  Activity,
  UserCheck,
  ChevronDown,
  Sparkles
} from 'lucide-react';

export const AdminAnalyticsDashboard: React.FC = () => {
  const { 
    staffList, 
    filteredStaffList, 
    reports, 
    selectedDate, 
    selectedAnalyticsStaffId, 
    setSelectedAnalyticsStaffId,
    setActiveView,
    reviewReport
  } = useCUCOM();

  // Navigation Sub-tab: Employee vs Work
  const [activeTab, setActiveTab] = useState<'EMPLOYEE' | 'WORK'>('EMPLOYEE');
  
  // Date Range filter
  const [dateRange, setDateRange] = useState<AnalyticsDateRange>('14D');
  
  // Search & Filter within Employee Directory
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('ALL');
  const [sortField, setSortField] = useState<'name' | 'submissionRate' | 'onTimeRate' | 'taskCompletionRate'>('taskCompletionRate');
  const [sortAsc, setSortAsc] = useState(false);

  // Quick feedback toast
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Compute work-level analytics for current range
  const workAnalytics = useMemo(() => {
    return calculateWorkAnalytics(reports, staffList, dateRange, selectedDate);
  }, [reports, staffList, dateRange, selectedDate]);

  // Selected employee analytics
  const selectedStaff = useMemo(() => {
    return staffList.find(s => s.id === selectedAnalyticsStaffId) || staffList[0];
  }, [staffList, selectedAnalyticsStaffId]);

  const employeeAnalytics = useMemo(() => {
    return calculateEmployeeAnalytics(selectedStaff.id, reports, staffList, dateRange, selectedDate);
  }, [selectedStaff.id, reports, staffList, dateRange, selectedDate]);

  // Directory of all 25 staff with their individual analytics
  const staffDirectoryAnalytics = useMemo(() => {
    return staffList.map(staff => {
      const a = calculateEmployeeAnalytics(staff.id, reports, staffList, dateRange, selectedDate);
      return {
        staff,
        analytics: a
      };
    });
  }, [staffList, reports, dateRange, selectedDate]);

  // Filtered and sorted directory
  const filteredStaffDirectory = useMemo(() => {
    return staffDirectoryAnalytics.filter(({ staff }) => {
      const matchesSearch = 
        staff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        staff.designation.toLowerCase().includes(searchTerm.toLowerCase()) ||
        staff.department.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDept = selectedDeptFilter === 'ALL' || staff.department === selectedDeptFilter;
      return matchesSearch && matchesDept;
    }).sort((a, b) => {
      let valA: number | string = 0;
      let valB: number | string = 0;

      if (sortField === 'name') {
        valA = a.staff.name;
        valB = b.staff.name;
        return sortAsc ? (valA as string).localeCompare(valB as string) : (valB as string).localeCompare(valA as string);
      } else if (sortField === 'submissionRate') {
        valA = a.analytics.submissionRate;
        valB = b.analytics.submissionRate;
      } else if (sortField === 'onTimeRate') {
        valA = a.analytics.onTimeRate;
        valB = b.analytics.onTimeRate;
      } else if (sortField === 'taskCompletionRate') {
        valA = a.analytics.taskCompletionRate;
        valB = b.analytics.taskCompletionRate;
      }

      return sortAsc ? (Number(valA) - Number(valB)) : (Number(valB) - Number(valA));
    });
  }, [staffDirectoryAnalytics, searchTerm, selectedDeptFilter, sortField, sortAsc]);

  const departments = ['ALL', ...Array.from(new Set(staffList.map(s => s.department)))];

  // Quick action to acknowledge support request in queue
  const handleAcknowledgeSupport = (reportId: string, staffName: string) => {
    reviewReport(reportId, 'Dean Office reviewed and scheduled for administrative follow-up.', 'Dean & Academic Leadership');
    showToast(`Support request for ${staffName} acknowledged by Dean Office.`);
  };

  return (
    <div className="space-y-6 pb-16 font-sans">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-700 text-xs font-bold animate-in slide-in-from-top-4">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Controls & Timeframe Selector */}
      <div className="bg-white dark:bg-[#111827] rounded-3xl shadow-xs border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 transition-colors duration-200">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-pulse" />
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Performance Analytics & Dossiers
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5">
              Institutional Work & Employee Performance
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Multi-day performance audit across 24 departments and 25 university personnel.
            </p>
          </div>

          {/* Global Range Selector & Export Actions */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Date Range Selector */}
            <div className="flex items-center rounded-2xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700 text-xs font-bold">
              {(['TODAY', '7D', '14D', '30D', 'ALL'] as AnalyticsDateRange[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setDateRange(r)}
                  className={`px-3.5 py-1.5 rounded-xl transition cursor-pointer ${
                    dateRange === r
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-black'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {r === 'TODAY' ? 'Today' : r === '7D' ? '7 Days' : r === '14D' ? '14 Days' : r === '30D' ? '30 Days' : 'All-Time'}
                </button>
              ))}
            </div>

            {/* Excel Export Button based on active tab */}
            {activeTab === 'EMPLOYEE' ? (
              <button
                type="button"
                onClick={() => exportEmployeeAnalyticsToExcel(employeeAnalytics)}
                className="px-4 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition cursor-pointer active:scale-98"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Export Dossier (.xlsx)</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => exportWorkAnalyticsToExcel(workAnalytics, dateRange)}
                className="px-4 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition cursor-pointer active:scale-98"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Export Work Matrix (.xlsx)</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Switcher: Employee Analytics vs Work & Task Analytics */}
        <div className="flex items-center gap-2.5 mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('EMPLOYEE')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'EMPLOYEE'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Employee Dossiers (25 Candidates)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('WORK')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'WORK'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Work & Task Matrix (24 Depts)</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: EMPLOYEE ANALYTICS                                                 */}
      {/* ========================================================================= */}
      {activeTab === 'EMPLOYEE' && (
        <div className="space-y-6">
          {/* Top High-level KPI summary cards for employee health */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-4 transition">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Staff Tracked</div>
                <div className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{staffList.length} Members</div>
                <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold mt-0.5">Across 24 Departments</div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-emerald-300 dark:border-emerald-800 shadow-xs flex items-center gap-4 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent transition">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-white flex items-center justify-center font-bold shadow-xs">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">Avg On-Time Rate</div>
                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {Math.round(
                    staffDirectoryAnalytics.reduce((acc, curr) => acc + curr.analytics.onTimeRate, 0) /
                    Math.max(1, staffDirectoryAnalytics.length)
                  )}%
                </div>
                <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold mt-0.5">Before Daily Deadline</div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-sky-300 dark:border-sky-800 shadow-xs flex items-center gap-4 bg-gradient-to-br from-sky-500/10 via-cyan-500/5 to-transparent transition">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-cyan-500 text-white flex items-center justify-center font-bold shadow-xs">
                <CheckCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-sky-800 dark:text-sky-300 uppercase tracking-wider">Avg Task Completion</div>
                <div className="text-2xl font-black text-sky-600 dark:text-sky-400 mt-0.5">
                  {Math.round(
                    staffDirectoryAnalytics.reduce((acc, curr) => acc + curr.analytics.taskCompletionRate, 0) /
                    Math.max(1, staffDirectoryAnalytics.length)
                  )}%
                </div>
                <div className="text-[11px] text-sky-700 dark:text-sky-400 font-semibold mt-0.5">Tasks Completed (Done)</div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-amber-300 dark:border-amber-800 shadow-xs flex items-center gap-4 bg-gradient-to-br from-amber-500/10 via-yellow-500/5 to-transparent transition">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-500 text-white flex items-center justify-center font-bold shadow-xs">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider">Top Institutional Performer</div>
                <div className="text-base font-black text-slate-900 dark:text-white mt-0.5 truncate max-w-[170px]">
                  {workAnalytics.topPerformingStaff[0]?.staffName || 'Dr. Sharon Dowdy'}
                </div>
                <div className="text-[11px] text-amber-700 dark:text-amber-400 font-bold mt-0.5">
                  {workAnalytics.topPerformingStaff[0]?.onTimeRate || 95}% On-Time Reliability
                </div>
              </div>
            </div>
          </div>

          {/* Quick Staff Selector Bar */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4 transition-colors duration-200">
            <div className="flex items-center gap-3 w-full md:w-auto">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase shrink-0">Select Staff Dossier:</span>
              <div className="relative flex-1 md:w-80">
                <select
                  value={selectedStaff.id}
                  onChange={e => setSelectedAnalyticsStaffId(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-2xs"
                >
                  {staffList.map(s => (
                    <option key={s.id} value={s.id}>
                      #{s.sNo} {s.name} — {s.department}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400 w-full md:w-auto justify-end">
              <span className="text-slate-400">Viewing Timeframe:</span>
              <span className="px-3 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold">
                {workAnalytics.dateRangeLabel}
              </span>
            </div>
          </div>

          {/* Selected Employee Detailed Dossier Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xs border border-slate-200/80 dark:border-slate-800 overflow-hidden transition-colors duration-200">
            {/* Header / Info Strip with Gradient */}
            <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-6 sm:p-7 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-5 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-white/15 border-2 border-white/30 text-white font-black text-xl flex items-center justify-center shrink-0 shadow-md">
                  {selectedStaff.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl sm:text-2xl font-black">{selectedStaff.name}</h2>
                    <span className="text-xs font-mono bg-white/20 px-2.5 py-0.5 rounded-full text-white/90">
                      ID: {selectedStaff.id.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-sm text-emerald-100 font-medium mt-0.5">
                    {selectedStaff.designation} • <strong className="text-white font-bold">{selectedStaff.department}</strong>
                  </div>
                  <div className="text-xs text-emerald-200 mt-1">
                    Contact: {selectedStaff.email}
                  </div>
                </div>
              </div>

              {/* Performance Rating Badge & Form Link */}
              <div className="flex flex-col items-start md:items-end gap-2 shrink-0">
                <span className={`px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider border shadow-xs ${
                  employeeAnalytics.performanceRating === 'High Performer'
                    ? 'bg-white text-emerald-800 border-white'
                    : employeeAnalytics.performanceRating === 'On Track'
                    ? 'bg-white/90 text-sky-900 border-white/90'
                    : 'bg-rose-100 text-rose-900 border-rose-200'
                }`}>
                  ★ {employeeAnalytics.performanceRating}
                </span>

                <button
                  type="button"
                  onClick={() => {
                    setActiveView('REPORT');
                  }}
                  className="text-xs font-bold text-white hover:text-emerald-100 underline underline-offset-2 flex items-center gap-1 cursor-pointer"
                >
                  Open Report Form View →
                </button>
              </div>
            </div>

            {/* 4 Core Quantitative Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-slate-100 dark:divide-slate-800 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/40">
              <div className="p-5 text-center">
                <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Submission Compliance</div>
                <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
                  {employeeAnalytics.submissionRate}%
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                  {employeeAnalytics.submittedReportsCount} / {employeeAnalytics.totalDaysTracked} Days Submitted
                </div>
              </div>

              <div className="p-5 text-center">
                <div className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase">On-Time Reliability</div>
                <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                  {employeeAnalytics.onTimeRate}%
                </div>
                <div className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5 font-medium">
                  {employeeAnalytics.onTimeSubmissions} On Time • {employeeAnalytics.lateSubmissions} Late
                </div>
              </div>

              <div className="p-5 text-center">
                <div className="text-xs font-bold text-sky-800 dark:text-sky-300 uppercase">Task Completion Rate</div>
                <div className="text-2xl sm:text-3xl font-black text-sky-600 dark:text-sky-400 mt-1">
                  {employeeAnalytics.taskCompletionRate}%
                </div>
                <div className="text-[11px] text-sky-700 dark:text-sky-400 mt-0.5 font-medium">
                  {employeeAnalytics.completedTasks} Done of {employeeAnalytics.totalTasksLogged} Tasks
                </div>
              </div>

              <div className="p-5 text-center">
                <div className="text-xs font-bold text-rose-800 dark:text-rose-300 uppercase">Operational Blockers</div>
                <div className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400 mt-1">
                  {employeeAnalytics.blockersReportedCount}
                </div>
                <div className="text-[11px] text-rose-700 dark:text-rose-400 mt-0.5 font-medium">
                  {employeeAnalytics.supportRequestsCount} Dean Support Requests
                </div>
              </div>
            </div>

            {/* Department-Specific 6-KPI Breakdown Progress Bars */}
            <div className="p-6 sm:p-7 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>6 Department-Specific KPI Performance Progress</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Mandatory departmental deliverables defined in institutional SOP for {selectedStaff.department}
                  </p>
                </div>
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                  6 Core KPIs Monitored
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {employeeAnalytics.kpiProgressList.map((kpiItem, idx) => (
                  <div 
                    key={idx} 
                    className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition space-y-2.5 shadow-2xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5 border border-emerald-200 dark:border-emerald-800">
                          {idx + 1}
                        </span>
                        <div>
                          <h4 className="font-bold text-xs text-slate-900 dark:text-white leading-snug">{kpiItem.kpi}</h4>
                          {kpiItem.latestValue && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                              Recent output: <strong className="text-slate-800 dark:text-slate-200">{kpiItem.latestValue}</strong>
                            </p>
                          )}
                        </div>
                      </div>

                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase shrink-0 border ${
                        kpiItem.status === 'Excellent'
                          ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                          : kpiItem.status === 'Good'
                          ? 'bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border-sky-300 dark:border-sky-800'
                          : 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                      }`}>
                        {kpiItem.status}
                      </span>
                    </div>

                    {/* Progress Bar with Colorful Gradient */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                        <span>
                          Done: <strong className="text-emerald-700 dark:text-emerald-400 font-bold">{kpiItem.completedCount}</strong> • Active: {kpiItem.inProgressCount}
                        </span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{kpiItem.completionRate}%</span>
                      </div>
                      <div className="w-full bg-slate-200/80 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${kpiItem.completionRate}%` }}
                          className={`h-full rounded-full transition-all duration-500 ${
                            kpiItem.completionRate >= 80
                              ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                              : kpiItem.completionRate >= 50
                              ? 'bg-gradient-to-r from-sky-500 to-cyan-500'
                              : 'bg-gradient-to-r from-amber-500 to-yellow-500'
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Operational Blockers & Support History */}
            {(employeeAnalytics.recentBlockers.length > 0 || employeeAnalytics.recentSupportRequests.length > 0) && (
              <div className="p-6 sm:p-7 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-4">
                <h3 className="font-extrabold text-xs text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>Blockers Reported & Dean Support Requests in Period</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* Blockers */}
                  <div className="p-4 rounded-2xl bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/60 space-y-2">
                    <div className="font-bold text-rose-900 dark:text-rose-300 uppercase text-[11px] flex items-center gap-1.5">
                      <AlertOctagon className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                      <span>Reported Operational Blockers ({employeeAnalytics.recentBlockers.length})</span>
                    </div>
                    {employeeAnalytics.recentBlockers.length === 0 ? (
                      <p className="text-slate-500 italic text-[11px]">No active blockers reported in this period.</p>
                    ) : (
                      <ul className="space-y-2 divide-y divide-rose-100 dark:divide-rose-900/40">
                        {employeeAnalytics.recentBlockers.map((b, bIdx) => (
                          <li key={bIdx} className="pt-2 first:pt-0">
                            <span className="font-mono text-[10px] font-bold text-rose-800 dark:text-rose-300 bg-rose-100 dark:bg-rose-900/60 px-1.5 py-0.5 rounded mr-2">
                              {b.date}
                            </span>
                            <span className="text-rose-950 dark:text-rose-200 font-medium">{b.blocker}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Support Needed */}
                  <div className="p-4 rounded-2xl bg-teal-50/70 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-900/60 space-y-2">
                    <div className="font-bold text-teal-950 dark:text-teal-300 uppercase text-[11px] flex items-center gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                      <span>Executive Support Requests ({employeeAnalytics.recentSupportRequests.length})</span>
                    </div>
                    {employeeAnalytics.recentSupportRequests.length === 0 ? (
                      <p className="text-slate-500 italic text-[11px]">No managerial assistance requested in this period.</p>
                    ) : (
                      <ul className="space-y-2 divide-y divide-teal-100 dark:divide-teal-900/40">
                        {employeeAnalytics.recentSupportRequests.map((s, sIdx) => (
                          <li key={sIdx} className="pt-2 first:pt-0">
                            <span className="font-mono text-[10px] font-bold text-teal-800 dark:text-teal-300 bg-teal-100 dark:bg-teal-900/60 px-1.5 py-0.5 rounded mr-2">
                              {s.date}
                            </span>
                            <span className="text-teal-950 dark:text-teal-200 font-medium">{s.details}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Historical Submissions Table */}
            <div className="p-6 sm:p-7 border-t border-slate-200/80 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-xs text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Historical Submission Log ({employeeAnalytics.submissionsHistory.length} Days)</span>
                </h3>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold uppercase text-[11px] border-b border-slate-200 dark:border-slate-700">
                      <th className="py-2.5 px-4 w-28">Date</th>
                      <th className="py-2.5 px-3 w-24 text-center">Time</th>
                      <th className="py-2.5 px-4 w-36 text-center">Compliance</th>
                      <th className="py-2.5 px-3 w-24 text-center">Status</th>
                      <th className="py-2.5 px-3 w-24 text-center">Tasks Done</th>
                      <th className="py-2.5 px-4">Key Achievements</th>
                      <th className="py-2.5 px-3 w-20 text-center">PDF</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                    {employeeAnalytics.submissionsHistory.map((rep) => {
                      const doneCount = rep.tasks.filter(t => t.status === 'Done').length;
                      return (
                        <tr key={rep.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                          <td className="py-2.5 px-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                            {rep.date}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono text-slate-600 dark:text-slate-400">
                            {rep.submissionTime || '-'}
                          </td>
                          <td className="py-2.5 px-4 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                              rep.complianceStatus === 'SUBMITTED ON TIME'
                                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                                : rep.complianceStatus === 'LATE'
                                ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                                : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                            }`}>
                              {rep.complianceStatus}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              rep.overallStatus === 'Done' ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                            }`}>
                              {rep.overallStatus}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-800 dark:text-slate-200">
                            {doneCount} / {rep.tasks.length}
                          </td>
                          <td className="py-2.5 px-4 text-slate-700 dark:text-slate-300 leading-snug">
                            {rep.keyAchievementsSummary || '-'}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => exportReportToPDF(rep)}
                              title="Export Daily PDF"
                              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition cursor-pointer"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* 25-Candidate Comparison Leaderboard & Directory */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xs border border-slate-200/80 dark:border-slate-800 overflow-hidden space-y-4 p-6 transition-colors duration-200">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>25-Candidate Institutional Comparison Leaderboard & Directory</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Compare performance, reliability, and task output across all 25 candidate roles
                </p>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="relative w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search staff, title, department..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none shadow-2xs"
                  />
                </div>

                <select
                  value={selectedDeptFilter}
                  onChange={e => setSelectedDeptFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer shadow-2xs"
                >
                  {departments.map(dept => (
                    <option key={dept} value={dept}>
                      {dept === 'ALL' ? 'All Departments' : dept}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Comparison Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold uppercase text-[11px] border-b border-slate-200 dark:border-slate-700">
                    <th className="py-3 px-3 w-12 text-center">#</th>
                    <th 
                      onClick={() => { setSortField('name'); setSortAsc(!sortAsc); }}
                      className="py-3 px-4 cursor-pointer hover:text-emerald-700 dark:hover:text-emerald-400"
                    >
                      Staff Member {sortField === 'name' ? (sortAsc ? '▲' : '▼') : ''}
                    </th>
                    <th className="py-3 px-4">Department / Unit</th>
                    <th 
                      onClick={() => { setSortField('submissionRate'); setSortAsc(!sortAsc); }}
                      className="py-3 px-3 text-center cursor-pointer hover:text-emerald-700 dark:hover:text-emerald-400"
                    >
                      Submission % {sortField === 'submissionRate' ? (sortAsc ? '▲' : '▼') : ''}
                    </th>
                    <th 
                      onClick={() => { setSortField('onTimeRate'); setSortAsc(!sortAsc); }}
                      className="py-3 px-3 text-center cursor-pointer hover:text-emerald-700 dark:hover:text-emerald-400"
                    >
                      On-Time % {sortField === 'onTimeRate' ? (sortAsc ? '▲' : '▼') : ''}
                    </th>
                    <th 
                      onClick={() => { setSortField('taskCompletionRate'); setSortAsc(!sortAsc); }}
                      className="py-3 px-3 text-center cursor-pointer hover:text-emerald-700 dark:hover:text-emerald-400"
                    >
                      Tasks Done % {sortField === 'taskCompletionRate' ? (sortAsc ? '▲' : '▼') : ''}
                    </th>
                    <th className="py-3 px-3 text-center">Blockers</th>
                    <th className="py-3 px-3 text-center">Rating</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                  {filteredStaffDirectory.map(({ staff, analytics }) => {
                    const isSelected = selectedStaff.id === staff.id;
                    return (
                      <tr 
                        key={staff.id} 
                        className={`hover:bg-emerald-50/20 dark:hover:bg-slate-800/50 transition ${
                          isSelected ? 'bg-emerald-50/40 dark:bg-emerald-950/30 border-l-4 border-l-emerald-600' : ''
                        }`}
                      >
                        <td className="py-2.5 px-3 text-center font-bold text-slate-400">
                          {staff.sNo}
                        </td>
                        <td className="py-2.5 px-4 font-bold text-slate-900 dark:text-white">
                          <div>{staff.name}</div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">{staff.designation}</div>
                        </td>
                        <td className="py-2.5 px-4 text-emerald-800 dark:text-emerald-400 font-semibold">
                          {staff.department}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-800 dark:text-slate-200">
                          {analytics.submissionRate}%
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-emerald-700 dark:text-emerald-400">
                          {analytics.onTimeRate}%
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-sky-700 dark:text-sky-400">
                          {analytics.taskCompletionRate}%
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {analytics.blockersReportedCount > 0 ? (
                            <span className="px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 text-[10px] font-bold">
                              {analytics.blockersReportedCount} Blockers
                            </span>
                          ) : (
                            <span className="text-slate-300 dark:text-slate-600">-</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                            analytics.performanceRating === 'High Performer'
                              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                              : analytics.performanceRating === 'On Track'
                              ? 'bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border-sky-300 dark:border-sky-800'
                              : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                          }`}>
                            {analytics.performanceRating}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedAnalyticsStaffId(staff.id);
                              window.scrollTo({ top: 350, behavior: 'smooth' });
                            }}
                            className={`px-3 py-1 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer ${
                              isSelected
                                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white'
                                : 'bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            }`}
                          >
                            {isSelected ? 'Viewing' : 'View Dossier'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: WORK & TASK ANALYTICS                                              */}
      {/* ========================================================================= */}
      {activeTab === 'WORK' && (
        <div className="space-y-6">
          {/* Global Institutional Task Productivity Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs transition">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Tasks Logged</div>
              <div className="text-3xl font-black text-slate-900 dark:text-white mt-1">{workAnalytics.totalTasksLogged}</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold mt-1">
                Across {workAnalytics.totalReportsSubmitted} Submitted Reports
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-emerald-300 dark:border-emerald-800 shadow-xs bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent transition">
              <div className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">Tasks Completed (Done)</div>
              <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{workAnalytics.tasksCompleted}</div>
              <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold mt-1">
                {workAnalytics.overallTaskCompletionRate}% Overall Completion Rate
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-sky-300 dark:border-sky-800 shadow-xs bg-gradient-to-br from-sky-500/10 via-cyan-500/5 to-transparent transition">
              <div className="text-[11px] font-bold text-sky-800 dark:text-sky-300 uppercase tracking-wider">Tasks In Progress</div>
              <div className="text-3xl font-black text-sky-600 dark:text-sky-400 mt-1">{workAnalytics.tasksInProgress}</div>
              <div className="text-[11px] text-sky-700 dark:text-sky-400 font-medium mt-1">
                Active Operational Workflows
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-rose-300 dark:border-rose-800 shadow-xs bg-gradient-to-br from-rose-500/10 via-red-500/5 to-transparent transition">
              <div className="text-[11px] font-bold text-rose-800 dark:text-rose-300 uppercase tracking-wider">Pending / Blocked</div>
              <div className="text-3xl font-black text-rose-600 dark:text-rose-400 mt-1">{workAnalytics.tasksPending}</div>
              <div className="text-[11px] text-rose-700 dark:text-rose-400 font-medium mt-1">
                {workAnalytics.activeBlockers.length} Active Challenges Logged
              </div>
            </div>
          </div>

          {/* Visual Progress Bar for Global Tasks */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xs border border-slate-200/80 dark:border-slate-800 p-6 space-y-3 transition-colors duration-200">
            <div className="flex items-center justify-between text-xs">
              <span className="font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                Institutional Task Status Ratio ({workAnalytics.totalTasksLogged} Total Entries)
              </span>
              <div className="flex items-center gap-4 text-[11px] font-bold">
                <span className="text-emerald-700 dark:text-emerald-400">Done ({workAnalytics.tasksCompleted})</span>
                <span className="text-sky-700 dark:text-sky-400">In Progress ({workAnalytics.tasksInProgress})</span>
                <span className="text-rose-700 dark:text-rose-400">Pending ({workAnalytics.tasksPending})</span>
              </div>
            </div>

            <div className="w-full bg-slate-100 dark:bg-slate-800 h-5 rounded-full overflow-hidden flex shadow-inner">
              <div
                style={{ width: `${workAnalytics.overallTaskCompletionRate}%` }}
                className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full transition-all duration-500 flex items-center justify-center text-[10px] font-bold text-white shadow-xs"
                title={`Completed: ${workAnalytics.tasksCompleted}`}
              >
                {workAnalytics.tasksCompleted > 0 ? `${workAnalytics.tasksCompleted}` : ''}
              </div>
              <div
                style={{
                  width: `${
                    workAnalytics.totalTasksLogged > 0
                      ? (workAnalytics.tasksInProgress / workAnalytics.totalTasksLogged) * 100
                      : 0
                  }%`
                }}
                className="bg-gradient-to-r from-sky-400 to-cyan-400 h-full transition-all duration-500 flex items-center justify-center text-[10px] font-bold text-slate-900 shadow-xs"
                title={`In Progress: ${workAnalytics.tasksInProgress}`}
              >
                {workAnalytics.tasksInProgress > 0 ? `${workAnalytics.tasksInProgress}` : ''}
              </div>
              <div
                style={{
                  width: `${
                    workAnalytics.totalTasksLogged > 0
                      ? (workAnalytics.tasksPending / workAnalytics.totalTasksLogged) * 100
                      : 0
                  }%`
                }}
                className="bg-gradient-to-r from-rose-400 to-red-400 h-full transition-all duration-500 flex items-center justify-center text-[10px] font-bold text-white shadow-xs"
                title={`Pending: ${workAnalytics.tasksPending}`}
              >
                {workAnalytics.tasksPending > 0 ? `${workAnalytics.tasksPending}` : ''}
              </div>
            </div>
          </div>

          {/* 24-Department Productivity & Compliance Matrix */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xs border border-slate-200/80 dark:border-slate-800 overflow-hidden space-y-4 p-6 transition-colors duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>24-Department Productivity & Compliance Matrix</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Comprehensive performance matrix across all academic, clinical, and administrative units
                </p>
              </div>
              <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-3 py-1 rounded-full">
                {workAnalytics.departmentSummaries.length} Departments Monitored
              </span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold uppercase text-[11px] border-b border-slate-200 dark:border-slate-700">
                    <th className="py-3 px-4">Department / Unit</th>
                    <th className="py-3 px-3 text-center">Staff</th>
                    <th className="py-3 px-3 text-center">Submissions</th>
                    <th className="py-3 px-3 text-center">Compliance %</th>
                    <th className="py-3 px-3 text-center">Tasks Done</th>
                    <th className="py-3 px-4">Completion %</th>
                    <th className="py-3 px-3 text-center">Blockers</th>
                    <th className="py-3 px-3 text-center">Help Req</th>
                    <th className="py-3 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                  {workAnalytics.departmentSummaries.map((dept, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                      <td className="py-2.5 px-4 font-bold text-slate-900 dark:text-white">
                        {dept.department}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-semibold text-slate-600 dark:text-slate-400">
                        {dept.staffCount}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-slate-700 dark:text-slate-300">
                        {dept.reportsSubmitted} / {dept.reportsExpected}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-emerald-700 dark:text-emerald-400">
                        {dept.complianceRate}%
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-slate-800 dark:text-slate-200">
                        {dept.tasksCompleted} / {dept.tasksLogged}
                      </td>
                      <td className="py-2.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                            <div
                              style={{ width: `${dept.completionRate}%` }}
                              className={`h-full rounded-full ${
                                dept.completionRate >= 80 ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-gradient-to-r from-sky-500 to-cyan-500'
                              }`}
                            />
                          </div>
                          <span className="font-mono font-bold text-slate-700 dark:text-slate-300 text-[11px]">
                            {dept.completionRate}%
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {dept.blockersCount > 0 ? (
                          <span className="px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 font-bold text-[10px]">
                            {dept.blockersCount}
                          </span>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600">-</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {dept.supportNeededCount > 0 ? (
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold text-[10px]">
                            {dept.supportNeededCount}
                          </span>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600">-</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                          dept.status === 'Optimal'
                            ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                            : dept.status === 'Average'
                            ? 'bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border-sky-300 dark:border-sky-800'
                            : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                        }`}>
                          {dept.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Executive Support Queue & Operational Blockers Radar Split */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Executive Support Queue */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xs border border-slate-200/80 dark:border-slate-800 p-6 space-y-4 transition-colors duration-200">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  <span>Executive Dean Support Queue ({workAnalytics.managementSupportQueue.length})</span>
                </h3>
                <span className="text-[10px] font-bold text-teal-800 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 px-2 py-0.5 rounded-full">
                  Immediate Attention
                </span>
              </div>

              {workAnalytics.managementSupportQueue.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs italic">
                  No staff members currently requesting Dean/Management support in this period.
                </div>
              ) : (
                <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                  {workAnalytics.managementSupportQueue.map((item, qIdx) => (
                    <div key={qIdx} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800/70 transition space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white text-xs">{item.staffName}</div>
                          <div className="text-[11px] text-emerald-800 dark:text-emerald-400 font-semibold">{item.department}</div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[10px] text-slate-400">{item.date}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            item.priority === 'Urgent' ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}>
                            {item.priority}
                          </span>
                        </div>
                      </div>

                      <p className="text-slate-700 dark:text-slate-300 text-xs leading-relaxed bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/70 dark:border-slate-800">
                        {item.details}
                      </p>

                      <div className="flex items-center justify-between pt-1 text-[11px]">
                        {item.managerReview ? (
                          <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Reviewed: {item.managerReview.slice(0, 30)}...
                          </span>
                        ) : (
                          <span className="text-amber-700 dark:text-amber-400 font-semibold">Pending Dean Review</span>
                        )}

                        <button
                          type="button"
                          onClick={() => handleAcknowledgeSupport(item.reportId, item.staffName)}
                          className="px-3 py-1 rounded-lg bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold text-xs transition cursor-pointer shadow-2xs"
                        >
                          Acknowledge
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Operational Blockers & Risk Radar */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xs border border-slate-200/80 dark:border-slate-800 p-6 space-y-4 transition-colors duration-200">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <AlertOctagon className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  <span>Operational Blockers & Risk Radar ({workAnalytics.activeBlockers.length})</span>
                </h3>
                <span className="text-[10px] font-bold text-rose-800 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 px-2 py-0.5 rounded-full">
                  Campus Escalations
                </span>
              </div>

              {workAnalytics.activeBlockers.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs italic">
                  Zero critical bottlenecks or infrastructure blockers reported across campus.
                </div>
              ) : (
                <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                  {workAnalytics.activeBlockers.map((blockerItem, bIdx) => (
                    <div key={bIdx} className="p-4 rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20 hover:bg-rose-50/70 dark:hover:bg-rose-950/40 transition space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white text-xs">{blockerItem.staffName}</div>
                          <div className="text-[11px] text-emerald-800 dark:text-emerald-400 font-semibold">{blockerItem.department}</div>
                        </div>
                        <span className="font-mono text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                          {blockerItem.date}
                        </span>
                      </div>

                      <p className="text-rose-950 dark:text-rose-200 text-xs leading-relaxed font-medium bg-white/80 dark:bg-slate-900/80 p-2.5 rounded-xl border border-rose-100 dark:border-rose-900/50">
                        {blockerItem.blocker}
                      </p>

                      <div className="flex items-center justify-end pt-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          blockerItem.resolved
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                            : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
                        }`}>
                          {blockerItem.resolved ? '✓ Addressed by Dean' : 'Active Escalation'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
