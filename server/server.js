import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { 
  initDatabase,
  getAllUsers, 
  getActiveRequiredUsers, 
  getAllReportsForDate, 
  getUserReportForDate, 
  upsertReport, 
  getReminderLogs 
} from './db.js';
import { runReminderCheckNow, startReminderCronJob, getTodayDateString } from './reminderCron.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Ensure database is initialized
initDatabase();

// 1. Health check & status
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    system: 'CUCOM Daily Report Backend & Email Reminder System',
    serverDate: getTodayDateString(),
    serverTimestamp: new Date().toISOString(),
    cronSchedule: process.env.REMINDER_CRON || '0 18 * * *',
    timezone: process.env.TIMEZONE || 'Asia/Kolkata',
    portalUrl: process.env.PORTAL_URL || 'http://localhost:3000'
  });
});

// 2. Users Endpoint (Active Managers required for daily reporting)
app.get('/api/users', (req, res) => {
  try {
    const requiredOnly = req.query.required === 'true';
    const users = requiredOnly ? getActiveRequiredUsers() : getAllUsers();
    res.json({ success: true, count: users.length, users });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Reports Endpoints
app.get('/api/reports', (req, res) => {
  try {
    const date = req.query.date || getTodayDateString();
    const reports = getAllReportsForDate(date);
    res.json({ success: true, date, count: reports.length, reports });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/reports', (req, res) => {
  try {
    const reportData = req.body;
    if (!reportData || !reportData.date) {
      return res.status(400).json({ success: false, error: 'Invalid report data: date is required' });
    }

    const reportId = upsertReport(reportData);
    console.log(`[API] Saved report: ${reportId} for staff: ${reportData.staffName} (${reportData.complianceStatus})`);
    
    res.json({ 
      success: true, 
      id: reportId, 
      message: 'Report saved successfully to central database' 
    });
  } catch (err) {
    console.error('[API] Error saving report:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Reminders Endpoints
app.get('/api/reminders', (req, res) => {
  try {
    const date = req.query.date || getTodayDateString();
    const status = req.query.status;
    const userId = req.query.userId;

    const logs = getReminderLogs({ date, status, userId });
    
    // Also build a comprehensive status overview for all active required managers
    const activeManagers = getActiveRequiredUsers();
    const reports = getAllReportsForDate(date);
    const reportsByStaff = new Map();
    reports.forEach(r => {
      // Map both user-staff-X and staff-X
      reportsByStaff.set(r.user_id, r);
      if (r.id) reportsByStaff.set(r.id.split('_')[1], r);
    });

    const logsByUser = new Map();
    logs.forEach(l => logsByUser.set(l.user_id, l));

    const overview = activeManagers.map(mgr => {
      const staffKey = mgr.staff_id || mgr.id.replace('user-', '');
      const report = reportsByStaff.get(mgr.id) || reportsByStaff.get(staffKey);
      const reminderLog = logsByUser.get(mgr.id);

      const hasSubmitted = report && (
        report.compliance_status === 'SUBMITTED ON TIME' || 
        report.compliance_status === 'LATE' ||
        (report.submission_time && report.submission_time.trim() !== '') ||
        (!report.is_draft && report.tasks_json)
      );

      return {
        userId: mgr.id,
        staffId: mgr.staff_id,
        name: mgr.name,
        email: mgr.email,
        department: mgr.department,
        designation: mgr.designation,
        date,
        reportSubmitted: !!hasSubmitted,
        reportDetails: report ? {
          complianceStatus: report.compliance_status,
          submissionTime: report.submission_time,
          overallStatus: report.overall_status
        } : null,
        reminderStatus: reminderLog ? reminderLog.status : (hasSubmitted ? 'NOT_NEEDED' : (!mgr.email ? 'MISSING_EMAIL' : 'NOT_SENT')),
        sentAt: reminderLog ? reminderLog.sent_at : null,
        errorMessage: reminderLog ? reminderLog.error_message : (!mgr.email ? 'No email registered' : null)
      };
    });

    const metrics = {
      totalRequired: activeManagers.length,
      submittedCount: overview.filter(o => o.reportSubmitted).length,
      pendingCount: overview.filter(o => !o.reportSubmitted).length,
      remindersSent: logs.filter(l => l.status === 'SUCCESS').length,
      remindersFailed: logs.filter(l => l.status === 'FAILED').length,
      missingEmailCount: activeManagers.filter(m => !m.email || m.email.trim() === '').length
    };

    res.json({
      success: true,
      date,
      metrics,
      overview,
      logs
    });
  } catch (err) {
    console.error('[API] Error getting reminders:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Manual Trigger for Admin: "Run Reminder Check Now"
app.post('/api/reminders/trigger', async (req, res) => {
  try {
    const { date, forceResend } = req.body || {};
    console.log(`[API] Admin triggered manual reminder check (date: ${date || 'today'}, force: ${!!forceResend})`);
    
    const summary = await runReminderCheckNow({ 
      date: date || null, 
      forceResend: !!forceResend 
    });

    res.json({
      success: true,
      message: 'Daily report submission check and reminder dispatch completed successfully',
      summary
    });
  } catch (err) {
    console.error('[API] Error running reminder trigger:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Admin Supabase User Provisioning
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseAdmin = (process.env.VITE_SUPABASE_URL || 'https://zvzjdmqlrxduapvqoeke.supabase.co') && process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createSupabaseClient(process.env.VITE_SUPABASE_URL || 'https://zvzjdmqlrxduapvqoeke.supabase.co', process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false }
    })
  : null;

app.post('/api/admin/create-user', async (req, res) => {
  try {
    const { name, username, email, password, department, designation, role } = req.body;
    if (!name || !username || !department) {
      return res.status(400).json({ success: false, error: 'Name, username, and department are required' });
    }

    if (!supabaseAdmin) {
      return res.status(500).json({ success: false, error: 'Supabase admin service key is not configured' });
    }

    const cleanEmail = email && email.includes('@') ? email.trim().toLowerCase() : `${username.trim().toLowerCase()}@cucom.edu.ag`;
    const cleanPass = password || 'Cocum@2026';

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: cleanEmail,
      password: cleanPass,
      email_confirm: true,
      user_metadata: {
        name,
        username,
        department,
        designation,
        role: role || 'STAFF'
      }
    });

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    // Upsert into profiles
    try {
      await supabaseAdmin.from('profiles').upsert({
        id: data.user.id,
        name,
        username,
        email: cleanEmail,
        role: role || 'STAFF',
        department,
        designation,
        staff_id: `staff-${data.user.id.substring(0, 6)}`,
        is_active: true
      }, { onConflict: 'id' });
    } catch (e) {
      console.warn('Profile upsert note (schema may not be run yet):', e.message);
    }

    res.json({
      success: true,
      user: {
        id: data.user.id,
        name,
        username,
        email: cleanEmail,
        department,
        designation,
        role: role || 'STAFF'
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Start Background Cron Scheduler
startReminderCronJob();

// Start Express Server
const server = app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`CUCOM Daily Reporting & Email Reminder Backend Server`);
  console.log(`Listening on http://localhost:${PORT}`);
  console.log(`Portal URL: ${process.env.PORTAL_URL || 'http://localhost:3000'}`);
  console.log(`Automated Check Schedule: ${process.env.REMINDER_CRON || '0 18 * * *'} (${process.env.TIMEZONE || 'Asia/Kolkata'})`);
  console.log(`=======================================================`);
});

export default app;
