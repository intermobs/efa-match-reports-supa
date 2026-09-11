export type NotificationItem = {
  id: string;
  message: string;
  time: string;
  read?: boolean;
  matchId?: string;
  type?: 'assignment' | 'update' | 'completed' | 'report_submitted' | 'incident' | 'admin_update';
  match?: any;
};

export const buildAssignmentNotification = (match: any): NotificationItem => ({
  id: `assigned-${match.id}`,
  message: `New Assignement: ${match.homeTeam} vs ${match.awayTeam} on ${match.date}. Fill in Match Day -1 form.`,
  time: 'Now',
  read: false,
  matchId: match.id,
  type: 'assignment',
  match,
});

export const buildActiveMatchReminder = (match: any): NotificationItem => ({
  id: `active-${match.id}`,
  message: `Match Day -1 form Complete: ${match.homeTeam} vs ${match.awayTeam}. On ${match.date}, Fill Matchday form or Incident(optional).`,
  time: 'Now',
  read: false,
  matchId: match.id,
  type: 'update',
  match,
});

export const buildAdminAssignmentNotification = (match: any): NotificationItem => ({
  id: `admin-assigned-${match.id}`,
  matchId: match.id,
  type: 'admin_update',
  match,
  message: `${match.assignedOfficerName || 'Unknown'} was assigned to ${match.homeTeam} vs ${match.awayTeam} on ${match.date}.`,
  time: 'Now',
  read: false,
});

export const buildAdminMatchUpdateNotification = (match: any, status: string): NotificationItem => ({
  id: `admin-status-${match.id}-${status}`,
  message: `Officer ${match.assignedOfficerName || 'Unknown'} ${status === 'Active' ? 'updated Match Day -1 form' : 'submitted Matchday form'} for ${match.homeTeam} vs ${match.awayTeam}.`,
  time: 'Now',
  read: false,
  matchId: match.id,
  type: 'admin_update',
  match,
});
