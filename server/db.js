import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'cucom_production.db');
export const db = new DatabaseSync(dbPath);

// Initialize Tables
export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      staff_id TEXT,
      name TEXT NOT NULL,
      username TEXT NOT NULL,
      email TEXT,
      department TEXT NOT NULL,
      designation TEXT NOT NULL,
      is_manager INTEGER DEFAULT 1,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS reports (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      staff_name TEXT NOT NULL,
      department TEXT NOT NULL,
      designation TEXT,
      date TEXT NOT NULL,
      deadline TEXT DEFAULT '4:00 PM',
      submission_time TEXT,
      submission_timestamp TEXT,
      compliance_status TEXT DEFAULT 'NOT SUBMITTED',
      overall_status TEXT DEFAULT 'Pending',
      work_done_summary TEXT,
      activities_performed TEXT,
      issues_held TEXT,
      cash_collected TEXT,
      has_unusual_activities INTEGER DEFAULT 0,
      unusual_activity_type TEXT,
      unusual_activities_details TEXT,
      tasks_json TEXT,
      key_achievements TEXT,
      challenges TEXT,
      support_needed INTEGER DEFAULT 0,
      support_details TEXT,
      manager_review TEXT,
      reviewed_by TEXT,
      reviewed_at TEXT,
      is_draft INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS reminder_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      user_name TEXT NOT NULL,
      email TEXT,
      report_date TEXT NOT NULL,
      reminder_type TEXT NOT NULL DEFAULT 'Daily Report Pending',
      status TEXT NOT NULL, -- 'SUCCESS', 'FAILED', 'SKIPPED', 'MISSING_EMAIL'
      sent_at TEXT NOT NULL,
      provider_response TEXT,
      error_message TEXT,
      CONSTRAINT unique_reminder UNIQUE (user_id, report_date, reminder_type)
    );

    CREATE INDEX IF NOT EXISTS idx_reports_user_date ON reports (user_id, date);
    CREATE INDEX IF NOT EXISTS idx_reports_date ON reports (date);
    CREATE INDEX IF NOT EXISTS idx_reminders_date ON reminder_logs (report_date);
  `);

  // Migrate any missing columns safely
  const reportCols = [
    'work_done_summary TEXT',
    'activities_performed TEXT',
    'issues_held TEXT',
    'cash_collected TEXT',
    'has_unusual_activities INTEGER DEFAULT 0',
    'unusual_activity_type TEXT',
    'unusual_activities_details TEXT'
  ];
  for (const col of reportCols) {
    try {
      db.exec(`ALTER TABLE reports ADD COLUMN ${col};`);
    } catch (e) {
      // Column already exists
    }
  }

  seedAuthorizedUsers();
}

// Seed the 14 Department Managers + Admin user + a test user with missing email for verification
function seedAuthorizedUsers() {
  const initialUsers = [
    {
      id: 'admin-1',
      staff_id: 'admin-1',
      name: "Executive Administration (Dean's Office)",
      username: 'admin',
      email: 'dean@cucom.edu.ag',
      department: 'Executive Leadership',
      designation: 'Executive Dean & Vice Chancellor',
      is_manager: 1,
      is_active: 1
    },
    { id: 'user-staff-1', staff_id: 'staff-1', name: 'Sharon Dowdy', username: 'sharon.dowdy', email: 'sharon.dowdy@cucom.edu.ag', department: 'Human Resources', designation: 'HR', is_manager: 1, is_active: 1 },
    { id: 'user-staff-2', staff_id: 'staff-2', name: 'Karlene Mann', username: 'karlene.mann', email: 'karlene.mann@cucom.edu.ag', department: 'Library', designation: 'Librarian', is_manager: 1, is_active: 1 },
    { id: 'user-staff-3', staff_id: 'staff-3', name: 'Beverley Francis', username: 'beverley.francis', email: 'beverley.francis@cucom.edu.ag', department: 'Registrar Administration', designation: 'Registrar Administration', is_manager: 1, is_active: 1 },
    { id: 'user-staff-4', staff_id: 'staff-4', name: 'Nakia Entien', username: 'nakia.entien', email: 'nakia.entien@cucom.edu.ag', department: 'Finance & Accounts', designation: 'Accountant', is_manager: 1, is_active: 1 },
    { id: 'user-staff-5', staff_id: 'staff-5', name: 'Alisia Daniel', username: 'alisia.daniel', email: 'alisia.daniel@cucom.edu.ag', department: 'Administration', designation: 'Admin Secretary', is_manager: 1, is_active: 1 },
    { id: 'user-staff-6', staff_id: 'staff-6', name: 'Venkata Raganath', username: 'venkata.raganath', email: 'venkata.raganath@cucom.edu.ag', department: 'Academic Registrar', designation: 'Registrar Academic', is_manager: 1, is_active: 1 },
    { id: 'user-staff-7', staff_id: 'staff-7', name: 'Laurentia Roberts', username: 'laurentia.roberts', email: 'laurentia.roberts@cucom.edu.ag', department: 'Housekeeping', designation: 'Janitor', is_manager: 1, is_active: 1 },
    { id: 'user-staff-8', staff_id: 'staff-8', name: 'Oliver', username: 'oliver', email: 'oliver.transport@cucom.edu.ag', department: 'Transport', designation: 'Van Driver', is_manager: 1, is_active: 1 },
    { id: 'user-staff-9', staff_id: 'staff-9', name: 'Gopi Anumula', username: 'gopi.anumula', email: 'gopi.anumula@cucom.edu.ag', department: 'IT', designation: 'IT Manager', is_manager: 1, is_active: 1 },
    { id: 'user-staff-10', staff_id: 'staff-10', name: 'M Vijay Kumar', username: 'm.vijaykumar', email: 'vijaykumar.welfare@cucom.edu.ag', department: 'Student Affairs', designation: 'Student Welfare', is_manager: 1, is_active: 1 },
    { id: 'user-staff-11', staff_id: 'staff-11', name: 'N Ngalakshmi', username: 'n.ngalakshmi', email: 'ngalakshmi.qa@cucom.edu.ag', department: 'Quality Assurance & Compliance', designation: 'Head of Quality Assurance and Compliance', is_manager: 1, is_active: 1 },
    { id: 'user-staff-12', staff_id: 'staff-12', name: 'Shaktivel K.M', username: 'shaktivel.km', email: 'shaktivel.km@cucom.edu.ag', department: 'Faculty - Basic Sciences', designation: 'Associate Professor of Anatomy and Histology', is_manager: 1, is_active: 1 },
    { id: 'user-staff-13', staff_id: 'staff-13', name: 'Syamala Bhupathi', username: 'syamala.bhupathi', email: 'syamala.dean@cucom.edu.ag', department: 'Dean & Academic Leadership', designation: 'Dean and Professor of Physiology', is_manager: 1, is_active: 1 },
    { id: 'user-staff-14', staff_id: 'staff-14', name: 'Sreevani Namani', username: 'sreevani.namani', email: 'sreevani.namani@cucom.edu.ag', department: 'Faculty - Basic Sciences', designation: 'Associate Professor of Biochemistry', is_manager: 1, is_active: 1 },
    { id: 'user-staff-15', staff_id: 'staff-15', name: 'Akash Patel', username: 'akash.patel', email: 'akash.patel@cucom.edu.ag', department: 'Faculty - Clinical/Pharmacology', designation: 'Professor of Clinical Medicine and Pharmacology', is_manager: 1, is_active: 1 },
    { id: 'user-staff-16', staff_id: 'staff-16', name: 'Antonia Goodman', username: 'antonia.goodman', email: 'antonia.goodman@cucom.edu.ag', department: 'Faculty - Basic Sciences', designation: 'Lecturer of Biostatistics', is_manager: 1, is_active: 1 },
    { id: 'user-staff-17', staff_id: 'staff-17', name: 'Getta Anantha Praveen', username: 'getta.praveen', email: 'getta.praveen@cucom.edu.ag', department: 'Faculty - Basic Sciences', designation: 'Lecturer of Microbiology', is_manager: 1, is_active: 1 },
    { id: 'user-staff-18', staff_id: 'staff-18', name: 'Sindhu Sekar', username: 'sindhu.sekar', email: 'sindhu.sekar@cucom.edu.ag', department: 'Faculty - Clinical/Pharmacology', designation: 'Lecturer of Pharmacology', is_manager: 1, is_active: 1 },
    { id: 'user-staff-19', staff_id: 'staff-19', name: 'Indumathi Ravi', username: 'indumathi.ravi', email: 'indumathi.ravi@cucom.edu.ag', department: 'Simulation Center', designation: 'Simulation Center', is_manager: 1, is_active: 1 },
    { id: 'user-staff-20', staff_id: 'staff-20', name: 'Dr Dev Thivari', username: 'dev.thivari', email: 'dev.thivari@cucom.edu.ag', department: 'Research & Pharmacology', designation: 'Assistant Professor – Pharmacology & Research Head', is_manager: 1, is_active: 1 },
    { id: 'user-staff-21', staff_id: 'staff-21', name: 'Dr Abraham', username: 'dr.abraham', email: 'dr.abraham@cucom.edu.ag', department: 'Faculty - Basic Sciences', designation: 'Lecturer of Anatomy', is_manager: 1, is_active: 1 },
    { id: 'user-staff-22', staff_id: 'staff-22', name: 'Tabitha', username: 'tabitha', email: 'tabitha.path@cucom.edu.ag', department: 'Faculty - Basic Sciences', designation: 'Lecturer of Pathology', is_manager: 1, is_active: 1 },
    { id: 'user-staff-23', staff_id: 'staff-23', name: 'Dr Mangal', username: 'dr.mangal', email: 'mangal.connect@cucom.edu.ag', department: 'CU Connect', designation: 'In-Charge – CU Connect', is_manager: 1, is_active: 1 },
    { id: 'user-staff-24', staff_id: 'staff-24', name: 'Sreenidhi Prakasah', username: 'sreenidhi.prakasah', email: 'sreenidhi.prakasah@cucom.edu.ag', department: 'Adjunct Faculty', designation: 'Adjunct Faculty of Community Medicine', is_manager: 1, is_active: 1 },
    { id: 'user-staff-25', staff_id: 'staff-25', name: 'Jyotsna N B', username: 'jyotsna.nb', email: 'jyotsna.nb@cucom.edu.ag', department: 'Adjunct Faculty', designation: 'Adjunct Faculty of Biochemistry', is_manager: 1, is_active: 1 }
  ];

  // Clean table & reseed
  db.exec('DELETE FROM users;');
  const insertStmt = db.prepare(`
    INSERT OR REPLACE INTO users (id, staff_id, name, username, email, department, designation, is_manager, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const u of initialUsers) {
    insertStmt.run(u.id, u.staff_id, u.name, u.username, u.email, u.department, u.designation, u.is_manager, u.is_active);
  }
}

// Database helper functions
export function getActiveRequiredUsers() {
  // Returns all active staff & faculty who are required to submit daily reports (excluding executive dean admin)
  const stmt = db.prepare(`
    SELECT * FROM users 
    WHERE is_active = 1 AND id != 'admin-1'
    ORDER BY department ASC, name ASC
  `);
  return stmt.all();
}

export function getAllUsers() {
  const stmt = db.prepare(`SELECT * FROM users ORDER BY department ASC`);
  return stmt.all();
}

export function getUserReportForDate(userIdOrStaffId, dateStr) {
  const stmt = db.prepare(`
    SELECT * FROM reports 
    WHERE (user_id = ? OR user_id = ? OR id = ?) AND date = ?
    LIMIT 1
  `);
  const fullId = `user-${userIdOrStaffId}`;
  const reportId = `${dateStr}_${userIdOrStaffId.replace('user-', '')}`;
  return stmt.get(userIdOrStaffId, fullId, reportId, dateStr);
}

export function getAllReportsForDate(dateStr) {
  const stmt = db.prepare(`SELECT * FROM reports WHERE date = ? ORDER BY submission_time ASC`);
  return stmt.all(dateStr);
}

export function upsertReport(reportData) {
  const now = new Date().toISOString();
  const id = reportData.id || `${reportData.date}_${reportData.staffId || reportData.user_id}`;
  const userId = reportData.user_id || `user-${reportData.staffId}`;

  const stmt = db.prepare(`
    INSERT INTO reports (
      id, user_id, staff_name, department, designation, date, deadline,
      submission_time, submission_timestamp, compliance_status, overall_status,
      work_done_summary, activities_performed, issues_held, cash_collected,
      has_unusual_activities, unusual_activity_type, unusual_activities_details,
      tasks_json, key_achievements, challenges, support_needed, support_details,
      manager_review, reviewed_by, reviewed_at, is_draft, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?
    )
    ON CONFLICT(id) DO UPDATE SET
      staff_name = excluded.staff_name,
      department = excluded.department,
      designation = excluded.designation,
      deadline = excluded.deadline,
      submission_time = excluded.submission_time,
      submission_timestamp = excluded.submission_timestamp,
      compliance_status = excluded.compliance_status,
      overall_status = excluded.overall_status,
      work_done_summary = excluded.work_done_summary,
      activities_performed = excluded.activities_performed,
      issues_held = excluded.issues_held,
      cash_collected = excluded.cash_collected,
      has_unusual_activities = excluded.has_unusual_activities,
      unusual_activity_type = excluded.unusual_activity_type,
      unusual_activities_details = excluded.unusual_activities_details,
      tasks_json = excluded.tasks_json,
      key_achievements = excluded.key_achievements,
      challenges = excluded.challenges,
      support_needed = excluded.support_needed,
      support_details = excluded.support_details,
      manager_review = excluded.manager_review,
      reviewed_by = excluded.reviewed_by,
      reviewed_at = excluded.reviewed_at,
      is_draft = excluded.is_draft,
      updated_at = excluded.updated_at
  `);

  stmt.run(
    id,
    userId,
    reportData.staffName || reportData.staff_name || '',
    reportData.department || '',
    reportData.designation || '',
    reportData.date,
    reportData.deadline || '4:00 PM',
    reportData.submissionTime || reportData.submission_time || null,
    reportData.submissionTimestamp || reportData.submission_timestamp || null,
    reportData.complianceStatus || reportData.compliance_status || 'NOT SUBMITTED',
    reportData.overallStatus || reportData.overall_status || 'Pending',
    reportData.workDoneSummary || reportData.work_done_summary || '',
    reportData.activitiesPerformed || reportData.activities_performed || '',
    reportData.issuesHeld || reportData.issues_held || '',
    reportData.cashCollected || reportData.cash_collected || '',
    reportData.hasUnusualActivities ? 1 : 0,
    reportData.unusualActivityType || reportData.unusual_activity_type || null,
    reportData.unusualActivitiesDetails || reportData.unusual_activities_details || '',
    typeof reportData.tasks === 'object' ? JSON.stringify(reportData.tasks) : (reportData.tasks_json || '[]'),
    reportData.keyAchievementsSummary || reportData.key_achievements || '',
    reportData.challengeBlocker || reportData.challenges || '',
    reportData.supportNeeded ? 1 : 0,
    reportData.supportDetails || reportData.support_details || '',
    reportData.managerReview || reportData.manager_review || null,
    reportData.reviewedBy || reportData.reviewed_by || null,
    reportData.reviewedAt || reportData.reviewed_at || null,
    reportData.isDraft ? 1 : 0,
    now
  );

  return id;
}

export function getReminderLogs(filters = {}) {
  let query = 'SELECT * FROM reminder_logs';
  const conditions = [];
  const params = [];

  if (filters.date) {
    conditions.push('report_date = ?');
    params.push(filters.date);
  }
  if (filters.status) {
    conditions.push('status = ?');
    params.push(filters.status);
  }
  if (filters.userId) {
    conditions.push('user_id = ?');
    params.push(filters.userId);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY sent_at DESC, id DESC';

  const stmt = db.prepare(query);
  return stmt.all(...params);
}

export function getReminderForUserAndDate(userId, reportDate, reminderType = 'Daily Report Pending') {
  const stmt = db.prepare(`
    SELECT * FROM reminder_logs 
    WHERE user_id = ? AND report_date = ? AND reminder_type = ?
    LIMIT 1
  `);
  return stmt.get(userId, reportDate, reminderType);
}

export function logReminderAttempt({
  userId,
  userName,
  email,
  reportDate,
  reminderType = 'Daily Report Pending',
  status,
  sentAt = new Date().toISOString(),
  providerResponse = null,
  errorMessage = null
}) {
  const stmt = db.prepare(`
    INSERT INTO reminder_logs (
      user_id, user_name, email, report_date, reminder_type, status, sent_at, provider_response, error_message
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id, report_date, reminder_type) DO UPDATE SET
      status = excluded.status,
      sent_at = excluded.sent_at,
      provider_response = excluded.provider_response,
      error_message = excluded.error_message
  `);

  stmt.run(
    userId,
    userName,
    email || null,
    reportDate,
    reminderType,
    status,
    sentAt,
    providerResponse ? (typeof providerResponse === 'string' ? providerResponse : JSON.stringify(providerResponse)) : null,
    errorMessage ? String(errorMessage) : null
  );
}

// Initialize on module load
initDatabase();
