import { X, Eye, Plus, Pencil, ClipboardList, FileText, ShieldAlert } from 'lucide-react';
import ReactDOM from 'react-dom';

export default function MatchActionsModal({ match, onClose, onEdit, onView, availableReports = {} }: any) {
  const forms = [
    { id: 'm1', label: 'Matchday-1 Form', path: '/match-day-minus1', icon: <ClipboardList size={18}/> },
    { id: 'day', label: 'Matchday Form', path: '/match-day', icon: <FileText size={18}/> },
    { id: 'incident', label: 'Incident Report', path: '/incident-report', icon: <ShieldAlert size={18}/> }
  ];

  // Determine which forms are available based on status
  const isFormEnabled = (formId: string) => {
    if (match.status === 'M-1 Pending') {
      return formId === 'm1'; // Only M-1 form available
    }
    if (match.status === 'Active') {
      return true; // All forms available
    }
    return true; // Default: all available for other statuses
  };

  // Check if a report exists for viewing
  const isReportAvailable = (formId: string) => {
    return availableReports[formId] === true;
  };

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="match-actions-title"
        className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl sm:p-6"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h3 id="match-actions-title" className="text-lg font-bold text-slate-900">Match actions</h3>
            <p className="mt-1 text-sm text-slate-600">{match.homeTeam} <span className="text-slate-400">vs</span> {match.awayTeam}</p>
            {match.status && (
              <p className="mt-1 text-xs font-medium text-slate-500">{match.status}</p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close match actions"
            className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
          >
            <X size={20} />
          </button>
        </div>

        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Reports and forms</p>
        <div className="space-y-3">
          {forms.map((f) => {
            const enabled = isFormEnabled(f.id);
            const reportExists = isReportAvailable(f.id);
            return (
              <div
                key={f.id}
                className={`flex flex-col gap-3 rounded-xl border p-3 sm:flex-row sm:items-center sm:justify-between ${
                  enabled ? 'border-slate-200 bg-white' : 'border-slate-200 bg-slate-50'
                }`}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                    enabled ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-400'
                  }`}>{f.icon}</div>
                  <span className={`text-sm font-semibold ${enabled ? 'text-slate-800' : 'text-slate-400'}`}>{f.label}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:shrink-0">
                  <button
                    onClick={() => reportExists && onView(match, f.id, f.label)}
                    disabled={!reportExists}
                    aria-label={reportExists ? `View ${f.label}` : `No report available for ${f.label}`}
                    className={`inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                      reportExists
                        ? 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'
                        : 'cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400'
                    }`}
                  >
                    <Eye size={16} />
                    View
                  </button>
                  <button
                    onClick={() => enabled && onEdit(match, f.path)}
                    disabled={!enabled}
                    aria-label={enabled ? `${reportExists ? 'Modify' : 'Add'} ${f.label}` : `${f.label} unavailable`}
                    className={`inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                      enabled
                        ? 'border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                        : 'cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400'
                    }`}
                  >
                    {reportExists ? <Pencil size={16} /> : <Plus size={16} />}
                    {reportExists ? 'Modify' : 'Add'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>,
    document.body
  );
}
