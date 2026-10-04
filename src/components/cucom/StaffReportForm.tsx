import React, { useState, useEffect } from 'react';
import { useCUCOM } from '../../context/CUCOMContext';
import { DailyReport, TaskEntry, TaskStatus, PriorityLevel, StaffMember } from '../../types/cucom';
import { exportReportToPDF } from '../../utils/cucomExport';
import { 
  Send, 
  Save, 
  Plus, 
  Trash2, 
  Download, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  HelpCircle, 
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  Calendar,
  User,
  Building,
  Award,
  MessageSquare,
  Lock,
  Check,
  FileText,
  DollarSign,
  AlertTriangle,
  ListChecks,
  Activity,
  Flame,
  Info
} from 'lucide-react';

export const StaffReportForm: React.FC = () => {
  const { 
    currentUser,
    currentStaff, 
    selectedDate, 
    setSelectedDate, 
    getReportForStaff, 
    saveReport, 
    checkIsLate,
    staffList,
    setCurrentStaff,
    deadlineFormatted,
    isAdmin,
    setActiveView
  } = useCUCOM();

  // If regular candidate, strictly lock to their own account; if Admin, can select candidate
  const activeStaff: StaffMember = (!isAdmin && currentUser?.staffId 
    ? staffList.find(s => s.id === currentUser.staffId) 
    : null) || currentStaff || staffList[0] || {
      sNo: 0,
      id: currentUser?.staffId || currentUser?.id || 'admin-preview',
      name: currentUser?.name || 'Administrator (Preview Mode)',
      department: currentUser?.department || 'Executive Leadership',
      designation: currentUser?.designation || 'Administrator',
      email: currentUser?.email || 'admin@cucom.edu.ag',
      defaultKpis: [],
      isActive: true
    };

  const [report, setReport] = useState<DailyReport>(() => {
    return getReportForStaff(activeStaff.id, selectedDate);
  });

  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [justSubmitted, setJustSubmitted] = useState<boolean>(false);

  useEffect(() => {
    if (activeStaff && activeStaff.id) {
      setReport(getReportForStaff(activeStaff.id, selectedDate));
      setJustSubmitted(false);
    }
  }, [activeStaff.id, selectedDate, getReportForStaff]);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4500);
  };

  const updateTask = (taskId: string, field: keyof TaskEntry, value: any) => {
    setReport(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => (t.id === taskId ? { ...t, [field]: value } : t))
    }));
  };

  const addTask = () => {
    const newTask: TaskEntry = {
      id: `custom-${Date.now()}`,
      kpi: 'Additional role-specific responsibility',
      description: '',
      status: 'Pending',
      kpiValue: '',
      keyAchievement: '',
      isCustom: true
    };
    setReport(prev => ({ ...prev, tasks: [...prev.tasks, newTask] }));
    showToast('New activity row added.', 'info');
  };

  const removeTask = (taskId: string) => {
    setReport(prev => ({
      ...prev,
      tasks: prev.tasks.filter(t => t.id !== taskId)
    }));
  };

  const handleSaveDraft = () => {
    saveReport({ ...report, isDraft: true }, false);
    showToast('Report draft saved successfully.', 'info');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const now = new Date();
    const formattedTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    const isLate = checkIsLate(report.date, formattedTime);

    saveReport(report, true);
    setJustSubmitted(true);

    if (isLate) {
      showToast(`Report submitted at ${formattedTime} (Marked LATE - daily deadline is ${deadlineFormatted})`, 'error');
    } else {
      showToast(`Daily report submitted on time at ${formattedTime}! Saved to central database.`, 'success');
    }
  };

  const isAlreadySubmitted = report.complianceStatus === 'SUBMITTED ON TIME' || report.complianceStatus === 'LATE';

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-28 px-3 sm:px-0 font-sans">
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-20 right-4 sm:right-6 z-50 px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border text-xs sm:text-sm font-bold transition-all transform animate-in slide-in-from-top-4 ${
          notification.type === 'success' 
            ? 'bg-emerald-950 text-emerald-100 border-emerald-500 shadow-emerald-950/40' 
            : notification.type === 'error'
            ? 'bg-red-950 text-red-100 border-red-500 shadow-red-950/40'
            : 'bg-slate-900 text-slate-100 border-slate-700'
        }`}>
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Administrator Preview Notice if staffList is empty */}
      {isAdmin && staffList.length === 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div>
              <span className="font-black text-amber-900 dark:text-amber-200 text-sm block">
                Administrator Form Preview Mode
              </span>
              <span className="text-amber-700 dark:text-amber-400">
                The staff roster is currently empty. You can test filling and submitting this form, or open Staff &amp; User Authority to create staff login accounts.
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActiveView('USERS')}
            className="px-4 py-2 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-xs transition cursor-pointer shrink-0"
          >
            + Create Staff Accounts
          </button>
        </div>
      )}

      {/* Header Banner - Official CUCOM Crimson & White Branding */}
      <div className="bg-white dark:bg-[#111827] rounded-3xl shadow-xs border border-slate-200/90 dark:border-slate-800 overflow-hidden border-l-4 border-l-red-600 p-6 sm:p-7 transition-colors">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-red-700 dark:text-red-400 mb-1.5">
              <span className="flex items-center justify-center w-5 h-5 rounded-md bg-red-600 text-white shadow-2xs">
                <Building className="w-3 h-3" />
              </span>
              <span>COMMONWEALTH UNIVERSITY COLLEGE OF MEDICINE • DAILY WORK REPORT</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white">
              {activeStaff.department}
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 flex items-center gap-2">
              <span>Submitter:</span>
              <strong className="text-slate-900 dark:text-slate-100 font-bold">{activeStaff.name}</strong>
              <span className="text-slate-400">•</span>
              <span>{activeStaff.designation}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Compliance Status Badge */}
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 px-3.5 py-2 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs shadow-2xs">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Status:</span>
              <span className={`font-black px-2.5 py-0.5 rounded-full text-[11px] uppercase tracking-wider ${
                report.complianceStatus === 'SUBMITTED ON TIME'
                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                  : report.complianceStatus === 'LATE'
                  ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                  : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
              }`}>
                {report.complianceStatus}
              </span>
            </div>

            <button
              type="button"
              onClick={() => exportReportToPDF(report)}
              className="px-4 py-2 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 border border-slate-300 dark:border-slate-700 shadow-2xs transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
              <span>Export PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Success Callout if just submitted or already submitted */}
      {(justSubmitted || isAlreadySubmitted) && (
        <div className="p-4 sm:p-5 rounded-3xl bg-emerald-50/90 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Check className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="font-bold text-sm text-emerald-900 dark:text-emerald-200">
                Daily Report Submitted Successfully!
              </div>
              <div className="text-emerald-700 dark:text-emerald-400 text-[11px] mt-0.5">
                Logged at <strong className="font-bold">{report.submissionTime || 'Confirmed'}</strong> on {report.date} • Compliance: <strong className="font-bold">{report.complianceStatus}</strong> • Synchronized to central database.
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => exportReportToPDF(report)}
            className="self-start sm:self-center px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs cursor-pointer shrink-0"
          >
            Download PDF Copy
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SUBMITTER PROFILE & REPORT DATE - FIXED IDENTITY */}
        <div className="bg-white dark:bg-[#111827] rounded-3xl shadow-xs border border-slate-200/90 dark:border-slate-800 overflow-hidden">
          <div className="px-6 py-3.5 bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
            <h2 className="font-extrabold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <User className="w-4 h-4 text-red-600 dark:text-red-400" />
              <span>Submitter Profile & Report Date</span>
            </h2>
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1 rounded-full shadow-2xs">
              <Lock className="w-3 h-3 text-red-600 dark:text-red-400" />
              <span>Fixed to Submitter Account</span>
            </div>
          </div>

          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 text-xs">
            {/* Submitter Name */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5 flex items-center justify-between">
                <span>Submitter Name</span>
                <span className="text-[10px] text-red-700 dark:text-red-400 font-extrabold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Verified Submitter</span>
                </span>
              </label>

              {isAdmin ? (
                <select
                  value={activeStaff.id}
                  onChange={e => {
                    const staff = staffList.find(s => s.id === e.target.value);
                    if (staff) setCurrentStaff(staff);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:outline-none shadow-2xs cursor-pointer"
                >
                  {staffList.map(s => (
                    <option key={s.id} value={s.id}>
                      #{s.sNo} {s.name} ({s.department})
                    </option>
                  ))}
                </select>
              ) : (
                <div className="relative">
                  <input
                    type="text"
                    readOnly
                    value={activeStaff.name}
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/90 font-black text-slate-900 dark:text-white cursor-not-allowed shadow-2xs"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                </div>
              )}
            </div>

            {/* Department */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                Department / Unit
              </label>
              <input
                type="text"
                readOnly
                value={activeStaff.department}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 font-bold text-slate-700 dark:text-slate-300 cursor-not-allowed shadow-2xs"
              />
            </div>

            {/* Designation */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                Designation / Role
              </label>
              <input
                type="text"
                readOnly
                value={activeStaff.designation}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 font-medium text-slate-700 dark:text-slate-300 cursor-not-allowed shadow-2xs"
              />
            </div>

            {/* Report Date */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                <span>Report Date</span>
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:outline-none shadow-2xs cursor-pointer"
              />
            </div>

            {/* Daily Submission Deadline */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                <span>Daily Submission Deadline</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={report.submissionTime ? `Submitted at ${report.submissionTime}` : 'Pending Submission'}
                  className="flex-1 px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 font-mono text-xs font-bold text-slate-800 dark:text-slate-200"
                />
                <span className="px-3.5 py-2.5 rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 font-black text-xs border border-red-200 dark:border-red-900 shrink-0">
                  {deadlineFormatted}
                </span>
              </div>
            </div>

            {/* Priority Level */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                Shift Priority
              </label>
              <div className="flex items-center gap-2">
                {(['Normal', 'Urgent'] as PriorityLevel[]).map(prio => (
                  <button
                    key={prio}
                    type="button"
                    onClick={() => setReport(prev => ({ ...prev, priority: prio }))}
                    className={`flex-1 py-2.5 rounded-2xl font-bold text-xs border transition cursor-pointer ${
                      report.priority === prio
                        ? prio === 'Urgent'
                          ? 'bg-rose-600 text-white border-rose-700 shadow-xs'
                          : 'bg-gradient-to-r from-red-600 to-rose-600 text-white border-red-700 shadow-xs'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    {prio}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 1. WHAT WORK DID YOU DO TODAY? (PRIMARY WORK SUMMARY) */}
        <div className="bg-white dark:bg-[#111827] rounded-3xl shadow-xs border border-slate-200/90 dark:border-slate-800 border-l-4 border-l-red-600 overflow-hidden">
          <div className="px-6 py-4 bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-200/80 dark:border-slate-800">
            <h2 className="font-extrabold text-sm uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-red-600 dark:text-red-400" />
              <span>1. What Work Did You Do Today? (Daily Work Summary)</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Provide a clear, high-level summary of the core duties and responsibilities you carried out today.
            </p>
          </div>
          <div className="p-6">
            <textarea
              rows={4}
              required
              value={report.workDoneSummary || ''}
              onChange={e => setReport(prev => ({ ...prev, workDoneSummary: e.target.value }))}
              placeholder="Describe in detail what work you did today during your working hours (e.g. Conducted morning lab setup, processed 14 student registration dossiers, verified clinical records, balanced cash receipts, etc.)..."
              className="w-full px-4 py-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:outline-none leading-relaxed resize-none shadow-2xs"
            />
          </div>
        </div>

        {/* 2. WHAT ACTIVITIES HAVE BEEN PERFORMED TODAY? */}
        <div className="bg-white dark:bg-[#111827] rounded-3xl shadow-xs border border-slate-200/90 dark:border-slate-800 border-l-4 border-l-red-600 overflow-hidden">
          <div className="px-6 py-4 bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-200/80 dark:border-slate-800">
            <h2 className="font-extrabold text-sm uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
              <ListChecks className="w-4 h-4 text-red-600 dark:text-red-400" />
              <span>2. What Activities Have Been Performed Today?</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Detail specific tasks, classes, services, administrative actions, or operations performed today.
            </p>
          </div>

          <div className="p-6">
            <textarea
              rows={4}
              required
              value={report.activitiesPerformed || ''}
              onChange={e => setReport(prev => ({ ...prev, activitiesPerformed: e.target.value }))}
              placeholder="List specific activity details or bullet points (e.g. 1. Conducted 3 laboratory sessions; 2. Processed 14 student dossiers; 3. Sanitized clinical training wards; 4. Coordinated exam schedules)..."
              className="w-full px-4 py-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:outline-none leading-relaxed resize-none shadow-2xs"
            />
          </div>
        </div>

        {/* 3. WERE THERE ANY ISSUES HELD TODAY? */}
        <div className="bg-white dark:bg-[#111827] rounded-3xl shadow-xs border border-slate-200/90 dark:border-slate-800 border-l-4 border-l-amber-500 overflow-hidden">
          <div className="px-6 py-4 bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="font-extrabold text-sm uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>3. Were There Any Issues or Problems Held Today?</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Record bottlenecks, equipment delays, shortages, complaints, or unresolved operational matters.
              </p>
            </div>
            
            <div className="flex items-center gap-1.5 text-xs font-bold">
              <button
                type="button"
                onClick={() => setReport(prev => ({ 
                  ...prev, 
                  issuesHeld: prev.issuesHeld === 'None' || !prev.issuesHeld ? '' : prev.issuesHeld,
                  challengeBlocker: prev.challengeBlocker === 'No issues held' ? '' : prev.challengeBlocker
                }))}
                className={`px-3 py-1.5 rounded-xl border transition cursor-pointer ${
                  report.issuesHeld && report.issuesHeld !== 'None'
                    ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                Issues Held
              </button>
              <button
                type="button"
                onClick={() => setReport(prev => ({ 
                  ...prev, 
                  issuesHeld: 'None - Operations ran smoothly with no issues held.',
                  challengeBlocker: 'No issues held'
                }))}
                className={`px-3 py-1.5 rounded-xl border transition cursor-pointer ${
                  report.issuesHeld?.startsWith('None')
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                No Issues Held
              </button>
            </div>
          </div>
          <div className="p-6">
            <textarea
              rows={3}
              value={report.issuesHeld || report.challengeBlocker || ''}
              onChange={e => setReport(prev => ({ 
                ...prev, 
                issuesHeld: e.target.value,
                challengeBlocker: e.target.value
              }))}
              placeholder="State any issues held today: What was delayed or blocked, equipment problems, missing resources, student issues, or unresolved situations..."
              className="w-full px-4 py-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none leading-relaxed resize-none shadow-2xs"
            />
          </div>
        </div>

        {/* 4. HOW MUCH CASH / REVENUE WAS GENERATED & COLLECTED TODAY? */}
        <div className="bg-white dark:bg-[#111827] rounded-3xl shadow-xs border border-slate-200/90 dark:border-slate-800 border-l-4 border-l-emerald-600 overflow-hidden">
          <div className="px-6 py-4 bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-extrabold text-sm uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>4. Cash / Revenue Generated &amp; Collected Today</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Record exact cash receipts, tuition deposits, service fees, or fines collected today (or $0.00 / N/A).
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setReport(prev => ({ ...prev, cashCollected: '$0.00 (No cash handling role)' }))}
                className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold transition border border-slate-200 dark:border-slate-700 cursor-pointer"
              >
                $0.00 / N/A
              </button>
            </div>
          </div>

          <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="sm:col-span-1">
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5 flex items-center gap-1">
                <span>Amount Collected ($):</span>
              </label>
              <div className="relative">
                <DollarSign className="w-4 h-4 text-emerald-600 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={report.cashCollected || ''}
                  onChange={e => setReport(prev => ({ ...prev, cashCollected: e.target.value }))}
                  placeholder="e.g. $0.00 or $1,250.00"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                Collection Source &amp; Receipt Breakdown:
              </label>
              <input
                type="text"
                value={report.supportDetails?.startsWith('Cash Source:') ? report.supportDetails.replace('Cash Source: ', '') : ''}
                onChange={e => setReport(prev => ({ ...prev, supportDetails: `Cash Source: ${e.target.value}` }))}
                placeholder="e.g. 2 Student tuition deposits, library late fines, transcript charges, or N/A..."
                className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 shadow-2xs"
              />
            </div>
          </div>
        </div>

        {/* 5. UNUSUAL, EXTRA OR UNWANTED ACTIVITIES / INCIDENTS */}
        <div className={`rounded-3xl shadow-xs border overflow-hidden transition-all border-l-4 ${
          report.hasUnusualActivities 
            ? 'bg-rose-50/30 dark:bg-rose-950/20 border-rose-300 dark:border-rose-900/60 border-l-rose-600' 
            : 'bg-white dark:bg-[#111827] border-slate-200/90 dark:border-slate-800 border-l-red-600'
        }`}>
          <div className="px-6 py-4 bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-extrabold text-sm uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldAlert className={`w-4 h-4 ${report.hasUnusualActivities ? 'text-rose-600' : 'text-red-600'}`} />
                <span>5. Unusual, Extra or Unwanted Activities / Incidents</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Report any unscheduled extra tasks, unwanted behavior, unauthorized occurrences, or emergency incidents.
              </p>
            </div>

            {/* Toggle */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setReport(prev => ({ 
                  ...prev, 
                  hasUnusualActivities: false,
                  unusualActivityType: '',
                  unusualActivitiesDetails: '' 
                }))}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                  !report.hasUnusualActivities
                    ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 shadow-2xs'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                <span>None (Normal Day)</span>
              </button>
              <button
                type="button"
                onClick={() => setReport(prev => ({ ...prev, hasUnusualActivities: true }))}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                  report.hasUnusualActivities
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Report Incident</span>
              </button>
            </div>
          </div>

          <div className="p-6 space-y-4 text-xs">
            {report.hasUnusualActivities ? (
              <>
                <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-900 dark:text-rose-200 font-bold flex items-center gap-2">
                  <Flame className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Unusual or Unwanted Incident Detected: Please provide specific details below for administrative review.</span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                    Category of Unusual / Unwanted Activity:
                  </label>
                  <select
                    value={report.unusualActivityType || 'Extra Unscheduled Duty'}
                    onChange={e => setReport(prev => ({ ...prev, unusualActivityType: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 shadow-2xs cursor-pointer"
                  >
                    <option value="Extra Unscheduled Duty">Extra Unscheduled Duty (Performed outside normal role)</option>
                    <option value="Unwanted Incident / Disciplinary Issue">Unwanted Incident / Disciplinary Issue</option>
                    <option value="Security or Safety Concern">Security, Safety or Health Concern</option>
                    <option value="Equipment Damage / Property Misuse">Equipment Damage or Facility Property Misuse</option>
                    <option value="Unauthorized Access / Visitor Issue">Unauthorized Access or Suspicious Visitor Request</option>
                    <option value="Emergency / Other Unusual Event">Emergency / Other Unusual Operational Event</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                    Detailed Incident Description &amp; Explanation:
                  </label>
                  <textarea
                    rows={4}
                    required={report.hasUnusualActivities}
                    value={report.unusualActivitiesDetails || ''}
                    onChange={e => setReport(prev => ({ ...prev, unusualActivitiesDetails: e.target.value }))}
                    placeholder="Provide full description: Exactly what occurred, time of occurrence, individuals involved, reason why this activity was unusual or unwanted, actions taken immediately, and recommendations for Executive Leadership..."
                    className="w-full px-4 py-3 rounded-2xl border border-rose-300 dark:border-rose-800 bg-white dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:outline-none leading-relaxed resize-none shadow-2xs"
                  />
                </div>
              </>
            ) : (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>No unwanted or unusual activities reported. All operations conducted strictly within standard university guidelines.</span>
              </div>
            )}
          </div>
        </div>

        {/* 6. TOP PRIORITY FOR TOMORROW */}
        <div className="bg-white dark:bg-[#111827] rounded-3xl shadow-xs border border-slate-200/90 dark:border-slate-800 border-l-4 border-l-slate-700 overflow-hidden">
          <div className="px-6 py-4 bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-200/80 dark:border-slate-800">
            <h2 className="font-extrabold text-sm uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
              <ArrowRight className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              <span>6. Top Priority / Planned Work for Tomorrow</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Specify the primary tasks, meetings, lectures, or deadlines you will focus on next working day.
            </p>
          </div>
          <div className="p-6">
            <textarea
              rows={3}
              value={report.priorityTomorrow || ''}
              onChange={e => setReport(prev => ({ ...prev, priorityTomorrow: e.target.value }))}
              placeholder="State the primary tasks, scheduled deliveries, meetings, or deadlines you will tackle tomorrow..."
              className="w-full px-4 py-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-500 focus:outline-none leading-relaxed resize-none shadow-2xs"
            />
          </div>
        </div>

        {/* 7. Executive Dean Review & Remarks */}
        <div className="bg-white dark:bg-[#111827] rounded-3xl shadow-xs border border-slate-200/90 dark:border-slate-800 overflow-hidden">
          <div className="px-6 py-3.5 bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-red-600 dark:text-red-400" />
              <span>Executive Dean &amp; Head Review Remarks</span>
            </div>
            <span className="text-[10px] font-bold text-slate-400">Institutional Feedback</span>
          </div>
          <div className="p-6">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300">
              {report.managerReview ? (
                <div>
                  <div className="font-bold text-slate-900 dark:text-white text-xs mb-1">
                    {report.reviewedBy || 'Office of Executive Dean'}:
                  </div>
                  <p className="italic leading-relaxed">"{report.managerReview}"</p>
                </div>
              ) : (
                <span className="text-slate-400 italic">
                  No manager review recorded yet. Submissions are reviewed daily by Executive Dean Syamala Bhupathi.
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Sticky Submit & Action Bar */}
        <div className="sticky bottom-4 z-20 p-4 sm:p-5 bg-white/95 dark:bg-[#111827]/95 backdrop-blur-md rounded-3xl shadow-xl shadow-slate-200/60 dark:shadow-black/60 border border-slate-200/90 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 transition-colors">
          <div className="flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-400 w-full sm:w-auto">
            <Clock className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
            <span>
              Daily Deadline: <strong className="text-slate-900 dark:text-white font-bold">{deadlineFormatted}</strong>. Centralized institutional compliance logging.
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleSaveDraft}
              className="flex-1 sm:flex-initial px-5 py-3 rounded-2xl border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-2xs"
            >
              <Save className="w-4 h-4" />
              <span>Save Draft</span>
            </button>

            <button
              type="submit"
              className="flex-1 sm:flex-initial px-8 py-3 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-700 hover:to-rose-800 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-red-600/30 transition cursor-pointer active:scale-[0.99]"
            >
              <Send className="w-4 h-4" />
              <span>{isAlreadySubmitted ? 'Update & Resubmit' : 'Submit Daily Report'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
