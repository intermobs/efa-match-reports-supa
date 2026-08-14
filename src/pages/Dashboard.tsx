/* eslint-disable */
/* @ts-nocheck */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Plus, X, Trophy, Users, Clock, Calendar, ClipboardPen, RefreshCcw } from 'lucide-react';
import { db, getCurrentUser } from '../lib/supabase';
import Select from 'react-select';
import toast from 'react-hot-toast';
import MatchActionsModal from '../components/MatchActionsModal';
import DashboardHeader from '../components/DashboardHeader';
import { TOURNAMENTS, LEAGUES, TEAMS, VENUES, STADIUMS } from '../hooks/constants';
import { AdminDetailModal } from '../components/AdminDetailModal';
import { ReportViewer } from '../components/ReportViewer';

type NotificationItem = {
  id: string;
  message: string;
  time: string;
  read?: boolean;
  matchId?: string;
  type?: 'assignment' | 'update' | 'completed' | 'report_submitted' | 'incident' | 'admin_update';
  match?: any;
};

const selectStyles = {
  control: (base: any) => ({ ...base, padding: '2px', borderColor: '#d1d5db', minHeight: '38px' }),
  singleValue: (base: any) => ({ ...base, color: 'black' }),
  option: (base: any, state: any) => ({ ...base, color: 'black', backgroundColor: state.isFocused ? '#EFF6FF' : 'white' }),
  menuPortal: (base: any) => ({ ...base, zIndex: 9999 })
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [officers, setOfficers] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [search, setSearch] = useState('');
  const currentPage = 1;
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [reportData, setReportData] = useState<any>(null);
  const [reportMatch, setReportMatch] = useState<any>(null);
  const [viewingForm, setViewingForm] = useState<string>('');
  const [showOfficerModal, setShowOfficerModal] = useState(false);
  const [selectedOfficerFilter, setSelectedOfficerFilter] = useState<any>(null);
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [availableReports, setAvailableReports] = useState<{ [key: string]: boolean }>({});
  const itemsPerPage = 10;
  const hasActiveFilters = Boolean(search || selectedOfficerFilter || dateFrom || dateTo);

  const handleNavigateToForm = (match: any, path: string) => {
    setSelectedMatch(null);
    navigate(path, { state: { matchData: match } });
  };

  const handleNotificationClick = async (notification: NotificationItem) => {
    if (!notification.matchId) return;
    
    // Find the match from the current matches list
    const match = matches.find((m: any) => m.id === notification.matchId);
    if (match) {
      setSelectedMatch(match);
      await checkAvailableReports(match);
      // Mark notification as read
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notification.id ? { ...n, read: true } : n
        )
      );
    }
  };

  const handleViewReport = async (match: any, formId: string, label: string) => {
    setSelectedMatch(null);
    try {
      const collectionName = formId === 'm1'
        ? 'm1_reports'
        : formId === 'day'
          ? 'matchday_reports'
          : 'incident_reports';
      const reportId = formId === 'm1'
        ? `M1-${match.id}`
        : formId === 'day'
          ? `MD-${match.id}`
          : `IR-${match.id}`;

      const { data: report, error } = await db
        .from(collectionName)
        .select('*')
        .eq('id', reportId)
        .maybeSingle();

      if (error) throw error;
      if (report) {
        setReportMatch(match);
        setReportData(report);
        setViewingForm(label);
      } else {
        setReportMatch(null);
        alert('No report found for this match.');
      }
    } catch (error) {
      console.error(error);
      alert('Error fetching report data.');
    }
  };

  const checkAvailableReports = async (match: any) => {
    try {
      const m1Id = `M1-${match.id}`;
      const mdId = `MD-${match.id}`;
      const irId = `IR-${match.id}`;

      const [m1Result, mdResult, irResult] = await Promise.all([
        db.from('m1_reports').select('id').eq('id', m1Id).maybeSingle(),
        db.from('matchday_reports').select('id').eq('id', mdId).maybeSingle(),
        db.from('incident_reports').select('id').eq('id', irId).maybeSingle(),
      ]);

      setAvailableReports({
        m1: !!m1Result.data,
        day: !!mdResult.data,
        incident: !!irResult.data,
      });
    } catch (error) {
      console.error('Error checking available reports:', error);
      setAvailableReports({ m1: false, day: false, incident: false });
    }
  };

  const addNotification = (notification: NotificationItem) => {
    setNotifications((prev) => {
      const exists = prev.some((item) => item.id === notification.id);
      if (exists) return prev;
      return [notification, ...prev].slice(0, 6);
    });
  };

  const upsertMatchInState = (updatedMatch: any) => {
    if (!updatedMatch?.id) return;

    setMatches((prev) => {
      const existingIndex = prev.findIndex((match: any) => match.id === updatedMatch.id);
      if (existingIndex >= 0) {
        const next = [...prev];
        next[existingIndex] = { ...next[existingIndex], ...updatedMatch };
        return next;
      }

      return [updatedMatch, ...prev];
    });
  };

  const buildAssignmentNotification = (match: any) => ({
    id: `assigned-${match.id}`,
    message: `New Assignement: ${match.homeTeam} vs ${match.awayTeam} on ${match.date}. Fill in Match Day -1 form.`,
    time: 'Now',
    read: false,
    matchId: match.id,
    type: 'assignment' as const,
    match: match,
  });

  const buildActiveMatchReminder = (match: any) => ({
    id: `active-${match.id}`,
    message: `Match Day -1 form Complete: ${match.homeTeam} vs ${match.awayTeam}. On ${match.date}, Fill Matchday form or Incident(optional).`,
    time: 'Now',
    read: false,
    matchId: match.id,
    type: 'update' as const,
    match: match,
  });

  const buildAdminAssignmentNotification = (match: any) => ({
    id: `admin-assigned-${match.id}`,
    matchId: match.id,
    type: 'admin_update' as const,
    match: match,
    message: `${match.assignedOfficerName || 'Unknown'} was assigned to ${match.homeTeam} vs ${match.awayTeam} on ${match.date}.`,
    time: 'Now',
    read: false,
  });

  const buildAdminMatchUpdateNotification = (match: any, status: string) => {
    const base = `Officer ${match.assignedOfficerName || 'Unknown'} ${status === 'Active' ? 'updated Match Day -1 form' : 'submitted Matchday form'} for ${match.homeTeam} vs ${match.awayTeam}.`;
    return {
      id: `admin-status-${match.id}-${status}`,
      message: base,
      time: 'Now',
      read: false,
      matchId: match.id,
      type: 'admin_update' as const,
      match: match,
    };
  };

  const fetchMatches = async (profile: any, user: any) => {
    setLoading(true);
    if (!user) return [];

    let query = db.from('matches').select('*');
    if (profile?.role !== 'admin') {
      query = query.eq('assignedUserId', user.id);
    }

    const { data: matchRows, error: matchError } = await query;
    if (matchError) throw matchError;

    const enrichedMatches = await Promise.all((matchRows ?? []).map(async (matchRow: any) => {
      try {
        const { data: incidentReport, error: incidentError } = await db
          .from('incident_reports')
          .select('id')
          .eq('id', `IR-${matchRow.id}`)
          .maybeSingle();

        if (incidentError) throw incidentError;
        return { ...matchRow, hasIncident: Boolean(incidentReport) };
      } catch (error) {
        console.error('Error checking incident report for match', matchRow.id, error);
        return { ...matchRow, hasIncident: false };
      }
    }));

    setMatches(enrichedMatches);
    setLoading(false);
    return enrichedMatches;
  };

  useEffect(() => {
    const init = async () => {
      try {
        const user = await getCurrentUser();
        if (!user) {
          setLoading(false);
          navigate('/login');
          return;
        }
        setCurrentUser(user);

        const { data: userProfileData, error: userProfileError } = await db
          .from('users')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (userProfileError) throw userProfileError;
        if (userProfileData) {
          setUserProfile(userProfileData);
          const enrichedMatches = await fetchMatches(userProfileData, user);

          if (userProfileData.role !== 'admin') {
            enrichedMatches.forEach((match: any) => {
              if (match.status === 'M-1 Pending') {
                addNotification(buildAssignmentNotification(match));
              }
              if (match.status === 'Active') {
                addNotification(buildActiveMatchReminder(match));
              }
            });
          }
        }

        const { data: officersData, error: officersError } = await db
          .from('users')
          .select('id, full_name, email')
          .eq('role', 'officer');

        if (officersError) throw officersError;

        const base = (officersData ?? []).map((d: any) => ({ value: d.id, label: d.full_name || d.fullName, email: d.email }));

        // Enrich each officer with their total completed matches
        const enriched = await Promise.all(base.map(async (o: any) => {
          try {
            const { count, error: countError } = await db
              .from('matches')
              .select('id', { count: 'exact', head: true })
              .eq('assignedUserId', o.value)
              .eq('status', 'Completed');
            if (countError) throw countError;
            return { ...o, completed: count ?? 0 };
          } catch (e) {
            console.error('Error fetching completed count for officer', o.value, e);
            return { ...o, completed: 0 };
          }
        }));

        setOfficers(enriched);
      } catch (error) {
        console.error(error);
      }
    };
    init();
  }, [navigate]);

  const isAdmin = userProfile?.role === 'admin';

  useEffect(() => {
    if (!currentUser) return;

    const userId = currentUser.id;
    const matchChannel = db.channel(`notifications-matches-${userId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'matches', filter: `assignedUserId=eq.${userId}` }, (payload) => {
        const match = payload.new;
        if (!match) return;
        upsertMatchInState(match);
        const notif = buildAssignmentNotification(match);
        addNotification(notif);
        toast.success(notif.message, { duration: 5000 });
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'matches', filter: `assignedUserId=eq.${userId}` }, (payload) => {
        const match = payload.new;
        if (!match) return;
        upsertMatchInState(match);
        if (payload.old?.status !== payload.new?.status) {
          if (payload.new.status === 'Active') {
            const notif = buildActiveMatchReminder(match);
            addNotification(notif);
            toast.success(notif.message, { duration: 5000 });
          }
          if (payload.new.status === 'Completed') {
            const notif: NotificationItem = {
              id: `match-completed-${match.id}`,
              message: `Matchday Report submitted: ${match.homeTeam} vs ${match.awayTeam}.`,
              time: 'Just now',
              read: false,
              matchId: match.id,
              type: 'completed',
              match: match,
            };
            addNotification(notif);
            toast.success(notif.message, { duration: 5000 });
          }
        }
      })
      .subscribe();

    let adminChannel: any;
    if (isAdmin) {
      adminChannel = db.channel(`notifications-admin-${userId}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'matches' }, (payload) => {
          const match = payload.new;
          if (!match) return;
          upsertMatchInState(match);
          const notif = buildAdminAssignmentNotification(match);
          addNotification(notif);
          toast.success(notif.message, { duration: 5000 });
        })
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'matches' }, (payload) => {
          const match = payload.new;
          if (!match) return;
          upsertMatchInState(match);

          const statusChanged = payload.old?.status !== payload.new?.status;
          const assignmentChanged = payload.old?.assignedUserId !== payload.new?.assignedUserId || payload.old?.assignedOfficerName !== payload.new?.assignedOfficerName;

          if (statusChanged) {
            const notif = buildAdminMatchUpdateNotification(match, payload.new.status);
            addNotification(notif);
            toast.success(notif.message, { duration: 5000 });
          } else if (assignmentChanged) {
            const notif = buildAdminAssignmentNotification(match);
            addNotification(notif);
            toast.success(notif.message, { duration: 5000 });
          } else {
            const notif: NotificationItem = {
              id: `admin-update-${match.id}-${Date.now()}`,
              message: `Match ${match.homeTeam} vs ${match.awayTeam} was updated.`,
              time: 'Just now',
              read: false,
              matchId: match.id,
              type: 'admin_update',
              match,
            };
            addNotification(notif);
            toast.success(notif.message, { duration: 5000 });
          }
        })
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'm1_reports' }, (payload) => {
          const report = payload.new;
          if (!report) return;
          const notif: NotificationItem = {
            id: `m1-${report.id}`,
            message: `Officer ${report.officer_name || report.officer_email || 'Unknown'} submitted a Match Day -1 form`,
            time: 'Just now',
            read: false,
            type: 'report_submitted',
          };
          addNotification(notif);
          toast.success(notif.message, { duration: 5000 });
        })
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'matchday_reports' }, (payload) => {
          const report = payload.new;
          if (!report) return;
          const notif: NotificationItem = {
            id: `md-${report.id}`,
            message: `Officer ${report.officer_name || report.officer_email || 'Unknown'} submitted a Match Day form`,
            time: 'Just now',
            read: false,
            type: 'report_submitted',
          };
          addNotification(notif);
          toast.success(notif.message, { duration: 5000 });
        })
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'incident_reports' }, (payload) => {
          const report = payload.new;
          if (!report) return;
          const notif: NotificationItem = {
            id: `ir-${report.id}`,
            message: `Incident report logged for match ${report.match_id || report.id}`,
            time: 'Just now',
            read: false,
            type: 'incident',
          };
          addNotification(notif);
          toast.error(notif.message, { duration: 5000 });
        })
        .subscribe();
    }

    return () => {
      db.removeChannel(matchChannel);
      if (adminChannel) db.removeChannel(adminChannel);
    };
  }, [currentUser, isAdmin]);

  const filteredMatches = matches
    .filter((m: any) => {
      const teamText = ((m.homeTeam || '') + ' ' + (m.awayTeam || '')).toLowerCase();
      const officerName = (m.assignedOfficerName || '').toLowerCase();
      const stadiumName = (m.stadium || '').toLowerCase();
      const term = (search || '').toLowerCase().trim();

      if (term) {
        const inTeam = teamText.includes(term);
        const inOfficer = officerName.includes(term);
        const inStadium = stadiumName.includes(term);
        if (!inTeam && !inOfficer && !inStadium) return false;
      }

      if (selectedOfficerFilter && selectedOfficerFilter.value) {
        if (m.assignedUserId !== selectedOfficerFilter.value) return false;
      }

      if (dateFrom) {
        const md = new Date(m.date);
        const from = new Date(dateFrom + 'T00:00:00');
        if (isNaN(md.getTime()) || md < from) return false;
      }

      if (dateTo) {
        const md = new Date(m.date);
        const to = new Date(dateTo + 'T23:59:59');
        if (isNaN(md.getTime()) || md > to) return false;
      }

      return true;
    })
    .sort((a: any, b: any) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());

  const paginatedMatches = filteredMatches.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const m1PendingCount = matches.filter((m: any) => m.status === 'M-1 Pending').length;
  const activeCount = matches.filter((m: any) => m.status === 'Active').length;
  const incompleteTotal = m1PendingCount + activeCount;
  return (
    <div className="w-screen min-h-screen bg-gray-50! flex flex-col">
      <DashboardHeader
        userName={userProfile?.full_name || currentUser?.email?.split('@')[0] || 'User'}
        userEmail={currentUser?.email || 'No email'}
        userRole={userProfile?.role || 'user'}
        notifications={notifications}
        onLogout={() => navigate('/login')}
        onNotificationClick={handleNotificationClick}
      />
      
      <div className="flex-1 p-4 md:p-8 lg:p-12">
        <div className="max-w-7xl mx-auto">
        
        {isAdmin && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-5 mb-12">
            <StatCard title="Coming Matches" subtitle="Awaiting Matchday-1 Form" value={matches.filter((m: any) => m.status === 'M-1 Pending').length} icon={<Clock className="text-orange-300" />} />
            <StatCard title="Active Matches" subtitle="In progress, Waiting for Matchday Form" value={matches.filter((m: any) => m.status === 'Active').length} icon={<ShieldAlert className="text-green-600" />} />
            <StatCard title="Total Matches" subtitle="Scheduled & completed" value={matches.length} icon={<Trophy className="text-blue-600" />} />
            <StatCard title="Registered Officers" subtitle="Click to view details" value={officers.length} icon={<Users className="text-black" />} onClick={() => setShowOfficerModal(true)} />
            <StatCard title="Reported Incidents" subtitle="Incidents logged" value={matches.filter((m: any) => m.hasIncident === true).length} icon={<ShieldAlert className="text-red-600" />} />
          </div>
        )}
        {!isAdmin && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <StatCard
              title="Incomplete Tasks"
              subtitle={`Awaiting Matchday Minus 1 [ ${m1PendingCount} ]`}
              subtitle2={`Awaiting Matchday [ ${activeCount} ]`}
              value={incompleteTotal}
              icon={<ClipboardPen className="text-blue-600" />}
            />
          </div>
        )}
        <div className="overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
          <div className="border-b border-slate-200 bg-slate-50/80 p-4 md:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Overview</p>
                <h2 className="mt-1 text-xl font-bold text-slate-900">Matches History</h2>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {isAdmin && (
                  <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className={`inline-flex items-center justify-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold text-white transition ${
                      showAddForm
                        ? '!bg-red-600 hover:!bg-red-700'
                        : '!bg-blue-600 hover:!bg-blue-700'
                    }`}
                  >
                    {showAddForm ? <X size={16} /> : <Plus size={16} />}
                    <span>{showAddForm ? 'Cancel' : 'Add Match'}</span>
                  </button>
                )}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-[1.7fr_1fr_1fr] items-end">
              <div className="w-full">
                <label className="mb-1.5 block text-xs font-medium text-slate-600" htmlFor="dashboard-search">Search</label>
                <div className="relative">
                  <input
                    id="dashboard-search"
                    placeholder="Search by Team, Officer, Stadium"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 pr-11 text-sm text-slate-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                  <button
                    type="button"
                    aria-label={hasActiveFilters ? 'Clear filters' : 'No filters to clear'}
                    disabled={!hasActiveFilters}
                    onClick={() => {
                      setSearch('');
                      setSelectedOfficerFilter(null);
                      setDateFrom('');
                      setDateTo('');
                    }}
                    className={`absolute right-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg border transition ${
                      hasActiveFilters
                        ? 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-100 hover:text-slate-800'
                        : 'cursor-not-allowed border-slate-100 bg-white text-slate-300'
                    }`}
                    title={hasActiveFilters ? 'Clear filters' : 'No filters to clear'} >
                    {hasActiveFilters ? (
                      <RefreshCcw  size={16} strokeWidth={2} className="shrink-0" />
                    ) : (
                      <X size={16} strokeWidth={2} className="shrink-0" />
                    )}
                  </button>
                </div>
              </div>
              <div className="relative w-full">
                <label className="mb-1.5 block text-xs font-medium text-slate-600" htmlFor="date-from">Date from</label>
                <input
                  id="date-from"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white! px-3.5 py-2.5 pr-9 text-sm text-slate-700 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 [&::-webkit-calendar-picker-indicator]:bg-slate-400! :cursor-pointer"
                />
                <Calendar className="pointer-events-none absolute right-3 top-[42px] h-4 w-4 text-slate-400" />
              </div>

              <div className="relative w-full">
                <label className="mb-1.5 block text-xs font-medium text-slate-600" htmlFor="date-to">Date to</label>
                <input
                  id="date-to"
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white! px-3.5 py-2.5 pr-9 text-sm text-slate-700 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 [&::-webkit-calendar-picker-indicator]:bg-slate-400! :cursor-pointer"
                />
                <Calendar className="pointer-events-none absolute right-3 top-[42px] h-4 w-4 text-slate-400" />
              </div>
            </div>
          </div>

          {showAddForm && isAdmin && <AddMatchForm onAdd={() => { setShowAddForm(false); fetchMatches(userProfile, currentUser); }} officers={officers} />}

          {loading ? <p className="p-12 text-center text-slate-500">Loading...</p> : (
            <div className="max-h-[500px] overflow-y-auto">
              {paginatedMatches.map((match: any) => (
                <div
                  key={match.id}
                  className="group flex cursor-pointer flex-col gap-3 border-b border-slate-200 p-4 transition hover:bg-slate-50 md:flex-row md:items-center md:justify-between md:p-5"
                  onClick={() => {
                    setSelectedMatch(match);
                    checkAvailableReports(match);
                  }}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-base font-bold text-slate-900">{match.homeTeam} vs {match.awayTeam}</h3>
                      {match.hasIncident && (
                        <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-red-700">
                          Incident
                        </span>
                      )}
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500">
                      <span>{match.date}</span>
                      <span className="hidden h-1 w-1 rounded-full bg-slate-300 md:inline-block" />
                      <span>{match.stadium}</span>
                    </div>

                    <div className="mt-2 inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                      Assigned: {match.assignedOfficerName || 'Unassigned'}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 md:min-w-[180px] md:justify-end">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                      match.status === 'Active'
                        ? 'bg-blue-100 text-blue-700'
                        : match.status === 'Completed'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-700'
                    }`}>
                      {match.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        </div>
        </div>

      {isAdmin ? selectedMatch && <AdminDetailModal match={selectedMatch} onClose={() => setSelectedMatch(null)} onDelete={() => fetchMatches(userProfile, currentUser)} /> : selectedMatch && (
          <MatchActionsModal 
            match={selectedMatch} 
            onClose={() => setSelectedMatch(null)} 
            onEdit={handleNavigateToForm}
            onView={handleViewReport}
            availableReports={availableReports}
            onPrint={() => window.print()} 
          />
        )}

      {showOfficerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 !bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-[28px] !bg-white shadow-2xl overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between gap-4 p-6 border-b border-slate-200">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-sky-600 font-semibold">Registered Officers</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-2">Officer Directory</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowOfficerModal(false)}
                className="rounded-full p-2 text-slate-500 hover:text-slate-900 hover:!bg-slate-100 transition"
              >
                Close
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-600">A quick view of registered officers for administrative actions.</p>
              <div className="grid gap-3">
                {officers.length > 0 ? officers.map((officer: any, index: number) => (
                  <div key={officer.value || index} className="rounded-3xl border border-slate-200 p-4 bg-slate-50 flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-900">{officer.label || 'Unnamed Officer'}</p>
                      <p className="text-xs text-slate-500">{officer.email || 'No email'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-700">{(officer.completed ?? 0)}</p>
                      <p className="text-xs text-slate-500">Completed</p>
                    </div>
                  </div>
                )) : (
                  <div className="rounded-3xl border border-dashed border-slate-300 p-6 text-center text-slate-500">
                    No registered officers available yet.
                  </div>
                )}
              </div>
            </div>
            <div className="border-t border-slate-200 p-4 text-right">
              <button
                type="button"
                onClick={() => setShowOfficerModal(false)}
                className="inline-flex items-center justify-center rounded-full !bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {reportData && (
        <ReportViewer 
          data={reportData} 
          title={viewingForm} 
          match={reportMatch}
          onClose={() => { setReportData(null); setReportMatch(null); }} 
        />
      )}
    </div>
  );
}

function AddMatchForm({ onAdd, officers }: { onAdd: () => void, officers: any[] }) {
  const [data, setData] = useState({ homeTeam: '', awayTeam: '', date: '', stadium: '', tournament: '', league: '', venue: '', assignedUserId: '', assignedOfficerName: '' });
  const submit = async () => {
    if (!data.homeTeam || !data.awayTeam || !data.date || !data.assignedUserId) return alert("All fields required");
    const { error } = await db.from('matches').insert([{ ...data, assignedUserId: data.assignedUserId, status: 'M-1 Pending', createdAt: new Date().toISOString() }]);
    if (error) return alert('Error saving match: ' + error.message);
    onAdd();
  };
  return (
  <div className="p-4 md:p-6 !bg-gray-50 border-b grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
    <Select options={TOURNAMENTS} menuPortalTarget={document.body} placeholder="Tournament" styles={selectStyles} onChange={(v: any) => setData({...data, tournament: v.label})} />
    <Select options={LEAGUES} menuPortalTarget={document.body} placeholder="League" styles={selectStyles} onChange={(v: any) => setData({...data, league: v.label})} />
    <Select options={TEAMS} menuPortalTarget={document.body} placeholder="Home Team" styles={selectStyles} onChange={(v: any) => setData({...data, homeTeam: v.value})}/>
    <Select options={TEAMS} menuPortalTarget={document.body} placeholder="Away Team" styles={selectStyles} onChange={(v: any) => setData({...data, awayTeam: v.value})}/>
    <input 
      type="date" 
      className="p-2 border border-gray-200 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 
      [&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:cursor-pointer 
      [&::-webkit-calendar-picker-indicator]:!bg-blue-900 [&::-webkit-calendar-picker-indicator]:font-white"
       
      onChange={e => setData({...data, date: e.target.value})} 
    />
    <Select options={VENUES} menuPortalTarget={document.body} placeholder="Venue" styles={selectStyles} onChange={(v: any) => setData({...data, venue: v.value})} />
    <Select options={STADIUMS} menuPortalTarget={document.body} placeholder="Stadium" styles={selectStyles} onChange={(v: any) => setData({...data, stadium: v.value})}  />
    <Select options={officers} menuPortalTarget={document.body} placeholder="Assign Officer" styles={selectStyles} onChange={(v: any) => setData({...data, assignedUserId: v.value, assignedOfficerName: v.label})} />
    <button onClick={submit} className="sm:col-span-2 lg:col-span-1 !bg-green-600 text-white font-bold rounded-lg hover:!bg-green-700 transition-colors py-2">
      Save Match
    </button>
  </div>
    
  );
}
// new printable area component
function StatCard({ title, subtitle,subtitle2, value, icon, onClick }: any) {
  const clickable = Boolean(onClick);
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left bg-white p-6 rounded-3xl shadow-sm border border-gray-100 transition-all duration-200 ${clickable ? 'hover:shadow-xl hover:border-gray-200 cursor-pointer transform hover:-translate-y-0.5' : ''}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-600">{title}</p>
          {subtitle && <p className="mt-2 text-xs text-slate-500">{subtitle}</p>}
          {subtitle2 && <p className="mt-2 text-xs text-slate-500">{subtitle2}</p>}
        </div>
        <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">{icon}</div>
      </div>
      <div className="mt-6">
        <p className="text-3xl font-semibold tracking-tight text-slate-900">{value}</p>
      </div>
    </button>
  );
}
