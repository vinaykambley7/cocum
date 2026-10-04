import cron from 'node-cron';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { 
  getActiveRequiredUsers, 
  getUserReportForDate, 
  getReminderForUserAndDate, 
  logReminderAttempt,
  getReminderLogs
} from './db.js';
import { sendReminderEmail } from './emailService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

/**
 * Returns today's date in YYYY-MM-DD using configured timezone or local time
 */
export function getTodayDateString() {
  const timeZone = process.env.TIMEZONE || 'Asia/Kolkata';
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' });
    return formatter.format(new Date());
  } catch (e) {
    return new Date().toISOString().slice(0, 10);
  }
}

/**
 * Core Reminder Execution Engine
 * Evaluates all active required managers against the central database
 */
export async function runReminderCheckNow({ date = null, forceResend = false } = {}) {
  const checkDate = date || getTodayDateString();
  const portalUrl = process.env.PORTAL_URL || 'http://localhost:3000';
  console.log(`[ReminderEngine] Starting daily submission check for date: ${checkDate}`);

  const activeUsers = getActiveRequiredUsers();
  console.log(`[ReminderEngine] Found ${activeUsers.length} active required managers to evaluate.`);

  const summary = {
    checkDate,
    executedAt: new Date().toISOString(),
    totalRequired: activeUsers.length,
    submittedCount: 0,
    pendingCount: 0,
    remindersSent: 0,
    remindersSkipped: 0,
    remindersFailed: 0,
    missingEmailCount: 0,
    details: []
  };

  for (const user of activeUsers) {
    const userDetail = {
      userId: user.id,
      name: user.name,
      department: user.department,
      email: user.email,
      reportSubmitted: false,
      reminderStatus: 'PENDING',
      reason: ''
    };

    // 1. Check if user has an email configured
    if (!user.email || user.email.trim() === '') {
      console.warn(`[ReminderEngine] User ${user.name} (${user.id}) has MISSING_EMAIL.`);
      logReminderAttempt({
        userId: user.id,
        userName: user.name,
        email: null,
        reportDate: checkDate,
        reminderType: 'Daily Report Pending',
        status: 'MISSING_EMAIL',
        errorMessage: 'User account has no email address configured in the system.'
      });
      summary.missingEmailCount++;
      summary.pendingCount++;
      userDetail.reminderStatus = 'MISSING_EMAIL';
      userDetail.reason = 'No email address registered';
      summary.details.push(userDetail);
      continue;
    }

    // 2. Central Database Check: Has this user submitted a valid Daily Report for today?
    const existingReport = getUserReportForDate(user.id, checkDate);
    const isSubmitted = existingReport && 
      (existingReport.compliance_status === 'SUBMITTED ON TIME' || 
       existingReport.compliance_status === 'LATE' || 
       (existingReport.submission_time && existingReport.submission_time.trim() !== '') ||
       (!existingReport.is_draft && existingReport.tasks_json));

    if (isSubmitted) {
      // User HAS submitted today's report: Strictly SKIP, do NOT send email
      console.log(`[ReminderEngine] Report verified for ${user.name} (${user.department}) on ${checkDate}. Skipping email.`);
      summary.submittedCount++;
      userDetail.reportSubmitted = true;
      userDetail.reminderStatus = 'SKIPPED';
      userDetail.reason = 'Report already submitted in central database';
      summary.details.push(userDetail);
      continue;
    }

    // User has NOT submitted today's report
    summary.pendingCount++;
    userDetail.reportSubmitted = false;

    // 3. Duplicate Prevention Check: Was a reminder already sent today for this user?
    if (!forceResend) {
      const existingReminder = getReminderForUserAndDate(user.id, checkDate, 'Daily Report Pending');
      if (existingReminder && existingReminder.status === 'SUCCESS') {
        console.log(`[ReminderEngine] Reminder already dispatched today to ${user.email}. Skipping duplicate.`);
        summary.remindersSkipped++;
        userDetail.reminderStatus = 'SKIPPED';
        userDetail.reason = `Reminder already sent at ${existingReminder.sent_at}`;
        summary.details.push(userDetail);
        continue;
      }
    }

    // 4. Send Email Reminder
    try {
      console.log(`[ReminderEngine] Dispatching pending report reminder to ${user.name} <${user.email}>...`);
      const emailResult = await sendReminderEmail({
        to: user.email,
        name: user.name,
        date: checkDate,
        portalUrl
      });

      // 5. Log Success in Database
      logReminderAttempt({
        userId: user.id,
        userName: user.name,
        email: user.email,
        reportDate: checkDate,
        reminderType: 'Daily Report Pending',
        status: 'SUCCESS',
        providerResponse: {
          messageId: emailResult.messageId,
          mode: emailResult.mode,
          previewUrl: emailResult.previewUrl
        }
      });

      summary.remindersSent++;
      userDetail.reminderStatus = 'SUCCESS';
      userDetail.reason = `Dispatched successfully via ${emailResult.mode}`;
      if (emailResult.previewUrl) {
        userDetail.previewUrl = emailResult.previewUrl;
      }
    } catch (err) {
      console.error(`[ReminderEngine] Failed to dispatch email to ${user.email}:`, err.message);
      
      // Log Failure in Database
      logReminderAttempt({
        userId: user.id,
        userName: user.name,
        email: user.email,
        reportDate: checkDate,
        reminderType: 'Daily Report Pending',
        status: 'FAILED',
        errorMessage: err.message
      });

      summary.remindersFailed++;
      userDetail.reminderStatus = 'FAILED';
      userDetail.reason = `Dispatch error: ${err.message}`;
    }

    summary.details.push(userDetail);
  }

  console.log(`[ReminderEngine] Check finished: ${summary.submittedCount} submitted, ${summary.pendingCount} pending, ${summary.remindersSent} sent, ${summary.remindersFailed} failed.`);
  return summary;
}

/**
 * Initializes the background cron scheduler
 */
export function startReminderCronJob() {
  const cronExpression = process.env.REMINDER_CRON || '0 18 * * *'; // 6:00 PM every day
  const timezone = process.env.TIMEZONE || 'Asia/Kolkata';

  console.log(`[CronScheduler] Initializing background reminder cron job with expression: "${cronExpression}" (Timezone: ${timezone})`);

  if (!cron.validate(cronExpression)) {
    console.error(`[CronScheduler] Invalid cron expression: ${cronExpression}. Falling back to '0 18 * * *'.`);
  }

  const scheduledTask = cron.schedule(
    cronExpression,
    async () => {
      console.log(`[CronScheduler] Scheduled tick triggered at ${new Date().toISOString()}`);
      try {
        await runReminderCheckNow();
      } catch (cronErr) {
        console.error('[CronScheduler] Error during scheduled reminder execution:', cronErr);
      }
    },
    {
      timezone
    }
  );

  return scheduledTask;
}
