import { supabase } from './supabaseClient';
import { DailyReport, TaskEntry, ReportAttachment, UserAccount } from '../types/cucom';

// BroadcastChannel for instant cross-tab / multi-window synchronization on the same device
let broadcastChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    broadcastChannel = new BroadcastChannel('cucom_live_reporting_channel');
  }
} catch (e) {
  console.warn('BroadcastChannel not supported in this environment', e);
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
export function toSupabaseRow(report: DailyReport, authUserId?: string | null) {
  return {
    id: report.id,
    user_id: report.userId || authUserId || null,
    staff_id: report.staffId,
    staff_name: report.staffName,
    department: report.department,
    designation: report.designation,
    date: report.date,
    submission_time: report.submissionTime || null,
    submission_timestamp: report.submissionTimestamp || null,
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
    reviewed_at: report.reviewedAt || null,
    is_draft: Boolean(report.isDraft),
    tasks: report.tasks || [],
    attachments: report.attachments || [],
    updated_at: report.updatedAt || new Date().toISOString()
  };
}

// Convert Supabase row to DailyReport format
export function fromSupabaseRow(row: any): DailyReport {
  let parsedTasks: TaskEntry[] = [];
  if (row.tasks) {
    if (typeof row.tasks === 'string') {
      try {
        parsedTasks = JSON.parse(row.tasks);
      } catch (e) {
        parsedTasks = [];
      }
    } else if (Array.isArray(row.tasks)) {
      parsedTasks = row.tasks;
    }
  }

  let parsedAttachments: ReportAttachment[] = [];
  if (row.attachments) {
    if (typeof row.attachments === 'string') {
      try {
        parsedAttachments = JSON.parse(row.attachments);
      } catch (e) {
        parsedAttachments = [];
      }
    } else if (Array.isArray(row.attachments)) {
      parsedAttachments = row.attachments;
    }
  }

  return {
    id: row.id,
    userId: row.user_id,
    staffId: row.staff_id || row.id?.split('_')[1] || row.user_id?.replace('user-', '') || '',
    staffName: row.staff_name,
    department: row.department,
    designation: row.designation,
    date: typeof row.date === 'string' ? row.date.slice(0, 10) : new Date(row.date).toISOString().slice(0, 10),
    deadline: row.deadline || '4:00 PM',
    submissionTime: row.submission_time,
    submissionTimestamp: row.submission_timestamp,
    complianceStatus: row.compliance_status || 'NOT SUBMITTED',
    overallStatus: row.overall_status || 'Completed',
    priority: row.priority || 'Normal',
    tasks: parsedTasks,
    attachments: parsedAttachments,
    workDoneSummary: row.work_done_summary || '',
    activitiesPerformed: row.activities_performed || '',
    issuesHeld: row.issues_held || '',
    cashCollected: row.cash_collected || '',
    hasUnusualActivities: Boolean(row.has_unusual_activities),
    unusualActivityType: row.unusual_activity_type || '',
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
    updatedAt: row.updated_at || new Date().toISOString()
  };
}

// Cloud save to Supabase
export async function syncReportToCloud(
  report: DailyReport, 
  authUserId?: string | null
): Promise<{ success: boolean; error?: string }> {
  try {
    const row = toSupabaseRow(report, authUserId);
    const { error } = await supabase.from('reports').upsert(row, { onConflict: 'id' });
    if (error) {
      console.error('[Supabase Cloud Sync Error]:', error.message, error.details);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    console.error('[Supabase Cloud Sync Exception]:', err);
    return { success: false, error: err?.message || 'Network exception saving report' };
  }
}

// Fetch all reports accessible to current user from Supabase
export async function fetchReportsFromSupabase(): Promise<{ success: boolean; reports: DailyReport[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      console.warn('[Supabase Fetch Note]:', error.message);
      return { success: false, reports: [], error: error.message };
    }

    const mapped = (data || []).map(fromSupabaseRow);
    return { success: true, reports: mapped };
  } catch (err: any) {
    console.warn('[Supabase Fetch Exception]:', err);
    return { success: false, reports: [], error: err?.message || 'Connection failure' };
  }
}

// Delete report from Supabase Cloud
export async function deleteReportFromCloud(reportId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from('reports').delete().eq('id', reportId);
    if (error) {
      console.error('[Supabase Delete Error]:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Error deleting report from cloud' };
  }
}

// Real-time Supabase Cloud listener with clean unsubscription
export function subscribeToCloudReports(onData: (reports: DailyReport[]) => void) {
  try {
    const channel = supabase
      .channel('public:reports')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reports' },
        async (payload) => {
          console.log('[Supabase Realtime Event]:', payload.eventType, payload.new || payload.old);
          const res = await fetchReportsFromSupabase();
          if (res.success && res.reports.length > 0) {
            onData(res.reports);
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
// Storage: File Uploads for Attachments
// ==========================================

export async function uploadReportAttachment(
  file: File,
  folderName: string = 'daily_reports'
): Promise<{ success: boolean; attachment?: ReportAttachment; error?: string }> {
  try {
    if (file.size > 10 * 1024 * 1024) {
      return { success: false, error: 'File exceeds 10MB maximum limit.' };
    }

    const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `${folderName}/${Date.now()}_${cleanFileName}`;

    const { data, error } = await supabase.storage
      .from('cucom-attachments')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      console.error('[Storage Upload Error]:', error.message);
      return { success: false, error: error.message };
    }

    const { data: publicUrlData } = supabase.storage
      .from('cucom-attachments')
      .getPublicUrl(data.path);

    const attachment: ReportAttachment = {
      name: file.name,
      url: publicUrlData.publicUrl,
      size: file.size,
      type: file.type,
      uploadedAt: new Date().toISOString()
    };

    return { success: true, attachment };
  } catch (err: any) {
    console.error('[Storage Upload Exception]:', err);
    return { success: false, error: err?.message || 'File upload failed' };
  }
}

// ==========================================
// User Profiles Cloud Sync
// ==========================================

export async function syncProfileToCloud(user: UserAccount): Promise<boolean> {
  try {
    const row = {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
      department: user.department,
      designation: user.designation,
      staff_id: user.staffId || user.id.replace('user-', ''),
      is_active: user.isActive !== false,
      updated_at: new Date().toISOString()
    };
    const { error } = await supabase.from('profiles').upsert(row, { onConflict: 'id' });
    if (error) {
      console.warn('Profiles upsert note:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Profiles sync error:', err);
    return false;
  }
}

export async function fetchProfilesFromCloud(): Promise<UserAccount[]> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.warn('Profiles fetch note:', error.message);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      username: row.username,
      role: row.role || 'STAFF',
      staffId: row.staff_id || row.id,
      department: row.department,
      designation: row.designation,
      email: row.email,
      isActive: row.is_active !== false,
      createdAt: row.created_at
    }));
  } catch (err) {
    console.warn('Profiles fetch exception:', err);
    return [];
  }
}

export async function deleteProfileFromCloud(userId: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('profiles').delete().eq('id', userId);
    if (error) {
      console.warn('Profile delete note:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Profile delete error:', err);
    return false;
  }
}

