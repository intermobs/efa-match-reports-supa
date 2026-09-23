import { useEffect, useMemo, useState } from 'react';
import {ArrowLeft, Building2, Check, ChevronRight, Edit3, Layers3, Plus, Search, Trash2, Trophy, Users, X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DashboardHeader from '../components/DashboardHeader';
import { db, getCurrentUser } from '../lib/supabase';

type ResourceKey = 'teams' | 'tournaments' | 'leagues';
type ReferenceRecord = { id: string; name: string; shortName: string; status: 'Active' | 'Inactive'; details: string };
type ResourceConfig = {
  key: ResourceKey;
  title: string;
  singular: string;
  description: string;
  icon: typeof Users;
  accent: string;
  fields: { label: string; key: 'name' | 'shortName' | 'details'; placeholder: string }[];
};

const resourceConfigs: ResourceConfig[] = [
  { key: 'teams', title: 'Teams', singular: 'Team', description: 'Clubs and teams available when creating a match.', icon: Users, accent: 'blue', fields: [{ label: 'Team name', key: 'name', placeholder: 'e.g. Al Ahly SC' }, { label: 'Short code', key: 'shortName', placeholder: 'e.g. AHL' }, { label: 'Notes', key: 'details', placeholder: 'Optional location or competition notes' }] },
  { key: 'tournaments', title: 'Tournaments', singular: 'Tournament', description: 'Tournament competitions used for match scheduling.', icon: Trophy, accent: 'amber', fields: [{ label: 'Tournament name', key: 'name', placeholder: 'e.g. CAF Champions League' }, { label: 'Short code', key: 'shortName', placeholder: 'e.g. CAFCL' }, { label: 'Notes', key: 'details', placeholder: 'Optional season or organiser notes' }] },
  { key: 'leagues', title: 'Leagues', singular: 'League', description: 'League competitions and their participating teams.', icon: Layers3, accent: 'emerald', fields: [{ label: 'League name', key: 'name', placeholder: 'e.g. Egyptian Premier League' }, { label: 'Short code', key: 'shortName', placeholder: 'e.g. EPL' }, { label: 'Notes', key: 'details', placeholder: 'Optional season or organiser notes' }] },
];

const starterRecords: Record<ResourceKey, ReferenceRecord[]> = {
  teams: [
    { id: 'team-green-mamba', name: 'Green Mamba FC', shortName: 'GRM', status: 'Active', details: 'Manzini, Eswatini' },
    { id: 'team-nsingizini', name: 'Nsingizini Hotspurs FC', shortName: 'NSN', status: 'Active', details: 'Hlatsi, Eswatini' },
  ],
  tournaments: [{ id: 'tournament-cafcl', name: 'CAF Champions League', shortName: 'CAFCL', status: 'Active', details: 'Continental competition' }],
  leagues: [{ id: 'league-epl', name: 'MTN Premier League', shortName: 'PLE', status: 'Active', details: 'Domestic league competition' }],
};

const accentStyles = {
  blue: { card: 'border-blue-100 hover:border-blue-300', icon: 'bg-blue-50 text-blue-700 ring-blue-100', count: 'text-blue-700', button: 'bg-blue-600 hover:bg-blue-700' },
  amber: { card: 'border-amber-100 hover:border-amber-300', icon: 'bg-amber-50 text-amber-700 ring-amber-100', count: 'text-amber-700', button: 'bg-amber-600 hover:bg-amber-700' },
  emerald: { card: 'border-emerald-100 hover:border-emerald-300', icon: 'bg-emerald-50 text-emerald-700 ring-emerald-100', count: 'text-emerald-700', button: 'bg-emerald-600 hover:bg-emerald-700' },
};
const storageKey = 'efa-reference-data';

function readStoredRecords(): Record<ResourceKey, ReferenceRecord[]> {
  try {
    const stored = window.localStorage.getItem(storageKey);
    return stored ? JSON.parse(stored) : starterRecords;
  } catch {
    return starterRecords;
  }
}

function ReferenceEditor({ config, record, onClose, onSave }: { config: ResourceConfig; record: ReferenceRecord | null; onClose: () => void; onSave: (record: ReferenceRecord) => void }) {
  const [form, setForm] = useState<ReferenceRecord>(record ?? { id: '', name: '', shortName: '', status: 'Active', details: '' });
  const styles = accentStyles[config.accent as keyof typeof accentStyles];
  const updateField = (key: keyof ReferenceRecord, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name.trim() || !form.shortName.trim()) return;
    onSave({ ...form, id: form.id || `${config.key}-${Date.now()}`, name: form.name.trim(), shortName: form.shortName.trim().toUpperCase(), details: form.details.trim() });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="reference-editor-title">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5"><div><p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">{record ? 'Edit record' : 'New record'}</p><h2 id="reference-editor-title" className="mt-1 text-xl font-bold text-slate-900">{record ? `Edit ${config.singular}` : `Add ${config.singular}`}</h2></div><button type="button" onClick={onClose} aria-label="Close dialog" className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"><X size={20} /></button></div>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 px-6 py-6">
            {config.fields.map((field) => <label key={field.key} className="block"><span className="mb-1.5 block text-sm font-semibold text-slate-700">{field.label}{field.key !== 'details' && <span className="text-red-500"> *</span>}</span>{field.key === 'details' ? <textarea value={form[field.key]} onChange={(event) => updateField(field.key, event.target.value)} placeholder={field.placeholder} rows={3} className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100" /> : <input value={form[field.key]} onChange={(event) => updateField(field.key, event.target.value)} placeholder={field.placeholder} required className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100" />}</label>)}
            <label className="block"><span className="mb-1.5 block text-sm font-semibold text-slate-700">Status</span><select value={form.status} onChange={(event) => updateField('status', event.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"><option>Active</option><option>Inactive</option></select></label>
          </div>
          <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4"><button type="button" onClick={onClose} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-200">Cancel</button><button type="submit" className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition ${styles.button}`}><Check size={16} />{record ? 'Save changes' : 'Add record'}</button></div>
        </form>
      </div>
    </div>
  );
}

function DeleteConfirmation({ config, record, onClose, onConfirm }: { config: ResourceConfig; record: ReferenceRecord; onClose: () => void; onConfirm: () => void }) {
  return <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm" role="alertdialog" aria-modal="true" aria-labelledby="delete-title"><div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600"><Trash2 size={21} /></div><h2 id="delete-title" className="mt-5 text-xl font-bold text-slate-900">Delete {config.singular.toLowerCase()}?</h2><p className="mt-2 text-sm leading-6 text-slate-500">This will remove <strong className="text-slate-700">{record.name}</strong> from the {config.title.toLowerCase()} list. Existing reports are not affected.</p><div className="mt-6 flex justify-end gap-3"><button type="button" onClick={onClose} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100">Keep record</button><button type="button" onClick={onConfirm} className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700">Delete record</button></div></div></div>;
}

export default function SettingsPage() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<Record<ResourceKey, ReferenceRecord[]>>(starterRecords);
  const [activeResource, setActiveResource] = useState<ResourceKey>('teams');
  const [search, setSearch] = useState('');
  const [editor, setEditor] = useState<{ config: ResourceConfig; record: ReferenceRecord | null } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ config: ResourceConfig; record: ReferenceRecord } | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      const user = await getCurrentUser();
      if (!user) { navigate('/login', { replace: true }); return; }
      const { data: profile } = await db.from('users').select('full_name, role, region').eq('id', user.id).maybeSingle();
      if (profile?.role !== 'admin') { navigate('/dashboard', { replace: true }); return; }
      setCurrentUser(user); setUserProfile(profile); setRecords(readStoredRecords()); setLoading(false);
    };
    loadProfile().catch(() => navigate('/dashboard', { replace: true }));
  }, [navigate]);

  const selectedConfig = resourceConfigs.find((config) => config.key === activeResource) ?? resourceConfigs[0];
  const visibleRecords = useMemo(() => { const query = search.trim().toLowerCase(); return records[activeResource].filter((record) => !query || `${record.name} ${record.shortName} ${record.details}`.toLowerCase().includes(query)); }, [activeResource, records, search]);
  const persistRecords = (nextRecords: Record<ResourceKey, ReferenceRecord[]>) => { setRecords(nextRecords); window.localStorage.setItem(storageKey, JSON.stringify(nextRecords)); };
  const saveRecord = (record: ReferenceRecord) => { const existing = records[activeResource].some((item) => item.id === record.id); const next = existing ? records[activeResource].map((item) => item.id === record.id ? record : item) : [record, ...records[activeResource]]; persistRecords({ ...records, [activeResource]: next }); setEditor(null); };
  const deleteRecord = () => { if (!deleteTarget) return; persistRecords({ ...records, [deleteTarget.config.key]: records[deleteTarget.config.key].filter((item) => item.id !== deleteTarget.record.id) }); setDeleteTarget(null); };

  if (loading || !currentUser || !userProfile) return null;
  return (
    <div className="flex min-h-screen w-screen flex-col bg-slate-50">
      <DashboardHeader userId={currentUser.id} userName={userProfile.full_name || currentUser.email?.split('@')[0] || 'Admin'} userEmail={currentUser.email || 'No email'} userRole={userProfile.role} userRegion={userProfile.region || ''} notifications={[]} onLogout={() => navigate('/login')} />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <button type="button" onClick={() => navigate('/dashboard')} className="mb-7 inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-slate-500 transition hover:bg-white hover:text-slate-900"><ArrowLeft size={16} />Back to dashboard</button>
        <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end"></div>
        <section aria-labelledby="management-heading"><div className="mb-4"><h2 id="management-heading" className="text-lg font-bold text-slate-900">Manage reference data</h2><p className="mt-1 text-sm text-slate-500">Choose an area to add, update, or remove available options.</p></div><div className="grid gap-4 md:grid-cols-3">{resourceConfigs.map((config) => { const Icon = config.icon; const styles = accentStyles[config.accent as keyof typeof accentStyles]; const isSelected = config.key === activeResource; return <button key={config.key} type="button" onClick={() => { setActiveResource(config.key); setSearch(''); }} className={`group flex min-h-44 flex-col items-start rounded-2xl border bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${styles.card} ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}><span className={`mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl ring-1 ${styles.icon}`}><Icon size={21} /></span><span className="flex w-full items-start justify-between gap-3"><span><span className="block text-base font-bold text-slate-900">{config.title}</span><span className="mt-1 block text-sm leading-5 text-slate-500">{config.description}</span></span><ChevronRight size={18} className="mt-0.5 shrink-0 text-slate-300 transition group-hover:translate-x-0.5" /></span><span className={`mt-auto pt-4 text-xs font-bold uppercase tracking-[0.12em] ${styles.count}`}>{records[config.key].length} {records[config.key].length === 1 ? 'record' : 'records'}</span></button>; })}</div></section>
        <section className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm" aria-labelledby="records-heading"><div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Active workspace</p><h2 id="records-heading" className="mt-1 text-xl font-bold text-slate-900">{selectedConfig.title}</h2></div><button type="button" onClick={() => setEditor({ config: selectedConfig, record: null })} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"><Plus size={17} />Add {selectedConfig.singular}</button></div><div className="border-b border-slate-100 bg-slate-50/70 p-4 sm:p-5"><label className="relative block max-w-md"><Search size={17} className="absolute left-3.5 top-3 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`Search ${selectedConfig.title.toLowerCase()}...`} className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /></label></div><div className="divide-y divide-slate-100">{visibleRecords.length > 0 ? visibleRecords.map((record) => <div key={record.id} className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"><div className="flex min-w-0 items-center gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-sm font-bold text-slate-600">{record.shortName.slice(0, 2)}</div><div className="min-w-0"><p className="truncate font-semibold text-slate-900">{record.name}</p><p className="truncate text-sm text-slate-500">{record.details || 'No notes added'}</p></div></div><div className="flex items-center justify-between gap-4 sm:justify-end"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${record.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{record.status}</span><div className="flex gap-1"><button type="button" onClick={() => setEditor({ config: selectedConfig, record })} aria-label={`Edit ${record.name}`} className="rounded-lg p-2 text-slate-400 transition hover:bg-blue-50 hover:text-blue-600"><Edit3 size={17} /></button><button type="button" onClick={() => setDeleteTarget({ config: selectedConfig, record })} aria-label={`Delete ${record.name}`} className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"><Trash2 size={17} /></button></div></div></div>) : <div className="px-6 py-14 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400"><Search size={20} /></div><h3 className="mt-4 font-semibold text-slate-900">No {selectedConfig.title.toLowerCase()} found</h3><p className="mt-1 text-sm text-slate-500">Try a different search or add a new {selectedConfig.singular.toLowerCase()}.</p></div>}</div></section>
        <section className="mt-8 flex gap-4 rounded-2xl border border-dashed border-slate-300 bg-white/70 p-5 sm:p-6"><div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 sm:flex"><Building2 size={19} /></div><div><h2 className="font-bold text-slate-900">More administration controls</h2><p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">This workspace is ready to expand with venues, competition seasons, match statuses, and reporting options as their database tables are introduced.</p></div></section>
      </main>
      {editor && <ReferenceEditor config={editor.config} record={editor.record} onClose={() => setEditor(null)} onSave={saveRecord} />}
      {deleteTarget && <DeleteConfirmation config={deleteTarget.config} record={deleteTarget.record} onClose={() => setDeleteTarget(null)} onConfirm={deleteRecord} />}
    </div>
  );
}
