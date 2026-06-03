import { X, Printer } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { FIELD_LABELS, FIELD_ORDERS } from '../hooks/constants';
import { printReport } from '../utils/printReport';

export function ReportViewer({ data, onClose, title, match }: any) {
  const isM1 = /m-1|m1/i.test(title);
  const isDay = /match day report|md-/i.test(title);
  const isIncident = /incident/i.test(title);
  // 1. Precise Title Logic
  const getHeaderTitle = (t: string) => {
    const val = t.toLowerCase();
    if (val.includes('incident')) return 'INCIDENT REPORT';
    // M-1 must be checked before 'day' because it contains the word 'day'
    if (val.includes('m1') || val.includes('matchday-1') || val.includes('m-1')) return 'MATCH DAY -1 REPORT';
    if (val.includes('day')) return 'MATCH DAY REPORT';
    return 'MATCH REPORT';
  };

  const headerTitle = getHeaderTitle(title);
 // const headerTitle = isM1 ? 'MATCH DAY -1 REPORT' : isDay ? 'MATCH DAY REPORT' : isIncident ? 'INCIDENT REPORT' : 'MATCH REPORT';

  const orderKey = isM1 ? 'm1' : isDay ? 'day' : isIncident ? 'incident' : null;
  const order = orderKey ? FIELD_ORDERS[orderKey as keyof typeof FIELD_ORDERS] : [];
  
  const reportEntries = Object.entries(data).filter(([k]) => 
    !['match_no','home_team', 'id', 'match_id', 'away_team', 'date', 'venue', 'stadium', 'assigned_officer_name', 'assigned_officer', 'tournament', 'league', 'officer_email', 'report_id', 'created_at', 'updated_at', 'status', 'officer_name', 'submitted_at', 'match_date'].includes(k)
  );

  const orderedReportEntries = order.length > 0 
    ? [...order.filter(k => k in data).map(k => [k, data[k]]), ...reportEntries.filter(([k]) => !order.includes(k))]
    : reportEntries;

  const formatLabel = (key: string) => FIELD_LABELS[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());

  return (
    <div className="fixed inset-0 !bg-black/50 z-50 flex items-center justify-center p-4 print:static print:!bg-transparent print:!z-auto print:items-start print:justify-start print:p-0">
      <div className="!bg-white rounded-2xl w-full max-w-3xl max-h-[85vh] overflow-y-auto shadow-2xl p-8 print:max-h-full print:overflow-visible print:w-auto print:max-w-none print:shadow-none print:rounded-none print:p-0">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <h2 className="text-lg text-blue-900 font-bold">{headerTitle}</h2>
          <button onClick={onClose} className="p-2 text-red-600 hover:bg-gray-100 rounded-full"><X size={24}/></button>
        </div>

        <div id="printable-area" className="space-y-8">
          {/* Letterhead */}
          <div className="print-letterhead flex justify-between items-start border-b pb-6">
            <div className="print-letterhead-title">
              <p className="text-xs uppercase tracking-[0.3em] text-sky-600 font-semibold">EFA Safety & Security</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-2">{headerTitle}</h3>
            </div>
            <div className="print-letterhead-logo">
              <img src="/efa_logo.png" alt="EFA" className="w-16 h-16 object-contain" />
            </div>
          </div>

          {/* Match Metadata Top Section */}
          <div className="print-meta-block grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-700">
            <div className="print-meta-card rounded-2xl border border-slate-200 !bg-slate-50 p-4">
              <p className="meta-label text-xs uppercase tracking-[0.2em] text-slate-500 font-semibold mb-2">Match</p>
              <p className="meta-value text-lg font-semibold text-slate-900">{match.homeTeam || 'N/A'} vs {match.awayTeam || 'N/A'}</p>
              <div className="print-meta-grid grid grid-cols-2 gap-3 text-sm text-slate-700 mt-4">
                <div>
                  <p className="meta-label text-xs uppercase tracking-[0.2em] text-slate-500 font-semibold mb-1">Tournament</p>
                  <p className="meta-value font-medium text-slate-900">{match.tournament || 'N/A'}</p>
                </div>
                <div>
                  <p className="meta-label text-xs uppercase tracking-[0.2em] text-slate-500 font-semibold mb-1">League</p>
                  <p className="meta-value font-medium text-slate-900">{match.league || 'N/A'}</p>
                </div>
                <div>
                  <p className="meta-label text-xs uppercase tracking-[0.2em] text-slate-500 font-semibold mb-1">Stadium</p>
                  <p className="meta-value font-medium text-slate-900">{match.stadium || 'N/A'}</p>
                </div>
                <div>
                  <p className="meta-label text-xs uppercase tracking-[0.2em] text-slate-500 font-semibold mb-1">Venue</p>
                  <p className="meta-value font-medium text-slate-900">{match.venue || 'N/A'}</p>
                </div>
              </div>
            </div>
            <div className="print-meta-card rounded-2xl border border-slate-200 !bg-slate-50 p-4">
              <div className="print-meta-grid grid grid-cols-2 gap-3 text-sm text-slate-700">
                <div>
                  <p className="meta-label text-xs uppercase tracking-[0.2em] text-slate-500 font-semibold mb-1">Date</p>
                  <p className="meta-value font-medium text-slate-900">{match.date || 'N/A'}</p>
                </div>
                <div>
                  <p className="meta-label text-xs uppercase tracking-[0.2em] text-slate-500 font-semibold mb-1">Officer</p>
                  <p className="meta-value font-medium text-slate-900">{match.assignedOfficerName || match.assignedOfficer || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Dynamic Content */}
          <div className="space-y-4 print-fields">
            {orderedReportEntries.map(([key, val]: any) => (
              <div key={key} className="print-field-row border-b pb-3">
                <p className="print-field-label text-[10px] font-bold text-gray-400 uppercase tracking-widest">{formatLabel(key)}</p>
                {key === 'incident_photo_url' && val ? (
                  <img src={supabase.storage.from('incident-photos').getPublicUrl(val).data.publicUrl} className="print-image mt-2 h-48 rounded-lg border" />
                ) : (
                  <p className="print-field-value font-medium text-gray-900 mt-1">{String(val)}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 flex gap-3">
          <button onClick={onClose} className="flex-1 !bg-gray-100 text-gray-700 py-2 rounded-lg font-bold">Close</button>
          <button
            onClick={() => {
              const fileName = `${match.homeTeam || 'Home'} vs ${match.awayTeam || 'Away'} - ${headerTitle}`;
              printReport(fileName, 'printable-area');
            }} 
            className="px-6 py-2 !bg-blue-600 text-white font-semibold rounded-lg hover:!bg-blue-700 transition flex items-center gap-2 disabled:!bg-gray-400 disabled:cursor-not-allowed"
          >
            <Printer size={18} /> Print Report
          </button>

        </div>
      </div>
    </div>
  );
}
