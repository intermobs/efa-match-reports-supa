import { X, Eye, Edit2, ClipboardList, FileText, ShieldAlert } from 'lucide-react';
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
    <div className="fixed inset-0 !bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="!bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="font-bold text-lg text-gray-900">Available Forms</h3>
            <p className="text-xs text-gray-500">{match.homeTeam} vs {match.awayTeam}</p>
          </div>
          <button onClick={onClose} className="p-2 text-red-600 hover:!bg-red-100 rounded-full"><X size={20}/></button>
        </div>

        <div className="space-y-4">
          {forms.map((f) => {
            const enabled = isFormEnabled(f.id);
            const reportExists = isReportAvailable(f.id);
            return (
              <div key={f.id} className={`p-3 !bg-gray-50 rounded-xl border transition-all ${enabled ? 'border-gray-100' : 'border-gray-200 opacity-50'} flex items-center justify-between`}>
                <div className="flex items-center gap-3">
                  <div className={enabled ? 'text-blue-600' : 'text-gray-400'}>{f.icon}</div>
                  <span className={`text-sm font-semibold ${enabled ? 'text-gray-700' : 'text-gray-400'}`}>{f.label}</span>
                </div>
                <div className="flex gap-4">
                {/* --- View Report Group --- */}
                <div className="flex flex-col items-center gap-1">
                  <button
                    onClick={() => reportExists && onView(match, f.id, f.label)}
                    disabled={!reportExists}
                    title={reportExists ? 'View report' : 'No report available'}
                    className={`p-2 rounded transition-colors ${
                      reportExists
                        ? 'hover:!bg-blue-100 text-blue-600 cursor-pointer'
                        : 'text-gray-300 cursor-not-allowed'
                    }`}
                  >
                    <Eye size={20} />
                  </button>
                  <span
                    className={`text-xs font-medium ${
                      reportExists ? 'text-blue-700' : 'text-gray-400'
                    }`}
                  >
                    View
                  </span>
                </div>
                {/* --- Edit Form Group --- */}
                <div className="flex flex-col items-center gap-1">
                  <button
                    onClick={() => enabled && onEdit(match, f.path)}
                    disabled={!enabled}
                    title={enabled ? 'Edit form' : 'Form not available in current status'}
                    className={`p-2 rounded transition-colors ${
                      enabled
                        ? 'hover:!bg-indigo-100 text-indigo-600 cursor-pointer'
                        : 'text-gray-300 cursor-not-allowed'
                    }`}
                  >
                    <Edit2 size={20} />
                  </button>
                  <span
                    className={`text-xs font-medium ${
                      enabled ? 'text-indigo-700' : 'text-gray-400'
                    }`}
                  >
                    Fill/Edit
                  </span>
                </div>
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
