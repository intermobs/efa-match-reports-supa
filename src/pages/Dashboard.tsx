import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Plus, X, Trophy, Users, Clock } from 'lucide-react';
import { db, getCurrentUser } from '../lib/supabase';
import Select from 'react-select';
import MatchActionsModal from '../components/MatchActionsModal'; // Ensure this exists
import DashboardHeader from '../components/DashboardHeader';
import { TOURNAMENTS, LEAGUES, TEAMS, VENUES, STADIUMS } from '../hooks/constants';
//import html2pdf from 'html2pdf.js';
import { AdminDetailModal } from '../components/AdminDetailModal';
import { ReportViewer } from '../components/ReportViewer';

type NotificationItem = {
  id: string;
  message: string;
  time: string;
  read?: boolean;
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
                  className="p-4 md:p-6 flex flex-col md:flex-row md:justify-between md:items-center gap-4 hover:!bg-gray-50 cursor-pointer transition border-b md:border-b-0"
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
                        match.status === 'Active' ? '!bg-blue-100 text-blue-700' : 
                        match.status === 'Completed' ? '!bg-green-100 text-green-700' : '!bg-yellow-100 text-yellow-700'
                      }`}>
                        {match.status}
                      </span>
                      {match.hasIncident && (
                        <span className="px-3 py-1 rounded-full text-xs font-bold !bg-red-100 text-red-700">
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
    <Select options={TOURNAMENTS} menuPortalTarget={document.body} placeholder="Tournament" styles={selectStyles} onChange={(v: any) => setData({...data, tournament: v.label})} />
    <Select options={LEAGUES} menuPortalTarget={document.body} placeholder="League" styles={selectStyles} onChange={(v: any) => setData({...data, league: v.label})} />
    <Select options={TEAMS} menuPortalTarget={document.body} placeholder="Home Team" styles={selectStyles} onChange={(v: any) => setData({...data, homeTeam: v.value})}/>
    <Select options={TEAMS} menuPortalTarget={document.body} placeholder="Away Team" styles={selectStyles} onChange={(v: any) => setData({...data, awayTeam: v.value})}/>
    <input type="date" className="p-2 border border-gray-200 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" onChange={e => setData({...data, date: e.target.value})} />
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
