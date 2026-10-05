import React, { useState } from 'react';
import { useCUCOM } from '../../context/CUCOMContext';
import { exportMasterLogToExcel, exportMasterLogToPDF } from '../../utils/cucomExport';
import { 
  Table, 
  FileSpreadsheet, 
  Download, 
  Search, 
  Filter, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Building,
  User,
  ChevronDown,
  ChevronUp,
  FileText,
  DollarSign,
  AlertTriangle,
  ShieldAlert,
  ListChecks,
  Award,
  Paperclip,
  ExternalLink,
  File
} from 'lucide-react';

export const MasterLogView: React.FC = () => {
  const { reports, filteredStaffList, selectedDate, setSelectedDate, staffScope, isAdmin, currentUser } = useCUCOM();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null);

  // If regular manager/staff, strictly isolate reports to their assigned section/department
  const userVisibleReports = isAdmin
    ? reports
    : reports.filter(r => {
        const userDept = (currentUser?.department || '').trim().toLowerCase();
        const reportDept = (r.department || '').trim().toLowerCase();
        return (
          r.staffId === currentUser?.staffId ||
          r.staffName === currentUser?.name ||
          (userDept && reportDept === userDept)
        );
      });

  // Extract departments
  const departments = ['ALL', ...Array.from(new Set(filteredStaffList.map(s => s.department)))];
  const targetStaffIds = new Set(filteredStaffList.map(s => s.id));

  // Filter reports
  const filteredReports = userVisibleReports.filter(r => {
    if (isAdmin && staffScope === 'CORE_18' && !targetStaffIds.has(r.staffId)) {
      return false;
    }

    const matchesSearch = 
      r.staffName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.designation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.workDoneSummary && r.workDoneSummary.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (r.activitiesPerformed && r.activitiesPerformed.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (r.issuesHeld && r.issuesHeld.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (r.cashCollected && r.cashCollected.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (r.unusualActivitiesDetails && r.unusualActivitiesDetails.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (r.keyAchievementsSummary && r.keyAchievementsSummary.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (r.challengeBlocker && r.challengeBlocker.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesDept = selectedDept === 'ALL' || r.department === selectedDept;

    return matchesSearch && matchesDept;
  });

  const toggleExpand = (id: string) => {
    setExpandedReportId(prev => prev === id ? null : id);
  };

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Top Header Card - Clean Professional Layout with CUCOM Crimson Accent */}
      <div className="bg-white dark:bg-[#111827] rounded-3xl shadow-xs border border-slate-200/80 dark:border-slate-800 overflow-hidden border-l-4 border-l-red-600 p-6 sm:p-7">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="text-xs text-red-700 dark:text-red-400 font-bold uppercase tracking-wider mb-1.5 flex items-center gap-2">
              <Table className="w-4 h-4 text-red-600 dark:text-red-400" />
              <span>COMMONWEALTH UNIVERSITY COLLEGE OF MEDICINE • MASTER LOG</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white">
              {isAdmin ? 'DAILY REPORT MASTER LOG' : 'MY DAILY SUBMISSION ARCHIVE'}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 italic">
              {isAdmin
                ? '[Centralized institutional archive of authorized department daily report submissions]'
                : '[Personal archive of your daily work reports submitted to the central database]'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => exportMasterLogToExcel(filteredReports)}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-700 hover:to-rose-800 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-red-600/20 transition cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export Master Log (.xlsx)</span>
            </button>

            <button
              type="button"
              onClick={() => exportMasterLogToPDF(filteredReports, selectedDate)}
              className="px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-2 border border-slate-300 dark:border-slate-700 shadow-2xs transition cursor-pointer"
            >
              <Download className="w-4 h-4 text-red-600 dark:text-red-400" />
              <span>Export Master PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-[#111827] rounded-3xl shadow-xs border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search work done, issues, cash, staff..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-red-500 focus:outline-none shadow-2xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedDept}
              onChange={e => setSelectedDept(e.target.value)}
              className="px-3.5 py-2 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-red-500 focus:outline-none cursor-pointer shadow-2xs"
            >
              {departments.map(dept => (
                <option key={dept} value={dept} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">
                  {dept === 'ALL' ? 'All Departments' : dept}
                </option>
              ))}
            </select>
          </div>

          <span className="text-xs text-red-800 dark:text-red-300 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800/60 px-3.5 py-1.5 rounded-full font-bold">
            Showing {filteredReports.length} {isAdmin ? 'logged reports' : 'of your submitted reports'}
          </span>
        </div>
      </div>

      {/* MASTER LOG SPREADSHEET TABLE */}
      <div className="bg-white dark:bg-[#111827] rounded-3xl shadow-xs border border-slate-200/80 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/90 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold uppercase text-[11px] border-b border-slate-200 dark:border-slate-800">
                <th className="py-3 px-3 w-24">Date</th>
                <th className="py-3 px-4 w-48">Candidate &amp; Role</th>
                <th className="py-3 px-4 w-36">Department</th>
                <th className="py-3 px-4">What Work Was Done Today?</th>
                <th className="py-3 px-3 text-center w-28">Issues Held</th>
                <th className="py-3 px-3 text-center w-28">Cash Collected</th>
                <th className="py-3 px-3 text-center w-28">Incidents</th>
                <th className="py-3 px-3 text-center w-24">Status</th>
                <th className="py-3 px-2 text-center w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-sans">
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500 dark:text-slate-400 text-xs">
                    No reports match your current filters.
                  </td>
                </tr>
              ) : (
                filteredReports.map(rep => {
                  const isExpanded = expandedReportId === rep.id;
                  const hasIssues = rep.issuesHeld && !rep.issuesHeld.toLowerCase().includes('none') && rep.issuesHeld !== 'No issues held';
                  const isCashCollected = rep.cashCollected && rep.cashCollected !== '$0.00 (No cash handling role)' && rep.cashCollected !== '$0.00' && rep.cashCollected !== '$0' && rep.cashCollected !== '0';

                  return (
                    <React.Fragment key={rep.id}>
                      <tr 
                        onClick={() => toggleExpand(rep.id)}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition cursor-pointer"
                      >
                        {/* Date */}
                        <td className="py-3 px-3 font-mono font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                          {rep.date}
                        </td>

                        {/* Name & Role */}
                        <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                          <div>{rep.staffName}</div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">{rep.designation}</div>
                        </td>

                        {/* Department */}
                        <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-medium">
                          {rep.department}
                        </td>

                        {/* Work Done Today */}
                        <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                          <p className="line-clamp-2 leading-relaxed">
                            {rep.workDoneSummary || rep.keyAchievementsSummary || <em className="text-slate-400">Operational tasks logged</em>}
                          </p>
                        </td>

                        {/* Issues Held */}
                        <td className="py-3 px-3 text-center">
                          {hasIssues ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800" title={rep.issuesHeld || rep.challengeBlocker}>
                              <AlertTriangle className="w-3 h-3 shrink-0" />
                              <span>Issues Logged</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                              <CheckCircle2 className="w-3 h-3 shrink-0" />
                              <span>Smooth</span>
                            </span>
                          )}
                        </td>

                        {/* Cash Collected */}
                        <td className="py-3 px-3 text-center">
                          {isCashCollected ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                              <DollarSign className="w-3 h-3 shrink-0" />
                              <span>{rep.cashCollected}</span>
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                              {rep.cashCollected || '$0.00 / N/A'}
                            </span>
                          )}
                        </td>

                        {/* Unusual / Incidents */}
                        <td className="py-3 px-3 text-center">
                          {rep.hasUnusualActivities ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800 animate-pulse" title={rep.unusualActivitiesDetails}>
                              <ShieldAlert className="w-3 h-3 shrink-0" />
                              <span>{rep.unusualActivityType || 'Flagged'}</span>
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400 dark:text-slate-500">
                              None
                            </span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-3 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                            rep.complianceStatus === 'SUBMITTED ON TIME'
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
                              : rep.complianceStatus === 'LATE'
                              ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                          }`}>
                            {rep.complianceStatus === 'SUBMITTED ON TIME' ? 'On Time' : rep.complianceStatus === 'LATE' ? 'Late' : rep.overallStatus}
                          </span>
                        </td>

                        {/* Expand Icon */}
                        <td className="py-3 px-2 text-center text-slate-400 dark:text-slate-500">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </td>
                      </tr>

                      {/* Expandable Full Details Row */}
                      {isExpanded && (
                        <tr className="bg-slate-50/70 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800">
                          <td colSpan={9} className="p-5">
                            <div className="bg-white dark:bg-[#0B0F19] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
                              {/* Header Bar */}
                              <div className="flex flex-wrap items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 gap-2">
                                <div className="flex items-center gap-2">
                                  <span className="font-black text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                                    Official Daily Report Dossier: {rep.staffName}
                                  </span>
                                  <span className="text-xs text-slate-500 dark:text-slate-400">({rep.department} • {rep.designation})</span>
                                </div>
                                <div className="flex items-center gap-3 text-xs">
                                  <span className="text-slate-500 dark:text-slate-400">
                                    Submission Time: <strong className="text-slate-800 dark:text-slate-200 font-bold">{rep.submissionTime || '-'}</strong>
                                  </span>
                                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                                    rep.complianceStatus === 'SUBMITTED ON TIME'
                                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                  }`}>
                                    {rep.complianceStatus}
                                  </span>
                                </div>
                              </div>

                              {/* 1. What Work Was Done Today */}
                              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-1.5">
                                <div className="font-extrabold text-[11px] text-slate-900 dark:text-white uppercase flex items-center gap-1.5">
                                  <FileText className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                                  <span>1. What Work Was Done Today (Daily Work Summary)</span>
                                </div>
                                <p className="text-slate-700 dark:text-slate-300 text-xs leading-relaxed whitespace-pre-wrap">
                                  {rep.workDoneSummary || rep.keyAchievementsSummary || 'Standard daily operations and duties completed as per assigned schedule.'}
                                </p>
                              </div>

                              {/* 2. Activities Performed Today */}
                              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-1.5">
                                <div className="font-extrabold text-[11px] text-slate-900 dark:text-white uppercase flex items-center gap-1.5">
                                  <ListChecks className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                                  <span>2. Activities Performed Today</span>
                                </div>
                                <p className="text-slate-700 dark:text-slate-300 text-xs leading-relaxed whitespace-pre-wrap">
                                  {rep.activitiesPerformed || 'No specific activities recorded.'}
                                </p>
                              </div>

                              {/* 3. Issues Held & 4. Cash Generated Grid */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {/* 3. Issues Held */}
                                <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/40 dark:bg-amber-950/20 space-y-1.5">
                                  <div className="font-extrabold text-[11px] text-amber-900 dark:text-amber-300 uppercase flex items-center gap-1.5">
                                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                                    <span>3. Issues / Problems Held Today</span>
                                  </div>
                                  <p className="text-slate-800 dark:text-slate-200 text-xs leading-relaxed">
                                    {rep.issuesHeld || rep.challengeBlocker || 'No issues held - operations ran smoothly.'}
                                  </p>
                                </div>

                                {/* 4. Cash Collected */}
                                <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-1.5">
                                  <div className="font-extrabold text-[11px] text-emerald-900 dark:text-emerald-300 uppercase flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                      <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                                      <span>4. Cash / Revenue Generated &amp; Collected</span>
                                    </div>
                                    <span className="font-mono font-bold text-xs text-emerald-800 dark:text-emerald-300">
                                      {rep.cashCollected || '$0.00 / N/A'}
                                    </span>
                                  </div>
                                  <p className="text-slate-700 dark:text-slate-300 text-xs">
                                    {rep.supportDetails?.startsWith('Cash Source:') 
                                      ? rep.supportDetails 
                                      : rep.cashCollected && rep.cashCollected !== '$0.00 (No cash handling role)'
                                      ? `Source: ${rep.supportDetails || 'Direct departmental receipts'}`
                                      : 'No cash handling or revenue receipts collected.'}
                                  </p>
                                </div>
                              </div>

                              {/* 5. Unusual, Extra or Unwanted Activities */}
                              <div className={`p-4 rounded-xl border space-y-1.5 ${
                                rep.hasUnusualActivities 
                                  ? 'border-rose-300 dark:border-rose-900 bg-rose-50/60 dark:bg-rose-950/30' 
                                  : 'border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/40'
                              }`}>
                                <div className="font-extrabold text-[11px] uppercase flex items-center gap-1.5">
                                  <ShieldAlert className={`w-3.5 h-3.5 ${rep.hasUnusualActivities ? 'text-rose-600' : 'text-slate-500'}`} />
                                  <span className={rep.hasUnusualActivities ? 'text-rose-900 dark:text-rose-300' : 'text-slate-700 dark:text-slate-300'}>
                                    5. Unusual, Extra or Unwanted Activities / Incidents: {rep.hasUnusualActivities ? `[FLAGGED: ${rep.unusualActivityType || 'Incident'}]` : '[Normal Operations - None]'}
                                  </span>
                                </div>
                                <p className={`text-xs leading-relaxed ${rep.hasUnusualActivities ? 'text-rose-950 dark:text-rose-200 font-medium' : 'text-slate-600 dark:text-slate-400'}`}>
                                  {rep.hasUnusualActivities 
                                    ? (rep.unusualActivitiesDetails || 'Unusual incident reported without description.') 
                                    : 'Zero unusual, unwanted, or emergency activities reported for this shift.'}
                                </p>
                              </div>

                              {/* Attachments Section if present */}
                              {rep.attachments && rep.attachments.length > 0 && (
                                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-2">
                                  <div className="font-extrabold text-[11px] text-slate-900 dark:text-white uppercase flex items-center gap-1.5">
                                    <Paperclip className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                                    <span>Verified Supporting Documents &amp; Attachments ({rep.attachments.length})</span>
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
                                    {rep.attachments.map((att, attIdx) => (
                                      <a
                                        key={attIdx}
                                        href={att.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-red-500 dark:hover:border-red-500 transition flex items-center justify-between gap-2 text-xs group"
                                      >
                                        <div className="flex items-center gap-2 min-w-0">
                                          <File className="w-3.5 h-3.5 text-red-600 shrink-0" />
                                          <span className="font-semibold text-slate-800 dark:text-slate-200 truncate group-hover:text-red-600 transition" title={att.name}>
                                            {att.name}
                                          </span>
                                        </div>
                                        <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-red-600 shrink-0" />
                                      </a>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* 6. Tomorrow Priority & Dean Review */}
                              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between text-xs gap-3">
                                <div>
                                  <strong className="text-slate-800 dark:text-slate-200">6. Top Priority for Tomorrow: </strong>
                                  <span className="text-slate-600 dark:text-slate-400">{rep.priorityTomorrow || 'Continue scheduled daily workflows.'}</span>
                                </div>
                                {rep.managerReview && (
                                  <div className="text-red-900 dark:text-red-200 font-semibold bg-red-50 dark:bg-red-950/40 px-3.5 py-1.5 rounded-xl border border-red-200 dark:border-red-800/60">
                                    Dean Review &amp; Guidance: "{rep.managerReview}"
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
