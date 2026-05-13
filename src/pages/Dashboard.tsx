import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Plus, X, Trophy, Users, Printer, Clock, Trash2 } from 'lucide-react';
import { db, getCurrentUser, supabase } from '../lib/supabase';
import Select from 'react-select';
import MatchActionsModal from '../components/MatchActionsModal'; // Ensure this exists
import DashboardHeader from '../components/DashboardHeader';

type NotificationItem = {
  id: string;
  message: string;
  time: string;
  read?: boolean;
};

const TEAMS = [
  { value: 'Mbabane Swallows', label: 'Mbabane Swallows' },
  { value: 'Mbabane Highlanders', label: 'Mbabane Highlanders' },
  { value: 'Manzini Wanderers', label: 'Manzini Wanderers' },
  { value: 'Moneni Pirates', label: 'Moneni Pirates' },
  { value: 'Green Mamba', label: 'Green Mamba' }
];
const TOURNAMENTS = [
  { value: 'MTN Premier League', label: 'MTN Premier League' },
  { value: 'Mulasport NFD', label: 'Mulasport NFD' },
  { value: 'Ingwenyama Cup', label: 'SMVA Ingwenyama Cup' }
];
const STADIUMS = [
  { value: 'Somhlolo National Stadium', label: 'Somhlolo National Stadium' },
  { value: 'KaLanga Sports Ground', label: 'KaLanga Sports Ground' },
  { value: 'Mavuso Sports Centre', label: 'Mavuso Sports Centre' }
];
const LEAGUES = [
  { value: 'Premier League', label: 'MTN PLE' },
  { value: 'Super League', label: 'Super League' },
  { value: 'Regional League', label: 'Regional League' },
  { value: 'NFD', label: 'Mulasport NFD' }
];
const VENUES = [
  { value: 'hhohho', label: 'Hhohho' },
  { value: 'lubombo', label: 'Lubombo' },
  { value: 'manzini', label: 'Manzini' },
  { value: 'shiselweni', label: 'Shiselweni' }
];

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
  const itemsPerPage = 10;

  const handleNavigateToForm = (match: any, path: string) => {
    setSelectedMatch(null);
    navigate(path, { state: { matchData: match } });
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

  const addNotification = (notification: NotificationItem) => {
    setNotifications((prev) => {
      const exists = prev.some((item) => item.id === notification.id);
      if (exists) return prev;
      return [notification, ...prev].slice(0, 6);
    });
  };

  const buildAssignmentNotification = (match: any) => ({
    id: `assigned-${match.id}`,
    message: `You have been assigned to ${match.homeTeam} vs ${match.awayTeam} on ${match.date}. Please complete the Match Day -1 form.`,
    time: 'Now',
    read: false,
  });

  const buildActiveMatchReminder = (match: any) => ({
    id: `active-${match.id}`,
    message: `Match Day -1 form is complete for ${match.homeTeam} vs ${match.awayTeam}. On ${match.date}, complete the Matchday form or Incident form as needed.`,
    time: 'Now',
    read: false,
  });

  const buildAdminAssignmentNotification = (match: any) => ({
    id: `admin-assigned-${match.id}`,
    message: `Officer ${match.assignedOfficerName || 'Unknown'} was assigned to ${match.homeTeam} vs ${match.awayTeam} on ${match.date}.`,
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
          .select('id, full_name')
          .eq('role', 'officer');

        if (officersError) throw officersError;
        setOfficers((officersData ?? []).map((d: any) => ({ value: d.id, label: d.full_name || d.fullName })));
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
        addNotification(buildAssignmentNotification(match));
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'matches', filter: `assignedUserId=eq.${userId}` }, (payload) => {
        const match = payload.new;
        if (!match) return;
        if (payload.old?.status !== payload.new?.status) {
          if (payload.new.status === 'Active') {
            addNotification(buildActiveMatchReminder(match));
          }
          if (payload.new.status === 'Completed') {
            addNotification({
              id: `match-completed-${match.id}`,
              message: `Matchday report submitted for ${match.homeTeam} vs ${match.awayTeam}.`,
              time: 'Just now',
              read: false,
            });
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
          addNotification(buildAdminAssignmentNotification(match));
        })
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'matches' }, (payload) => {
          const match = payload.new;
          if (!match) return;
          if (payload.old?.status !== payload.new?.status) {
            addNotification(buildAdminMatchUpdateNotification(match, payload.new.status));
          }
        })
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'm1_reports' }, (payload) => {
          const report = payload.new;
          if (!report) return;
          addNotification({
            id: `m1-${report.id}`,
            message: `Officer ${report.officer_name || report.officer_email || 'Unknown'} submitted a Match Day -1 form`,
            time: 'Just now',
            read: false,
          });
        })
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'matchday_reports' }, (payload) => {
          const report = payload.new;
          if (!report) return;
          addNotification({
            id: `md-${report.id}`,
            message: `Officer ${report.officer_name || report.officer_email || 'Unknown'} submitted a Match Day form`,
            time: 'Just now',
            read: false,
          });
        })
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'incident_reports' }, (payload) => {
          const report = payload.new;
          if (!report) return;
          addNotification({
            id: `ir-${report.id}`,
            message: `Incident report logged for match ${report.match_id || report.id}`,
            time: 'Just now',
            read: false,
          });
        })
        .subscribe();
    }

    return () => {
      db.removeChannel(matchChannel);
      if (adminChannel) db.removeChannel(adminChannel);
    };
  }, [currentUser, isAdmin]);

  const filteredMatches = matches
    .filter(m => (m.homeTeam + " " + m.awayTeam).toLowerCase().includes(search.toLowerCase()))
    .sort((a: any, b: any) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());

  const paginatedMatches = filteredMatches.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  return (
    <div className="w-screen min-h-screen !bg-gray-50 flex flex-col">
      <DashboardHeader
        userName={userProfile?.full_name || currentUser?.email?.split('@')[0] || 'User'}
        userEmail={currentUser?.email || 'No email'}
        userRole={userProfile?.role || 'user'}
        notifications={notifications}
        onLogout={() => navigate('/login')}
      />
      <div className="flex-1 p-4 md:p-8 lg:p-12">
        <div className="max-w-7xl mx-auto">
        
        {isAdmin && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <StatCard title="Coming Matches" value={matches.filter((m: any) => m.status === 'M-1 Pending').length} icon={<Clock className="text-orange-300" />} />
            <StatCard title="Active Matches" value={matches.filter((m: any) => m.status === 'Active').length} icon={<ShieldAlert className="text-green-600" />} />
            <StatCard title="Total Matches" value={matches.length} icon={<Trophy className="text-blue-600" />} />
            <StatCard title="Registered Officers" value={officers.length} icon={<Users className="text-black" />} />
            <StatCard title="Reported Incidents" value={matches.filter((m: any) => m.hasIncident === true).length} icon={<ShieldAlert className="text-red-600" />} />
          </div>
        )}
        {!isAdmin && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <StatCard title="Assigned Matches" value={matches.filter((m: any) => m.status === 'M-1 Pending').length} icon={<Clock className="text-orange-300" />} />     
          </div>
        )}
        <div className="!bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 md:p-6 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-lg font-bold text-gray-800">Matches History</h2>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <input 
                placeholder="Search..." 
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm w-full sm:w-auto" 
                onChange={(e) => setSearch(e.target.value)} 
              />
             {/*Only show Add Match button to admins*/}
              {isAdmin && (
                <button 
                  onClick={() => setShowAddForm(!showAddForm)} 
                  className={`px-4 py-2 rounded-lg text-sm flex items-center justify-center gap-2 text-white font-semibold transition duration-200 whitespace-nowrap ${
                    showAddForm 
                      ? '!bg-red-600 hover:!bg-red-700' 
                      : '!bg-blue-600 hover:!bg-blue-700'
                  }`}
                >
                  {showAddForm ? <X size={16} /> : <Plus size={16} />} 
                  {showAddForm ? 'Cancel' : 'Add Match'}
                </button>
              )}
            </div>
          </div>
          {showAddForm && isAdmin && <AddMatchForm onAdd={() => { setShowAddForm(false); fetchMatches(userProfile, currentUser); }} officers={officers} />}
          {loading ? <p className="p-12 text-center">Loading...</p> : (
            <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
              
              {paginatedMatches.map((match: any) => (
                <div 
                  key={match.id} 
                  className="p-4 md:p-6 flex flex-col md:flex-row md:justify-between md:items-center gap-4 hover:bg-gray-50 cursor-pointer transition border-b md:border-b-0"
                  onClick={() => setSelectedMatch(match)}
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 truncate">{match.homeTeam} vs {match.awayTeam}</h3>
                    <p className="text-sm text-gray-500 mt-1">{match.date} • {match.stadium}</p>
                    <span className="inline-block mt-2 px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600 font-medium">
                        Assigned: {match.assignedOfficerName || 'Unassigned'}
                    </span>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                    <div className="flex flex-wrap gap-2 items-center">
                      {/* Status Pill */}
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        match.status === 'Active' ? 'bg-blue-100 text-blue-700' : 
                        match.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {match.status}
                      </span>
                      {match.hasIncident && (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
                          Incident
                        </span>
                      )}
                    </div><div> </div>           
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
            onPrint={() => window.print()} 
          />
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
      <Select options={TOURNAMENTS} menuPortalTarget={document.body} placeholder="Tournament" styles={selectStyles} onChange={(v:any) => setData({...data, tournament: v.label})} />
      <Select options={LEAGUES} menuPortalTarget={document.body} placeholder="League" styles={selectStyles} onChange={(v:any) => setData({...data, league: v.label})} />
      <Select options={TEAMS} menuPortalTarget={document.body} placeholder="Home Team" styles={selectStyles} onChange={(v:any) => setData({...data, homeTeam: v.value})} />
      <Select options={TEAMS} menuPortalTarget={document.body} placeholder="Away Team" styles={selectStyles} onChange={(v:any) => setData({...data, awayTeam: v.value})} />
      <input type="date" className="p-2 border border-gray-200 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" onChange={e => setData({...data, date: e.target.value})} />
      <Select options={VENUES} menuPortalTarget={document.body} placeholder="Venue" styles={selectStyles} onChange={(v:any) => setData({...data, venue: v.value})} />
      <Select options={STADIUMS} menuPortalTarget={document.body} placeholder="Stadium" styles={selectStyles} onChange={(v:any) => setData({...data, stadium: v.value})} />
      <Select options={officers} menuPortalTarget={document.body} placeholder="Assign Officer" styles={selectStyles} onChange={(v:any) => setData({...data, assignedUserId: v.value, assignedOfficerName: v.label})} />
      <button onClick={submit} className="sm:col-span-2 lg:col-span-1 !bg-green-600 text-white font-bold rounded-lg hover:!bg-green-700 transition-colors py-2">Save Match</button>
    </div>
    
  );
}

function StatCard({ title, value, icon }: any) {
  return (
    <div className="!bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all duration-200 flex items-center gap-4">
      <div className="p-3 !bg-gray-50 rounded-lg flex-shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-500 truncate">{title}</p>
        <p className="text-2xl md:text-3xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

function AdminDetailModal({ match, onClose, onDelete }: { match: any, onClose: () => void, onDelete?: () => void }) {
  const [selectedTab, setSelectedTab] = useState<'details' | 'm1' | 'day' | 'incident'>('details');
  const [reportData, setReportData] = useState<any>(null);
  const [availableReports, setAvailableReports] = useState<{[key: string]: boolean}>({});
  const [isDeleting, setIsDeleting] = useState(false);
  // Helper to make the keys look like proper labels
  const formatLabel = (key: string) => {
    return key
      .replace(/([A-Z])/g, ' $1') // Add space before capital letters
      .replace(/^./, (str) => str.toUpperCase()); // Capitalize first letter
  };

  // Check which reports are available for this match
  useEffect(() => {
    const checkAvailableReports = async () => {
      const reports = { m1: false, day: false, incident: false };
      
      try {
        const { data: m1Report, error: m1Error } = await db
          .from('m1_reports')
          .select('id')
          .eq('id', `M1-${match.id}`)
          .maybeSingle();
        if (m1Error) throw m1Error;
        reports.m1 = Boolean(m1Report);

        const { data: dayReport, error: dayError } = await db
          .from('matchday_reports')
          .select('id')
          .eq('id', `MD-${match.id}`)
          .maybeSingle();
        if (dayError) throw dayError;
        reports.day = Boolean(dayReport);

        const { data: incidentReport, error: incidentError } = await db
          .from('incident_reports')
          .select('id')
          .eq('id', `IR-${match.id}`)
          .maybeSingle();
        if (incidentError) throw incidentError;
        reports.incident = Boolean(incidentReport);

        setAvailableReports(reports);
      } catch (error) {
        console.error('Error checking available reports:', error);
      }
    };
    
    checkAvailableReports();
  }, [match.id]);

  // Fetch report data when tab changes
  useEffect(() => {
    const fetchReportData = async () => {
      if (selectedTab === 'details') {
        setReportData(null);
        return;
      }
      
      try {
        const collectionName = selectedTab === 'm1'
          ? 'm1_reports'
          : selectedTab === 'day'
            ? 'matchday_reports'
            : 'incident_reports';
        const reportId = selectedTab === 'm1'
          ? `M1-${match.id}`
          : selectedTab === 'day'
            ? `MD-${match.id}`
            : `IR-${match.id}`;

        const { data: report, error } = await db
          .from(collectionName)
          .select('*')
          .eq('id', reportId)
          .maybeSingle();

        if (error) throw error;
        setReportData(report ?? null);
      } catch (error) {
        console.error('Error fetching report data:', error);
        setReportData(null);
      }
    };
    
    fetchReportData();
  }, [selectedTab, match.id]);

  const handleDeleteMatch = async () => {
    if (!confirm(`Are you sure you want to delete this match: ${match.homeTeam} vs ${match.awayTeam}? This will also delete all related reports and cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      // Delete related reports first

      // Delete from m1_reports
      await db.from('m1_reports').delete().eq('id', `M1-${match.id}`);

      // Delete from matchday_reports
      await db.from('matchday_reports').delete().eq('id', `MD-${match.id}`);

      // Delete from incident_reports
      await db.from('incident_reports').delete().eq('id', `IR-${match.id}`);

      // Delete the match itself
      const { error } = await db.from('matches').delete().eq('id', match.id);
      if (error) throw error;

      alert('Match and all related data deleted successfully.');
      onClose();
      if (onDelete) onDelete();
    } catch (error) {
      console.error('Error deleting match:', error);
      alert('Error deleting match. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter out technical fields for match details
  const displayData = Object.entries(match).filter(
    ([key]) => !['id', 'userId', 'createdAt', 'status', 'officerEmail', 'assignedUserId', 'officerEmail'].includes(key)
  );

  const topMetadataKeys = ['homeTeam', 'awayTeam', 'date', 'venue', 'stadium', 'assignedOfficerName', 'assignedOfficer'];
  const filteredDisplayData = displayData.filter(([key]) => !topMetadataKeys.includes(key));
  const filteredReportEntries = reportData ? Object.entries(reportData).filter(([key]) => !topMetadataKeys.includes(key)) : [];

  const tabs = [
    { id: 'details', label: 'Match Details', available: true },
    { id: 'm1', label: 'M-1 Report', available: availableReports.m1 },
    { id: 'day', label: 'Matchday Report', available: availableReports.day },
    { id: 'incident', label: 'Incident Report', available: availableReports.incident }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Sticky Header */}
        <div className="p-6 border-b flex justify-between items-center bg-white sticky top-0 z-10">
          <h2 className="text-xl font-bold text-blue-900">
           
          </h2>
          <button onClick={onClose} className="p-2 text-red-600 hover:bg-gray-100 rounded-full transition"><X size={24}/></button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 pt-4 border-b bg-gray-50">
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id as any)}
                disabled={!tab.available}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  selectedTab === tab.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : tab.available
                      ? 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                }`}
              >
                {tab.label}
                {!tab.available && tab.id !== 'details' && (
                  <span className="ml-2 text-xs opacity-60">(Not Available)</span>
                )}
              </button>
            ))}
          </div>
        </div>
        
        {/* Content */}
        <div id="printable-area" className="p-8 space-y-8 flex-1">
          <div className="space-y-6 report-summary">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-sky-600 font-semibold">EFA Safety & Security</p>
                <h3 className="text-2xl md:text-3xl font-bold text-slate-900 mt-2">
                  {selectedTab === 'details' ? 'Match Overview' : selectedTab === 'm1' ? 'MATCH DAY -1 REPORT' : selectedTab === 'day' ? 'MATCH DAY REPORT' : 'INCIDENT REPORT'}
                </h3>
              </div>
              <img src="/efa_logo.png" alt="EFA Logo" className="w-20 h-20 object-contain self-end" />
            </div>
            {/* Match Metadata Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-700">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500 font-semibold mb-2">Match</p>
                <p className="text-lg font-semibold text-slate-900">{match.homeTeam || 'N/A'} vs {match.awayTeam || 'N/A'}</p>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500 font-semibold mb-2"></p>
                <div className="grid grid-cols-2 gap-3 text-sm text-slate-700">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500 font-semibold">Tournament</p>
                    <p className="font-medium text-slate-900 mt-1">{match.tournament || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500 font-semibold">League</p>
                    <p className="font-medium text-slate-900 mt-1">{match.league || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500 font-semibold">Stadium</p>
                    <p className="font-medium text-slate-900 mt-1">{match.stadium || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500 font-semibold">Venue</p>
                    <p className="font-medium text-slate-900 mt-1">{match.venue || 'N/A'}</p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="grid grid-cols-2 gap-3 text-sm text-slate-700">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500 font-semibold">Date</p>
                    <p className="font-medium text-slate-900 mt-1">{match.date || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500 font-semibold">Safety & Security Officer</p>
                    <p className="font-medium text-slate-900 mt-1">{match.assignedOfficerName || match.assignedOfficer || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {selectedTab === 'details' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 report-details">
              {filteredDisplayData.map(([key, value]) => (
                <div key={key} className="border-b border-gray-100 pb-2">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{formatLabel(key)}</p>
                  <p className="font-medium text-gray-900 mt-1">{String(value)}</p>
                </div>
              ))}
            </div>
          ) : reportData ? (
            <div className="space-y-4 report-details">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                {filteredReportEntries.map(([key, value]: [string, any]) => (
                  <div key={key} className="border-b border-gray-100 pb-2">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{formatLabel(key)}</p>
                    <p className="font-medium text-gray-900 mt-1">{String(value)}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-2">
                <Printer size={48} className="mx-auto opacity-50" />
              </div>
              <p className="text-gray-500">No report data available</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t mt-auto flex justify-between items-center bg-gray-50">
          <button 
            onClick={handleDeleteMatch}
            disabled={isDeleting}
            className="px-6 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition disabled:bg-red-400 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Trash2 size={18} />
            {isDeleting ? 'Deleting...' : 'Delete Match'}
          </button>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-6 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition">Close</button>
            <button 
              onClick={() => window.print()} 
              disabled={!reportData && selectedTab !== 'details'}
              className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition flex items-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              <Printer size={18} /> Print {selectedTab === 'details' ? 'Details' : 'Report'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReportViewer({ data, onClose, title, match }: any) {
  const headerTitle = title === 'matchday-1' || title?.toLowerCase().includes('matchday-1')
    ? 'MATCH DAY -1 REPORT'
    : title === 'day' || title?.toLowerCase().includes('day')
      ? 'MATCH DAY REPORT'
      : title?.toLowerCase().includes('incident')
        ? 'INCIDENT REPORT'
        : title || 'MATCH REPORT';

  const topMetadataKeys = ['home_team','id','match_id', 'away_team', 'date', 'venue', 'stadium', 'assigned_officer_name', 'assigned_officer', 'tournament', 'league','officer_email','report_id','created_at','updated_at','status','officer_name','submitted_at'];
  const reportEntries = Object.entries(data).filter(([key]) => !topMetadataKeys.includes(key));

  const m1FieldOrder = [
    'expected_attendance',
    'venue_meeting',
    'stewards_briefing',
    'red_line_precinct',
    'match_coordination',
    'voc_commander_cooperation',
    'stadium_authority_cooperation',
    'ple_delegation_cooperation',
    'overall_evaluation',
    'issues_description',
  ];

  const matchdayFieldOrder = [
    'attendance',
    'access_control',
    'staircases',
    'supporter_behavior',
    'official_behavior',
    'voc_interaction',
    'stadiumCleanliness',
    'securityDebrief',
    'loc_cooperation',
    'stadium_authority',
    'ple_delegation',
    'overall_evaluation',
    'issues_description',
  ];

  const incidentFieldOrder = [
    'incident_location',
    'incident_description',
    'incident_resolution',
    'additional_information',
  ];

  const fieldLabels: Record<string, string> = {
    expected_attendance: 'What is the expected stadium attendance? Give a Number.',
    venue_meeting: 'How was the venue Safety and Security meeting? Explain briefly.',
    stewards_briefing: 'How was the briefing of the stewards’ supervisors? Explain briefly.',
    control_measures: 'What are the control measures? Explain briefly.',
    match_coordination: 'How was the match coordination meeting? Explain briefly.',
    loc_cooperation: 'How was the cooperation and teamwork with the organizing committee? Explain briefly.',
    team_trainings: 'How was the cooperation and teamwork with the organizing committee? Explain briefly.',
    voc_commander_cooperation: 'How was the cooperation and teamwork with the Venue Operations Centre Commander? Explain briefly.',
    stadium_authority_cooperation: 'How was the cooperation and teamwork with the stadium authority? Explain briefly.',
    ple_delegation_cooperation: 'How was the cooperation and teamwork with the PLE Office? Explain briefly.',
    attendance: 'What was the stadium attendance? Give a Number.',
    access_control: 'How was the access control operation during the matchday? Explain briefly.',
    staircases: 'Were staircases and gangways clear of spectators? Explain briefly.',
    supporter_behavior: 'How was the general behavior of the supporters? Explain briefly.',
    official_behavior: 'How was the behavior of team officials? Explain briefly.',
    voc_interaction: 'How was the interaction with the venue operation centre (VOC)? Explain briefly.',
    stadium_cleanliness: 'Were the stadium surroundings clean? Explain briefly.',
    security_debrief: 'How was the general security debriefing? Explain briefly.',
    stadium_authority: 'How was the cooperation and teamwork with the stadium authority? Explain briefly.',
    ple_delegation: 'How was the cooperation and teamwork with the PLE delegation? Explain briefly.',
    incident_location: 'Where and when did the incident take place?',
    incident_description: 'Please specify as accurately as possible what happened.',
    incident_resolution: 'What actions were taken to resolve the incident?',
    additional_information: 'Please supply any additional information.',
    incident_photo_url: 'Incident Photo',
    overall_evaluation: 'What is your overall evaluation? Explain briefly.',
    issues_description: 'If there were any issues/concerns, please provide a description and evaluation of the resolution for each of the issues. Explain briefly.',
  };

  const isM1Report = /m-1|match day -1|m1/i.test(headerTitle);
  const isMatchdayReport = /match day report|matchday report|md-/i.test(headerTitle);
  const isIncidentReport = /incident report|incident/i.test(headerTitle);
  const orderedReportEntries = isM1Report
    ? [
        ...m1FieldOrder.filter((key) => key in data).map((key) => [key, (data as any)[key]]),
        ...reportEntries.filter(([key]) => !m1FieldOrder.includes(key)),
      ] as [string, any][]
    : isMatchdayReport
      ? [
          ...matchdayFieldOrder.filter((key) => key in data).map((key) => [key, (data as any)[key]]),
          ...reportEntries.filter(([key]) => !matchdayFieldOrder.includes(key)),
        ] as [string, any][]
      : isIncidentReport
        ? [
            ...incidentFieldOrder.filter((key) => key in data).map((key) => [key, (data as any)[key]]),
            ...reportEntries.filter(([key]) => !incidentFieldOrder.includes(key)),
          ] as [string, any][]
        : reportEntries;

  const formatReportLabel = (key: string) => fieldLabels[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[85vh] overflow-y-auto shadow-2xl p-8">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <h2 className="text-xl font-bold">{headerTitle}</h2>
          <button className="font-bold text-red-600" onClick={onClose}><X size={24}/></button>
        </div>

        <div id="printable-area" className="space-y-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between report-summary">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-sky-600 font-semibold">EFA Safety & Security</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-2">{headerTitle}</h3>
            </div>
            <img src="/efa_logo.png" alt="EFA Logo" className="w-20 h-20 object-contain self-end" />
          
          </div>

          {/* Match Metadata Top Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-700">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500 font-semibold mb-2">Match</p>
                <p className="text-lg font-semibold text-slate-900">{match.homeTeam || 'N/A'} vs {match.awayTeam || 'N/A'}</p>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500 font-semibold mb-2"></p>               
                <div className="grid grid-cols-2 gap-3 text-sm text-slate-700">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500 font-semibold">Tournament</p>
                    <p className="font-medium text-slate-900 mt-1">{match.tournament || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500 font-semibold">League</p>
                    <p className="font-medium text-slate-900 mt-1">{match.league || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500 font-semibold">Stadium</p>
                    <p className="font-medium text-slate-900 mt-1">{match.stadium || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500 font-semibold">Venue</p>
                    <p className="font-medium text-slate-900 mt-1">{match.venue || 'N/A'}</p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="grid grid-cols-2 gap-3 text-sm text-slate-700">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500 font-semibold">Date</p>
                    <p className="font-medium text-slate-900 mt-1">{match.date || 'N/A'}</p>
                  </div> 
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500 font-semibold">Officer</p>
                    <p className="font-medium text-slate-900 mt-1">{match.assignedOfficerName || match.assignedOfficer || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>

          <div className="grid grid-cols-1 gap-4 report-details">
            {orderedReportEntries.map(([key, val]: any) => (
              <div key={key} className="print-field border-b border-slate-200 pb-4">
                <p className="tracking-[0.05em] text-slate-500 font-semibold">{formatReportLabel(key)}</p>
                {key === 'incident_photo_url' && val ? (
                  <img 
                    src={supabase.storage.from('incident-photos').getPublicUrl(val).data.publicUrl} 
                    alt="Incident photo" 
                    className="max-w-full h-auto mt-2 rounded-lg shadow-md" 
                  />
                ) : (
                  <p className="font-medium text-gray-900 mt-2">{String(val)}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 flex gap-3">
          <button onClick={() => window.print()} className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-bold">Print/Save PDF</button>
          <button onClick={onClose} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-bold">Close</button>
        </div>
      </div>
    </div>
  );
}
