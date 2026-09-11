/* eslint-disable */
/* @ts-nocheck */

type OfficerDirectoryModalProps = {
  officers: any[];
  onClose: () => void;
};

export function OfficerDirectoryModal({ officers, onClose }: OfficerDirectoryModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 !bg-slate-900/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-[28px] !bg-white shadow-2xl overflow-hidden border border-slate-200">
        <div className="flex items-center justify-between gap-4 p-6 border-b border-slate-200">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-sky-600 font-semibold">Registered Officers</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-2">Officer Directory</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
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
                  <p className="text-sm font-bold text-slate-700">{officer.completed ?? 0}</p>
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
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-full !bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
