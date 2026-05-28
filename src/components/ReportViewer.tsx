import { X, Printer } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { FIELD_LABELS, FIELD_ORDERS } from '../hooks/constants';

export function ReportViewer({ data, onClose, title, match }: any) {
  const isM1 = /m-1|m1/i.test(title);
  const isDay = /match day report|md-/i.test(title);
  const isIncident = /incident/i.test(title);
  
  const headerTitle = isM1 ? 'MATCH DAY -1 REPORT' : isDay ? 'MATCH DAY REPORT' : isIncident ? 'INCIDENT REPORT' : 'MATCH REPORT';

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
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[85vh] overflow-y-auto shadow-2xl p-8">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <h2 className="text-xl font-bold">{headerTitle}</h2>
          <button onClick={onClose} className="text-red-600"><X size={24}/></button>
        </div>

        <div id="printable-area" className="space-y-8">
          {/* Letterhead */}
          <div className="flex justify-between items-start border-b pb-6">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-sky-600 font-semibold">EFA Safety & Security</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-2">{headerTitle}</h3>
            </div>
            <img src="/efa_logo.png" alt="EFA" className="w-16 h-16 object-contain" />
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

          {/* Dynamic Content */}
          <div className="space-y-4">
            {orderedReportEntries.map(([key, val]: any) => (
              <div key={key} className="border-b pb-3">
                <p className="text-xs font-bold text-gray-400 uppercase">{formatLabel(key)}</p>
                {key === 'incident_photo_url' && val ? (
                  <img src={supabase.storage.from('incident-photos').getPublicUrl(val).data.publicUrl} className="mt-2 h-48 rounded-lg" />
                ) : (
                  <p className="font-medium text-gray-900 mt-1">{String(val)}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 flex gap-3">
          <button onClick={onClose} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-bold">Close</button>
          <button 
            onClick={() => window.print()} 
            className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition flex items-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <Printer size={18} /> Print Report
          </button>

        </div>
      </div>
    </div>
  );
}
