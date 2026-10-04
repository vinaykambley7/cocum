import React, { useState } from 'react';
import { 
  BookOpen, 
  Copy, 
  Check, 
  Clock, 
  AlertTriangle, 
  FileText, 
  CheckCircle2, 
  ShieldAlert, 
  Users, 
  Building2,
  Calendar,
  Send
} from 'lucide-react';

export const StaffInstructionsView: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const announcementText = `Dear Team,

With immediate effect, CUCOM is implementing a Daily Reporting System for all faculty and staff. Every team member is required to submit a concise daily report covering work completed, current status, key achievements, challenges/blockers, support required, and priority tasks for the next working day.

The daily submission deadline is 5:00 PM. Reports submitted after 5:00 PM will be marked Late, and non-submissions will be automatically flagged on the management dashboard. Please report only activities relevant to your assigned role and responsibilities and use the designated status options: Done, In Progress, or Pending.

Thank you for your cooperation and commitment to operational excellence.

Executive Management & Dean's Office
Commonwealth University College of Medicine (CUCOM)`;

  const handleCopy = () => {
    navigator.clipboard.writeText(announcementText);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const steps = [
    {
      step: 1,
      item: 'Who must submit?',
      instruction: 'Every authorized Department Manager and academic unit lead listed in the institutional directory.',
      badge: '14 Department Heads'
    },
    {
      step: 2,
      item: 'Deadline',
      instruction: 'Submit the daily report by 5:00 PM every working day. Late and missing submissions are automatically flagged.',
      badge: '5:00 PM Daily'
    },
    {
      step: 3,
      item: 'What to report',
      instruction: 'Report only work within your assigned role/responsibilities. Do not include unrelated activities.',
      badge: 'Role-Specific'
    },
    {
      step: 4,
      item: 'How to complete',
      instruction: 'Use your role-specific template as a guide. Enter each meaningful task/activity as one row in the Daily Report sheet.',
      badge: '6 Core KPIs'
    },
    {
      step: 5,
      item: 'Status',
      instruction: 'Choose Done, In Progress, or Pending from the designated status options.',
      badge: 'Done / In Progress / Pending'
    },
    {
      step: 6,
      item: 'Achievements',
      instruction: 'Mention measurable outcomes, completed milestones, or important results in Key Achievements.',
      badge: 'Measurable Outcomes'
    },
    {
      step: 7,
      item: 'Challenges',
      instruction: 'Record blockers, delays, risks, or issues affecting completion in the Challenges box.',
      badge: 'Risk Mitigation'
    },
    {
      step: 8,
      item: 'Support Needed',
      instruction: 'State the specific decision, person, resource, or approval required from administration.',
      badge: 'Actionable Escalations'
    },
    {
      step: 9,
      item: 'Tomorrow',
      instruction: 'Mention the most important task(s) that must be completed during the next working day.',
      badge: 'Proactive Planning'
    },
    {
      step: 10,
      item: 'Submission time',
      instruction: 'Enter the actual date/time when your report is submitted; the system automatically compares it with the 5:00 PM deadline.',
      badge: 'Automatic Compliance'
    },
    {
      step: 11,
      item: 'Management review',
      instruction: 'Management can use the Dashboard to select a date and immediately see who submitted, who was late, and who missed reporting.',
      badge: 'Dean Audit'
    },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 font-sans">
      {/* Header Banner */}
      <div className="bg-white dark:bg-[#111827] rounded-3xl shadow-xs border border-slate-200/80 dark:border-slate-800 overflow-hidden border-l-4 border-l-red-600 p-6 sm:p-7">
        <div className="flex items-center gap-2 mb-1.5">
          <BookOpen className="w-5 h-5 text-red-600 dark:text-red-400" />
          <span className="text-xs text-red-700 dark:text-red-400 font-bold uppercase tracking-wider">
            STANDARD OPERATING PROCEDURES & POLICY
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white">
          CUCOM DAILY REPORTING SYSTEM – STAFF INSTRUCTIONS
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
          Institutional guidelines and operating procedures for daily submission compliance, reporting standards, and management audits.
        </p>
      </div>

      {/* READY-TO-SEND TEAM ANNOUNCEMENT CARD */}
      <div className="bg-white dark:bg-[#111827] rounded-3xl shadow-xs border border-slate-200/80 dark:border-slate-800 overflow-hidden">
        <div className="bg-red-50/70 dark:bg-red-950/40 px-6 py-3.5 border-b border-red-200/60 dark:border-red-800/60 text-red-950 dark:text-red-200 font-black text-xs uppercase tracking-wider flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Send className="w-4 h-4 text-red-700 dark:text-red-400" />
            <span>READY-TO-SEND TEAM ANNOUNCEMENT</span>
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-700 hover:to-rose-800 text-white font-bold text-xs transition shadow-xs cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied to Clipboard!' : 'Copy Announcement'}</span>
          </button>
        </div>

        <div className="p-6 bg-slate-50/40 dark:bg-slate-900/40 font-sans text-xs text-slate-800 dark:text-slate-200 leading-relaxed space-y-4">
          <div className="font-bold text-sm text-slate-900 dark:text-white">Dear Team,</div>
          <p>
            With immediate effect, <strong>CUCOM</strong> is implementing a <strong>Daily Reporting System</strong> for all faculty and staff. Every team member is required to submit a concise daily report covering work completed, current status, key achievements, challenges/blockers, support required, and priority tasks for the next working day.
          </p>
          <p className="p-3.5 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200 font-semibold">
            ⏰ <strong>The daily submission deadline is 5:00 PM.</strong> Reports submitted after 5:00 PM will be marked <strong>Late</strong>, and non-submissions will be automatically flagged on the management dashboard.
          </p>
          <p>
            Please report only activities relevant to your assigned role and responsibilities and use the designated status options: <strong>Done</strong>, <strong>In Progress</strong>, or <strong>Pending</strong>.
          </p>
          <div className="pt-2 text-slate-600 dark:text-slate-400 font-medium">
            Thank you for your cooperation and commitment to operational excellence.
            <div className="font-bold text-slate-900 dark:text-white mt-1">
              Executive Management & Dean's Office<br />
              Commonwealth University College of Medicine (CUCOM)
            </div>
          </div>
        </div>
      </div>

      {/* 11-STEP OPERATIONAL GUIDE TABLE (Exact Match with Page 545-546) */}
      <div className="bg-white dark:bg-[#111827] rounded-3xl shadow-xs border border-slate-200/80 dark:border-slate-800 overflow-hidden">
        <div className="bg-slate-50/70 dark:bg-slate-800/60 px-6 py-4 border-b border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>CUCOM Reporting Guidelines & Step-by-Step Instructions</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/90 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold uppercase text-[11px] border-b border-slate-200 dark:border-slate-800">
                <th className="py-3 px-4 w-14 text-center">Step</th>
                <th className="py-3 px-5 w-48">Item / Requirement</th>
                <th className="py-3 px-5">Standard Operating Procedure / Instruction</th>
                <th className="py-3 px-4 w-44 text-right">Standard Tag</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {steps.map(s => (
                <tr key={s.step} className="hover:bg-emerald-50/20 dark:hover:bg-emerald-950/20 transition">
                  <td className="py-3.5 px-4 text-center font-black text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-800/30">
                    {s.step}
                  </td>
                  <td className="py-3.5 px-5 font-bold text-slate-900 dark:text-white">
                    {s.item}
                  </td>
                  <td className="py-3.5 px-5 text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                    {s.instruction}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <span className="inline-block px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 font-bold text-[11px]">
                      {s.badge}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
