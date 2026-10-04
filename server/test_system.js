import { 
  initDatabase, 
  getActiveRequiredUsers, 
  upsertReport, 
  getUserReportForDate, 
  getReminderLogs,
  getReminderForUserAndDate
} from './db.js';
import { runReminderCheckNow, getTodayDateString } from './reminderCron.js';
import { buildReminderEmailContent } from './emailService.js';

async function testSystem() {
  console.log('--- TEST 1: Database & User Seeding ---');
  initDatabase();
  const users = getActiveRequiredUsers();
  console.log(`Active required managers found: ${users.length} (Expected: 14)`);
  if (users.length !== 14) {
    throw new Error(`Expected 14 managers, got ${users.length}`);
  }
  console.log('Managers list:', users.map(u => `${u.name} (${u.department})`).join(', '));

  console.log('\n--- TEST 2: Email Content Verification ---');
  const emailContent = buildReminderEmailContent({
    name: 'Sharon Dowdy',
    date: '2026-10-04',
    portalUrl: 'http://localhost:3000'
  });
  console.log('Subject:', emailContent.subject);
  if (!emailContent.subject.includes('Daily Report Pending – 2026-10-04')) {
    throw new Error('Email subject mismatch');
  }
  if (!emailContent.plainText.includes('Hello Sharon Dowdy,') || !emailContent.plainText.includes('Click here to submit: http://localhost:3000')) {
    throw new Error('Email plain text body mismatch');
  }
  console.log('Email template text:\n', emailContent.plainText);

  console.log('\n--- TEST 3: Report Submission & Central DB Check ---');
  const testDate = getTodayDateString();
  
  // Submit a report for Karlene Mann (staff-2)
  const reportId = upsertReport({
    id: `${testDate}_staff-2`,
    staffId: 'staff-2',
    user_id: 'user-staff-2',
    staffName: 'Karlene Mann',
    department: 'Library',
    designation: 'Librarian / Head of Library',
    date: testDate,
    submissionTime: '03:45 PM',
    complianceStatus: 'SUBMITTED ON TIME',
    overallStatus: 'Done',
    tasks: [{ id: '1', kpi: 'Library Support', description: 'Assisted medical students', status: 'Done', kpiValue: '25' }],
    keyAchievementsSummary: 'Updated digital journal catalog',
    challengeBlocker: 'None',
    supportNeeded: false
  });
  console.log(`Saved report ${reportId} for Karlene Mann to central DB.`);

  const fetchedReport = getUserReportForDate('user-staff-2', testDate);
  if (!fetchedReport || fetchedReport.compliance_status !== 'SUBMITTED ON TIME') {
    throw new Error('Report lookup failed in central database');
  }
  console.log('Report successfully verified in central DB!');

  console.log('\n--- TEST 4: Running Reminder Engine (Pass 1) ---');
  const run1 = await runReminderCheckNow({ date: testDate });
  console.log(`Pass 1 Results:
  - Submitted: ${run1.submittedCount}
  - Pending: ${run1.pendingCount}
  - Reminders Sent: ${run1.remindersSent}
  - Reminders Skipped: ${run1.remindersSkipped}
  - Reminders Failed: ${run1.remindersFailed}`);

  // Karlene Mann should be SKIPPED because report is submitted
  const karleneDetail = run1.details.find(d => d.userId === 'user-staff-2');
  if (!karleneDetail || !karleneDetail.reportSubmitted || karleneDetail.reminderStatus !== 'SKIPPED') {
    throw new Error('Karlene Mann was not correctly skipped despite submitting report!');
  }
  console.log('Karlene Mann verified SKIPPED because report is submitted.');

  console.log('\n--- TEST 5: Duplicate Prevention Verification (Pass 2) ---');
  // Second pass on same day: All pending users who got an email in Pass 1 MUST now be SKIPPED!
  const run2 = await runReminderCheckNow({ date: testDate, forceResend: false });
  console.log(`Pass 2 Results:
  - Reminders Sent: ${run2.remindersSent} (MUST be 0)
  - Reminders Skipped: ${run2.remindersSkipped} (MUST include previously emailed users)`);

  if (run2.remindersSent !== 0) {
    throw new Error(`Duplicate prevention failed! ${run2.remindersSent} emails were sent on pass 2!`);
  }
  console.log('Duplicate prevention successfully verified! Zero duplicate emails sent.');

  console.log('\n--- ALL BACKEND TESTS PASSED! ---');
}

testSystem().catch(err => {
  console.error('Test Failed:', err);
  process.exit(1);
});
