import { useState, useEffect } from 'react';
import { X, Trash2, Printer } from 'lucide-react';
import { db, supabase } from '../lib/supabase';
import { ReportViewer } from './ReportViewer';
import { FIELD_LABELS, METADATA_KEYS } from '../hooks/constants';
import { printReport } from '../utils/printReport';

export function AdminDetailModal({ match, onClose, onDelete }: { match: any, onClose: () => void, onDelete?: () => void }) {
  const [selectedTab, setSelectedTab] = useState<'m1' | 'day' | 'incident'>('m1');
  const [reportData, setReportData] = useState<any>(null);
  const [availableReports, setAvailableReports] = useState<{ m1: boolean, day: boolean, incident: boolean }>({ m1: false, day: false, incident: false });
  const [isDeleting, setIsDeleting] = useState(false);

  // Check report availability
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

  const filteredReportEntries = reportData ? Object.entries(reportData).filter(([key]) => !METADATA_KEYS.includes(key)) : [];
  const formatLabel = (key: string) => FIELD_LABELS[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());

  const tabs = [
    { id: 'm1', label: 'M-1 Report', available: availableReports.m1 },
    { id: 'day', label: 'Matchday', available: availableReports.day },
    { id: 'incident', label: 'Incident', available: availableReports.incident }
  ];

  return (
    <>
      {/* If a report is selected and data is loaded, show the viewer */}
      {reportData && (
        <ReportViewer 
          data={reportData} 
          title={selectedTab} 
          match={match} 
          onClose={() => setSelectedTab('m1')} 
        />
      )}

      <div className="fixed inset-0 !bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="!bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
          <div className="p-6 border-b flex justify-between items-center !bg-white sticky top-0 z-10">
            <h2 className="text-lg text-blue-900 font-bold">Admin Review: {match.homeTeam} vs {match.awayTeam}</h2>
            <button onClick={onClose} className="p-2 text-red-600 hover:!bg-gray-100 rounded-full"><X size={24}/></button>
          </div>

        {/* Tab Navigation */}
        <div className="px-6 pt-4 border-b !bg-gray-50">
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id as any)}
                disabled={!tab.available}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  selectedTab === tab.id
                    ? '!bg-blue-600 text-white shadow-sm'
                    : tab.available
                      ? '!bg-white text-gray-700 hover:!bg-gray-100 border border-gray-200'
                      : '!bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
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
        <div  className="p-8 space-y-8 flex-1">
          <div className="space-y-6 report-summary">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-sky-600 font-semibold">EFA Safety & Security</p>
                <h3 className="text-2xl md:text-3xl font-bold text-slate-900 mt-2">
                  {selectedTab === 'm1' ? 'MATCH DAY -1 REPORT' : selectedTab === 'day' ? 'MATCH DAY REPORT' : 'INCIDENT REPORT'}
                </h3>
              </div>
              <img src="/efa_logo.png" alt="EFA Logo" className="w-20 h-20 object-contain self-end" />
            </div>
            {/* Match Metadata Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-700">
              <div className="rounded-2xl border border-slate-200 !bg-slate-50 p-4">
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
              <div className="rounded-2xl border border-slate-200 !bg-slate-50 p-4">
                <div className="grid grid-cols-2 gap-3 text-sm text-slate-700">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500 font-semibold">Match Date</p>
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

          {reportData ? (
            <div className="space-y-4 report-details">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                {filteredReportEntries.map(([k, v]: any) => (
                   <div key={k} className="border-b pb-2">
                     <p className="text-[12px] font-bold text-gray-600 uppercase tracking-widest">{formatLabel(k)}</p>
                     {k === 'incident_photo_url' && v ? (
                       <img src={supabase.storage.from('incident-photos').getPublicUrl(v).data.publicUrl} className="mt-2 h-32 rounded-lg border" />
                     ) : (
                       <p className="font-medium text-gray-900 mt-1">{String(v ?? 'N/A')}</p>
                     )}
                   </div>
                 ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-2">
                <Printer size={48} className="mx-auto opacity-50" />
              </div>
              <p className="text-gray-500">Loading report data....</p>
            </div>
          )}
        </div>

          <div className="p-6 border-t flex justify-between items-center !bg-gray-50">
            <button 
              onClick={handleDeleteMatch} 
              disabled={isDeleting} 
              className="flex items-center gap-2 text-red-600 font-bold hover:text-red-700 transition"
            >
              <Trash2 size={18} /> {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
            
            <div className="flex gap-3">
              <button 
                onClick={onClose} 
                className="px-6 py-2 text-gray-800 font-semibold rounded-lg  hover:text-red-700 transition"
              >
                Close
              </button>
              
              {/* This Print button triggers the browser print for the ReportViewer content */}
              <button 
                onClick={() => {
                  const el = document.getElementById('printable-area');
                  const fileName = `${match.homeTeam || 'Home'} vs ${match.awayTeam || 'Away'} - ${selectedTab === 'm1' ? 'MATCH DAY -1 REPORT' : selectedTab === 'day' ? 'MATCH DAY REPORT' : 'INCIDENT REPORT'}
`;
                  if (el) {
                    printReport(fileName, 'printable-area');
                  } else {
                    window.print();
                  }
                }} 
                className="px-6 py-2 !bg-blue-600 text-white font-semibold rounded-lg hover:!bg-blue-700 transition flex items-center gap-2"
              >
                <Printer size={18} /> Print Report
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
