import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useCUCOM } from '../../context/CUCOMContext';
import {
  Mail,
  Send,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Clock,
  Search,
  Filter,
  User,
  Building2,
  Calendar,
  ExternalLink,
  ShieldCheck,
  Check,
  X,
  Sparkles,
  Inbox,
  ArrowRight,
  ChevronRight
} from 'lucide-react';

interface ReminderLogItem {
  id: number;
  user_id: string;
  user_name: string;
  email: string | null;
  report_date: string;
  reminder_type: string;
  status: 'SUCCESS' | 'FAILED' | 'SKIPPED' | 'MISSING_EMAIL';
  sent_at: string;
  provider_response?: string | null;
  error_message?: string | null;
}

interface ManagerStatusOverview {
  userId: string;
  staffId: string;
  name: string;
  email: string | null;
  department: string;
  designation: string;
  date: string;
  reportSubmitted: boolean;
  reportDetails?: {
    complianceStatus: string;
    submissionTime?: string;
    overallStatus?: string;
  } | null;
  reminderStatus: 'SUCCESS' | 'FAILED' | 'SKIPPED' | 'MISSING_EMAIL' | 'NOT_SENT' | 'NOT_NEEDED';
  sentAt?: string | null;
  errorMessage?: string | null;
}

interface SummaryMetrics {
  totalRequired: number;
  submittedCount: number;
  pendingCount: number;
  remindersSent: number;
  remindersFailed: number;
  missingEmailCount: number;
}

type FilterTab = 'ALL' | 'TODAY' | 'PENDING' | 'SENT' | 'FAILED' | 'MISSING_EMAIL';

export const AdminRemindersView: React.FC = () => {
  const { selectedDate, setSelectedDate, deadlineFormatted, staffList, reports } = useCUCOM();

  const [overview, setOverview] = useState<ManagerStatusOverview[]>([]);
  const [logs, setLogs] = useState<ReminderLogItem[]>([]);
  const [metrics, setMetrics] = useState<SummaryMetrics>(() => ({
    totalRequired: staffList.length,
    submittedCount: 0,
    pendingCount: staffList.length,
    remindersSent: 0,
    remindersFailed: 0,
    missingEmailCount: 0,
  }));

  // Fallback to live client context data if backend API is empty or offline
  const activeOverview: ManagerStatusOverview[] = useMemo(() => {
    if (overview.length > 0) return overview;
    return staffList.map(s => {
      const rep = reports.find(r => r.staffId === s.id && r.date === selectedDate && !r.isDraft);
      return {
        userId: s.id,
        staffId: s.id,
        name: s.name,
        email: s.email || null,
        department: s.department,
        designation: s.designation,
        date: selectedDate,
        reportSubmitted: Boolean(rep),
        reportDetails: rep ? {
          complianceStatus: rep.complianceStatus,
          submissionTime: rep.submissionTime,
          overallStatus: rep.overallStatus
        } : null,
        reminderStatus: rep ? ('NOT_NEEDED' as const) : (!s.email ? ('MISSING_EMAIL' as const) : ('NOT_SENT' as const))
      };
    });
  }, [overview, staffList, reports, selectedDate]);

  const activeMetrics: SummaryMetrics = useMemo(() => {
    if (overview.length > 0) return metrics;
    const submitted = activeOverview.filter(o => o.reportSubmitted).length;
    const pending = activeOverview.filter(o => !o.reportSubmitted).length;
    const missing = activeOverview.filter(o => !o.email).length;
    return {
      totalRequired: staffList.length,
      submittedCount: submitted,
      pendingCount: pending,
      remindersSent: 0,
      remindersFailed: 0,
      missingEmailCount: missing,
    };
  }, [overview, metrics, activeOverview, staffList.length]);

  const [activeFilter, setActiveFilter] = useState<FilterTab>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTriggering, setIsTriggering] = useState(false);
  const [triggerResult, setTriggerResult] = useState<{
    message: string;
    summary?: any;
    timestamp: string;
  } | null>(null);
  const [viewMode, setViewMode] = useState<'OVERVIEW' | 'LOGS'>('OVERVIEW');

  // Fetch reminders overview & logs from backend API
  const fetchRemindersData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/reminders?date=${selectedDate}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setOverview(data.overview || []);
          setLogs(data.logs || []);
          if (data.metrics) {
            setMetrics(data.metrics);
          }
        }
      } else {
        console.warn('Backend /api/reminders not reachable yet, will retry');
      }
    } catch (err) {
      console.warn('Error fetching reminders from API:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchRemindersData();
  }, [fetchRemindersData]);

  // Admin Manual Trigger: "Run Reminder Check Now"
  const handleTriggerReminders = async (forceResend: boolean = false) => {
    setIsTriggering(true);
    setTriggerResult(null);
    try {
      const res = await fetch('/api/reminders/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: selectedDate,
          forceResend
        })
      });

      if (res.ok) {
        const data = await res.json();
        setTriggerResult({
          message: data.message || 'Reminder check executed successfully',
          summary: data.summary,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        });
        // Refresh table
        await fetchRemindersData();
      } else {
        const errData = await res.json().catch(() => ({}));
        setTriggerResult({
          message: `Error: ${errData.error || 'Failed to trigger reminder check'}`,
          timestamp: new Date().toLocaleTimeString()
        });
      }
    } catch (err: any) {
      setTriggerResult({
        message: `Network Error: ${err.message || 'Unable to connect to backend server'}`,
        timestamp: new Date().toLocaleTimeString()
      });
    } finally {
      setIsTriggering(false);
    }
  };

  // Filtered managers for Overview Table
  const filteredOverview = useMemo(() => {
    return activeOverview.filter(item => {
      // Search matching
      const matchesSearch =
        searchQuery === '' ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.email && item.email.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      // Filter tabs
      switch (activeFilter) {
        case 'PENDING':
          return !item.reportSubmitted;
        case 'SENT':
          return item.reminderStatus === 'SUCCESS';
        case 'FAILED':
          return item.reminderStatus === 'FAILED';
        case 'MISSING_EMAIL':
          return item.reminderStatus === 'MISSING_EMAIL' || !item.email;
        case 'TODAY':
        case 'ALL':
        default:
          return true;
      }
    });
  }, [activeOverview, activeFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* 1. OFFICIAL BRAND HEADER WITH BADGE & MANUAL TRIGGER */}
      <div className="bg-white dark:bg-[#111827] rounded-3xl p-6 sm:p-7 shadow-xs border border-slate-200/80 dark:border-slate-800 transition-colors">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/60 text-xs font-semibold text-[#C60003] dark:text-red-400">
              <Mail className="w-3.5 h-3.5" />
              <span>Automated Background Service • node-cron (6:00 PM Daily)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Daily Report Email Reminders
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
              Real-time monitoring and background notification dispatcher. Automatically audits all 14 authorized Department Managers against the central database and delivers urgent email reminders for pending submissions.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => fetchRemindersData()}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-sm transition-all shadow-2xs active:scale-95 disabled:opacity-50"
              title="Refresh database records"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#C60003]' : ''}`} />
              <span>Refresh</span>
            </button>

            <button
              onClick={() => handleTriggerReminders(false)}
              disabled={isTriggering}
              className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-2xl bg-[#C60003] hover:bg-[#a50002] active:scale-95 text-white font-bold text-sm shadow-md shadow-red-600/20 transition-all disabled:opacity-50 cursor-pointer"
            >
              <Send className={`w-4 h-4 ${isTriggering ? 'animate-pulse' : ''}`} />
              <span>{isTriggering ? 'Checking Submissions...' : 'Run Reminder Check Now'}</span>
            </button>
          </div>
        </div>

        {/* Real-time Trigger Feedback Banner */}
        {triggerResult && (
          <div className="mt-5 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm animate-fadeIn">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center text-emerald-700 dark:text-emerald-300 shrink-0">
                <Check className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold">{triggerResult.message}</p>
                {triggerResult.summary && (
                  <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">
                    Evaluated: <strong>{triggerResult.summary.totalRequired}</strong> managers | 
                    Submitted: <strong>{triggerResult.summary.submittedCount}</strong> | 
                    Pending: <strong>{triggerResult.summary.pendingCount}</strong> | 
                    Dispatched: <strong>{triggerResult.summary.remindersSent}</strong> | 
                    Skipped: <strong>{triggerResult.summary.remindersSkipped}</strong>
                  </p>
                )}
              </div>
            </div>
            <div className="text-xs text-emerald-600 dark:text-emerald-400 font-mono">
              Executed at {triggerResult.timestamp}
            </div>
          </div>
        )}
      </div>

      {/* 2. STATISTIC METRIC CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Total Managers */}
        <div className="bg-white dark:bg-[#111827] rounded-3xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Required Staff</span>
            <User className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            {activeMetrics.totalRequired}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Institutional Roster</p>
        </div>

        {/* Submitted */}
        <div className="bg-white dark:bg-[#111827] rounded-3xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Reports Submitted</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
            {activeMetrics.submittedCount}
          </div>
          <p className="text-[11px] text-emerald-700 dark:text-emerald-500 mt-1">
            {activeMetrics.totalRequired > 0 ? Math.round((activeMetrics.submittedCount / activeMetrics.totalRequired) * 100) : 0}% submission rate
          </p>
        </div>

        {/* Pending Reports */}
        <div className="bg-white dark:bg-[#111827] rounded-3xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Pending Reports</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400">
            {activeMetrics.pendingCount}
          </div>
          <p className="text-[11px] text-amber-700 dark:text-amber-500 mt-1">
            Deadline: {deadlineFormatted}
          </p>
        </div>

        {/* Emails Sent */}
        <div className="bg-white dark:bg-[#111827] rounded-3xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Reminders Sent</span>
            <Send className="w-4 h-4 text-[#C60003]" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#C60003] dark:text-red-400">
            {activeMetrics.remindersSent}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Unique daily dispatches</p>
        </div>

        {/* Delivery Issues */}
        <div className="bg-white dark:bg-[#111827] rounded-3xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Delivery Issues</span>
            <AlertCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            {activeMetrics.remindersFailed + activeMetrics.missingEmailCount}
          </div>
          <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1">
            {activeMetrics.missingEmailCount} missing emails, {activeMetrics.remindersFailed} failed
          </p>
        </div>
      </div>

      {/* 3. FILTERS, SEARCH & DATE SELECTOR BAR */}
      <div className="bg-white dark:bg-[#111827] rounded-3xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl">
            <button
              onClick={() => setActiveFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeFilter === 'ALL'
                  ? 'bg-white dark:bg-slate-700 text-[#C60003] dark:text-red-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              All Staff ({activeOverview.length})
            </button>
            <button
              onClick={() => setActiveFilter('PENDING')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeFilter === 'PENDING'
                  ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Pending Reports Only ({activeMetrics.pendingCount})
            </button>
            <button
              onClick={() => setActiveFilter('SENT')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeFilter === 'SENT'
                  ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Emails Sent ({activeMetrics.remindersSent})
            </button>
            <button
              onClick={() => setActiveFilter('FAILED')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeFilter === 'FAILED'
                  ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Failed ({activeMetrics.remindersFailed})
            </button>
          </div>

          {/* Date Selector & Search Box */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search staff, dept, email..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 4. MAIN STATUS TABLE: USER | EMAIL | REPORT DATE | REPORT STATUS | REMINDER STATUS | SENT AT */}
      <div className="bg-white dark:bg-[#111827] rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden transition-colors">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#C60003] animate-pulse"></div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Daily Submission & Reminder Status Matrix
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
              Date: {selectedDate}
            </span>
          </div>
          <span className="text-xs text-slate-500">
            Showing {filteredOverview.length} of {activeOverview.length} staff
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200/60 dark:border-slate-800">
              <tr>
                <th className="py-3.5 px-6">User Name & Department</th>
                <th className="py-3.5 px-6">Email Address</th>
                <th className="py-3.5 px-6">Report Date</th>
                <th className="py-3.5 px-6">Report Status</th>
                <th className="py-3.5 px-6">Reminder Status</th>
                <th className="py-3.5 px-6">Sent Timestamp</th>
                <th className="py-3.5 px-6 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {filteredOverview.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Inbox className="w-10 h-10 mx-auto mb-2 opacity-40 text-slate-400" />
                    <p className="font-semibold">No records matching current filter</p>
                    <p className="text-xs mt-1">Try switching filters or adjusting your search term.</p>
                  </td>
                </tr>
              ) : (
                filteredOverview.map(item => (
                  <tr
                    key={item.userId}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    {/* User Name & Department */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900/50 flex items-center justify-center font-bold text-[#C60003] dark:text-red-400 text-xs shrink-0">
                          {item.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">
                            {item.name}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              {item.department}
                            </span>
                            <span>•</span>
                            <span>{item.designation}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Email Address */}
                    <td className="py-4 px-6 text-xs font-mono">
                      {item.email ? (
                        <span className="text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/70 px-2.5 py-1 rounded-lg">
                          {item.email}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-md font-bold">
                          <AlertTriangle className="w-3 h-3" /> MISSING_EMAIL
                        </span>
                      )}
                    </td>

                    {/* Report Date */}
                    <td className="py-4 px-6 text-xs text-slate-600 dark:text-slate-400 font-mono">
                      {item.date}
                    </td>

                    {/* Report Status */}
                    <td className="py-4 px-6">
                      {item.reportSubmitted ? (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Submitted</span>
                          {item.reportDetails?.submissionTime && (
                            <span className="text-[10px] opacity-75 font-normal">
                              ({item.reportDetails.submissionTime})
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>Not Submitted</span>
                        </div>
                      )}
                    </td>

                    {/* Reminder Status */}
                    <td className="py-4 px-6">
                      {item.reminderStatus === 'SUCCESS' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200">
                          <Check className="w-3 h-3" /> Sent
                        </span>
                      )}
                      {item.reminderStatus === 'FAILED' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200">
                          <X className="w-3 h-3" /> Failed
                        </span>
                      )}
                      {item.reminderStatus === 'SKIPPED' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          Skipped
                        </span>
                      )}
                      {item.reminderStatus === 'MISSING_EMAIL' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200">
                          <AlertTriangle className="w-3 h-3" /> Missing Email
                        </span>
                      )}
                      {item.reminderStatus === 'NOT_SENT' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/60">
                          <Clock className="w-3 h-3" /> Scheduled 6:00 PM
                        </span>
                      )}
                      {item.reminderStatus === 'NOT_NEEDED' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
                          Not Needed (Submitted)
                        </span>
                      )}
                    </td>

                    {/* Sent Timestamp */}
                    <td className="py-4 px-6 text-xs text-slate-500 font-mono">
                      {item.sentAt ? (
                        <span>
                          {new Date(item.sentAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                            hour12: true
                          })}
                        </span>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-600">—</span>
                      )}
                    </td>

                    {/* Action / Details */}
                    <td className="py-4 px-6 text-right">
                      {item.errorMessage ? (
                        <span
                          className="text-xs text-rose-500 max-w-xs truncate inline-block cursor-help"
                          title={item.errorMessage}
                        >
                          {item.errorMessage}
                        </span>
                      ) : item.reportSubmitted ? (
                        <span className="text-xs text-emerald-600 font-bold">Verified in DB</span>
                      ) : (
                        <span className="text-xs text-slate-400">Pending Daily Run</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. EMAIL TEMPLATE & SCHEDULE DOCUMENTATION BOX */}
      <div className="bg-slate-50 dark:bg-[#111827]/70 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-2xl bg-red-100 dark:bg-red-950/50 flex items-center justify-center text-[#C60003] shrink-0">
            <Mail className="w-5 h-5" />
          </div>
          <div className="space-y-3 flex-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Official Institutional Email Template Specification
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              The automated service strictly enforces the university format. When dispatched, each email features the following guaranteed content:
            </p>

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 font-mono text-xs text-slate-700 dark:text-slate-300 space-y-2">
              <div className="text-slate-400">
                <strong>Subject:</strong> Daily Report Pending – [DATE]
              </div>
              <div className="border-t border-slate-100 dark:border-slate-800 pt-2 whitespace-pre-line">
                {`Hello [NAME],

This is a reminder that your Daily Report for today ([DATE]) has not been submitted yet.

Please submit your report as soon as possible.

Click here to submit: [PORTAL_URL]

Thank you.`}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6 text-xs text-slate-500 pt-1">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                Database Uniqueness Protection Active: <code>UNIQUE(user_id, report_date, reminder_type)</code>
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#C60003]" />
                Scheduled cron job: <code>0 18 * * *</code> (6:00 PM IST)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
