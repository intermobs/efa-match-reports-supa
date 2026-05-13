import { X, Eye, Edit2, ClipboardList, FileText, ShieldAlert } from 'lucide-react';

export default function MatchActionsModal({ match, onClose, onEdit, onView }: any) {
  const forms = [
    { id: 'm1', label: 'Matchday-1 Form', path: '/match-day-minus1', icon: <ClipboardList size={18}/> },
    { id: 'day', label: 'Matchday Form', path: '/match-day', icon: <FileText size={18}/> },
    { id: 'incident', label: 'Incident Report', path: '/incident-report', icon: <ShieldAlert size={18}/> }
  ];

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="!bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="font-bold text-lg text-gray-900">Available Forms</h3>
            <p className="text-xs text-gray-500">{match.homeTeam} vs {match.awayTeam}</p>
          </div>
          <button onClick={onClose} className="p-2 text-red-600 hover:!bg-red-100 rounded-full"><X size={20}/></button>
        </div>

        <div className="space-y-4">
          {forms.map((f) => (
            <div key={f.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-blue-600">{f.icon}</div>
                <span className="text-sm font-semibold text-gray-700">{f.label}</span>
              </div>
              <div className="flex gap-1">
                <button onClick={() => onView(match, f.id, f.label)} className="p-1.5 hover:bg-blue-100 text-blue-600 rounded"><Eye size={16} /></button>
                <button onClick={() => onEdit(match, f.path)} className="p-1.5 hover:bg-indigo-100 text-indigo-600 rounded"><Edit2 size={16} /></button>             
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
