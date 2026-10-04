import { supabase } from './supabaseClient';
import { DailyReport } from '../types/cucom';

// BroadcastChannel for instant cross-tab / multi-window synchronization
let broadcastChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    broadcastChannel = new BroadcastChannel('cucom_live_reporting_channel');
  }
} catch (e) {
  console.warn('BroadcastChannel not supported', e);
}

export function broadcastReportUpdate(report: DailyReport) {
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage({ type: 'REPORT_UPDATED', report });
    } catch (e) {
      console.warn('Broadcast failed', e);
    }
  }
}

export function onBroadcastUpdate(callback: (report: DailyReport) => void) {
  if (!broadcastChannel) return () => {};
  const handler = (event: MessageEvent) => {
    if (event.data && event.data.type === 'REPORT_UPDATED' && event.data.report) {
      callback(event.data.report);
    }
  };
  broadcastChannel.addEventListener('message', handler);
  return () => broadcastChannel?.removeEventListener('message', handler);
}

// Convert DailyReport to Supabase row format
function toSupabaseRow(report: DailyReport) {
  return {
    id: report.id,
    user_id: `user-${report.staffId}`,
    staff_id: report.staffId,
    staff_name: report.staffName,
    department: report.department,
    designation: report.designation,
    date: report.date,
    submission_time: report.submissionTime,
    submission_timestamp: report.submissionTimestamp,
    deadline: report.deadline || '4:00 PM',
    compliance_status: report.complianceStatus,
    overall_status: report.overallStatus,
    priority: report.priority || 'Normal',
    work_done_summary: report.workDoneSummary || '',
    activities_performed: report.activitiesPerformed || '',
    issues_held: report.issuesHeld || '',
    cash_collected: report.cashCollected || '',
    has_unusual_activities: Boolean(report.hasUnusualActivities),
    unusual_activity_type: report.unusualActivityType || null,
    unusual_activities_details: report.unusualActivitiesDetails || '',
    key_achievements: report.keyAchievementsSummary || '',
    challenges: report.challengeBlocker || '',
    support_needed: Boolean(report.supportNeeded),
    support_details: report.supportDetails || '',
    priority_tomorrow: report.priorityTomorrow || '',
    manager_review: report.managerReview || '',
    reviewed_by: report.reviewedBy || '',
    reviewed_at: report.reviewedAt || '',
    is_draft: Boolean(report.isDraft),
    updated_at: report.updatedAt || new Date().toISOString()
  };
}

// Convert Supabase row to DailyReport format
export function fromSupabaseRow(row: any): DailyReport {
  return {
    id: row.id,
    staffId: row.staff_id || row.id?.split('_')[1] || row.user_id?.replace('user-', '') || '',
    staffName: row.staff_name,
    department: row.department,
    designation: row.designation,
    date: row.date,
    deadline: row.deadline || '4:00 PM',
    submissionTime: row.submission_time,
    submissionTimestamp: row.submission_timestamp,
    complianceStatus: row.compliance_status || 'On Time',
    overallStatus: row.overall_status || 'Completed',
    priority: row.priority || 'Normal',
    tasks: [],
    workDoneSummary: row.work_done_summary || '',
    activitiesPerformed: row.activities_performed || '',
    issuesHeld: row.issues_held || '',
    cashCollected: row.cash_collected || '',
    hasUnusualActivities: Boolean(row.has_unusual_activities),
    unusualActivityType: row.unusual_activity_type,
    unusualActivitiesDetails: row.unusual_activities_details || '',
    keyAchievementsSummary: row.key_achievements || '',
    challengeBlocker: row.challenges || '',
    supportNeeded: Boolean(row.support_needed),
    supportDetails: row.support_details || '',
    priorityTomorrow: row.priority_tomorrow || '',
    managerReview: row.manager_review || '',
    reviewedBy: row.reviewed_by || '',
    reviewedAt: row.reviewed_at || '',
    isDraft: Boolean(row.is_draft),
    updatedAt: row.updated_at
  };
}

// Cloud save to Supabase
export async function syncReportToCloud(report: DailyReport): Promise<boolean> {
  try {
    const row = toSupabaseRow(report);
    const { error } = await supabase.from('reports').upsert(row, { onConflict: 'id' });
    if (error) {
      console.warn('Supabase sync note (using local cache):', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase sync exception (using local cache):', err);
    return false;
  }
}

// Fetch all reports from Supabase
export async function fetchReportsFromSupabase(): Promise<DailyReport[]> {
  try {
    const { data, error } = await supabase.from('reports').select('*');
    if (error) {
      console.warn('Supabase fetch note (using local cache):', error.message);
      return [];
    }
    return (data || []).map(fromSupabaseRow);
  } catch (err) {
    console.warn('Supabase fetch exception:', err);
    return [];
  }
}

// Real-time Supabase Cloud listener
export function subscribeToCloudReports(onData: (reports: DailyReport[]) => void) {
  try {
    const channel = supabase
      .channel('public:reports')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reports' },
        async () => {
          const reports = await fetchReportsFromSupabase();
          if (reports.length > 0) {
            onData(reports);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  } catch (e) {
    console.warn('Supabase subscription error:', e);
    return () => {};
  }
}

// ==========================================
// User Account Cloud Sync (Admin Authority)
// ==========================================

export async function syncUserToCloud(user: any): Promise<boolean> {
  try {
    const row = {
      id: user.id,
      staff_id: user.staffId || user.id.replace('user-', ''),
      name: user.name,
      username: user.username,
      email: user.email,
      password: user.password || '123',
      department: user.department,
      designation: user.designation,
      is_manager: true,
      is_active: user.isActive !== false,
      created_at: user.createdAt || new Date().toISOString()
    };
    const { error } = await supabase.from('users').upsert(row, { onConflict: 'id' });
    if (error) {
      console.warn('Supabase user upsert note:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase user sync error:', err);
    return false;
  }
}

export async function fetchUsersFromCloud(): Promise<any[]> {
  try {
    const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: true });
    if (error) {
      console.warn('Supabase users fetch note:', error.message);
      return [];
    }
    return (data || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      username: row.username,
      role: 'STAFF',
      staffId: row.staff_id || row.id.replace('user-', ''),
      department: row.department,
      designation: row.designation,
      email: row.email,
      password: row.password || '123',
      isActive: row.is_active !== false,
      createdAt: row.created_at
    }));
  } catch (err) {
    console.warn('Supabase users fetch exception:', err);
    return [];
  }
}

export async function deleteUserFromCloud(userId: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('users').delete().eq('id', userId);
    if (error) {
      console.warn('Supabase user delete note:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase user delete error:', err);
    return false;
  }
}
