import { useEffect, useMemo, useState } from 'react';
import {ArrowLeft, Check, ChevronRight, Edit3, Layers3, Plus, Search, Trash2, Trophy, Users, X,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import DashboardHeader from '../components/DashboardHeader';
import { db, getCurrentUser } from '../lib/supabase';
import { normalizeTeamCategory, TEAMS } from '../hooks/constants';

type ResourceKey = 'teams' | 'tournaments' | 'leagues';
type SettingsArea = ResourceKey | 'officers';
type ReferenceRecord = { id: string; name: string; shortName: string; status: 'Active' | 'Inactive'; details: string; category?: string };
type Officer = { id: string; full_name: string | null; email: string | null; region: string | null; status: 'Active' | 'Inactive' };
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
  { key: 'teams', title: 'Teams', singular: 'Team', description: 'Teams grouped by competition category.', icon: Users, accent: 'blue', fields: [{ label: 'Team name', key: 'name', placeholder: 'e.g. Green Mamba FC' }] },
  { key: 'tournaments', title: 'Tournaments', singular: 'Tournament', description: 'Tournament competitions used for match scheduling.', icon: Trophy, accent: 'amber', fields: [{ label: 'Tournament name', key: 'name', placeholder: 'e.g. CAF Champions League' }, { label: 'Short code', key: 'shortName', placeholder: 'e.g. CAFCL' }, { label: 'Notes', key: 'details', placeholder: 'Optional season or organiser notes' }] },
  { key: 'leagues', title: 'Leagues', singular: 'League', description: 'League competitions and their participating teams.', icon: Layers3, accent: 'emerald', fields: [{ label: 'League name', key: 'name', placeholder: 'e.g. Egyptian Premier League' }, { label: 'Short code', key: 'shortName', placeholder: 'e.g. EPL' }, { label: 'Notes', key: 'details', placeholder: 'Optional season or organiser notes' }] },
];

const starterRecords: Record<ResourceKey, ReferenceRecord[]> = {
  teams: TEAMS.flatMap((group) => group.options.map((team) => ({
    id: `team-${group.label}-${team.value}`,
    name: team.label,
    shortName: team.value,
    status: 'Active' as const,
    details: '',
    category: group.label,
  }))),
  tournaments: [{ id: 'tournament-cafcl', name: 'CAF Champions League', shortName: 'CAFCL', status: 'Active', details: 'Continental competition' }],
  leagues: [{ id: 'league-epl', name: 'MTN Premier League', shortName: 'PLE', status: 'Active', details: 'Domestic league competition' }],
};

const accentStyles = {
  blue: { card: 'border-blue-100 hover:border-blue-300', icon: 'bg-blue-50 text-blue-700 ring-blue-100', count: 'text-blue-700', button: 'bg-blue-600 hover:bg-blue-700' },
  amber: { card: 'border-amber-100 hover:border-amber-300', icon: 'bg-amber-50 text-amber-700 ring-amber-100', count: 'text-amber-700', button: 'bg-amber-600 hover:bg-amber-700' },
  emerald: { card: 'border-emerald-100 hover:border-emerald-300', icon: 'bg-emerald-50 text-emerald-700 ring-emerald-100', count: 'text-emerald-700', button: 'bg-emerald-600 hover:bg-emerald-700' },
};
const managementAreas: { key: SettingsArea; title: string; description: string; icon: typeof Users; accent: keyof typeof accentStyles }[] = [
  { key: 'officers', title: 'Officers', description: 'View and update registered officer accounts.', icon: Users, accent: 'blue' },
  ...resourceConfigs,
];
const storageKey = 'efa-reference-data';
const getTeamRecordId = (category: string, name: string) =>
  `team-${category}-${name}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const sortTeams = (teams: ReferenceRecord[]) => teams.sort((a, b) => {
  const categoryIndex = (category?: string) => {
    const index = TEAMS.findIndex((group) => group.label === category);
    return index === -1 ? TEAMS.length : index;
  };
  return categoryIndex(a.category) - categoryIndex(b.category) || a.name.localeCompare(b.name);
});

function readStoredRecords(): Record<ResourceKey, ReferenceRecord[]> {
  try {
    const stored = window.localStorage.getItem(storageKey);
    if (!stored) return starterRecords;
    const saved = JSON.parse(stored) as Partial<Record<ResourceKey, ReferenceRecord[]>> & {
      teamsManaged?: boolean;
      teamsCategoryVersion?: number;
    };
    const savedTeams = saved.teams ?? [];
    if (saved.teamsManaged) {
      const managedTeams = savedTeams.map((team) => {
        const category = normalizeTeamCategory(team.category);
        return { ...team, id: getTeamRecordId(category, team.name), category };
      });
      const newNationalTeams = saved.teamsCategoryVersion === 1 ? [] : TEAMS
        .filter((group) => /^National Teams - U(15|17|20|23)$/.test(group.label))
        .flatMap((group) => managedTeams.some((team) => team.category === group.label)
          ? []
          : starterRecords.teams.filter((team) => team.category === group.label));
      return {
        ...starterRecords,
        ...saved,
        teams: sortTeams([...managedTeams, ...newNationalTeams]),
      };
    }
    const teams = starterRecords.teams.map((team) => {
      const savedTeam = savedTeams.find((item) =>
        (item.name === team.name || item.shortName === team.shortName) &&
        normalizeTeamCategory(item.category) === team.category
      );
      return savedTeam
        ? { ...team, ...savedTeam, id: getTeamRecordId(team.category || TEAMS[0].label, team.name), category: team.category }
        : team;
    });
    const customTeams = savedTeams
      .filter((item) => !starterRecords.teams.some((team) =>
        (team.name === item.name || team.shortName === item.shortName) &&
        normalizeTeamCategory(item.category) === team.category
      ))
      .map((team) => {
        const category = normalizeTeamCategory(team.category);
        return { ...team, id: getTeamRecordId(category, team.name), category };
      });
    return { ...starterRecords, ...saved, teams: sortTeams([...teams, ...customTeams]) };
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
    if (!form.name.trim() || (config.key !== 'teams' && !form.shortName.trim())) return;
    onSave({
      ...form,
      id: form.id || `${config.key}-${Date.now()}`,
      name: form.name.trim(),
      shortName: config.key === 'teams' ? (form.shortName || form.name).trim() : form.shortName.trim().toUpperCase(),
      details: form.details.trim(),
      ...(config.key === 'teams' ? { category: form.category || TEAMS[0].label } : {}),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="reference-editor-title">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5"><div><p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">{record ? 'Edit record' : 'New record'}</p><h2 id="reference-editor-title" className="mt-1 text-xl font-bold text-slate-900">{record ? `Edit ${config.singular}` : `Add ${config.singular}`}</h2></div><button type="button" onClick={onClose} aria-label="Close dialog" className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"><X size={20} /></button></div>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 px-6 py-6">
            {config.fields.map((field) => <label key={field.key} className="block"><span className="mb-1.5 block text-sm font-semibold text-slate-700">{field.label}{field.key !== 'details' && <span className="text-red-500"> *</span>}</span>{field.key === 'details' ? <textarea value={form[field.key]} onChange={(event) => updateField(field.key, event.target.value)} placeholder={field.placeholder} rows={3} className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100" /> : <input value={form[field.key]} onChange={(event) => updateField(field.key, event.target.value)} placeholder={field.placeholder} required className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100" />}</label>)}
            {config.key === 'teams' ? (
              <label className="block"><span className="mb-1.5 block text-sm font-semibold text-slate-700">Competition category</span><select value={form.category || TEAMS[0].label} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100">{TEAMS.map((group) => <option key={group.label} value={group.label}>{group.label}</option>)}</select></label>
            ) : (
              <label className="block"><span className="mb-1.5 block text-sm font-semibold text-slate-700">Status</span><select value={form.status} onChange={(event) => updateField('status', event.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"><option>Active</option><option>Inactive</option></select></label>
            )}
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

function OfficerEditor({ officer, onClose, onSave }: { officer: Officer; onClose: () => void; onSave: (officer: Officer, profile: { full_name: string; region: string; status: Officer['status'] }) => Promise<void> }) {
  const [fullName, setFullName] = useState(officer.full_name ?? '');
  const [region, setRegion] = useState(officer.region ?? '');
  const [status, setStatus] = useState(officer.status);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!fullName.trim()) return;
    setSaving(true);
    setError('');
    try {
      await onSave(officer, { full_name: fullName.trim(), region: region.trim(), status });
    } catch (saveError) {
      console.error('Error updating officer profile:', saveError);
      setError('Unable to save officer changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="officer-editor-title">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="border-b border-slate-100 px-6 py-5">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">Officer account</p>
          <h2 id="officer-editor-title" className="mt-1 text-xl font-bold text-slate-900">Edit officer</h2>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 px-6 py-6">
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-slate-700">Full name</span>
              <input value={fullName} onChange={(event) => setFullName(event.target.value)} required className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-slate-700">Email</span>
              <input value={officer.email ?? ''} readOnly className="w-full rounded-xl border border-slate-200 bg-slate-100 px-3.5 py-3 text-sm text-slate-500" />
              <span className="mt-1 block text-xs text-slate-500">Email addresses are managed by the authentication provider.</span>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-slate-700">Region</span>
              <input value={region} onChange={(event) => setRegion(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-slate-700">Account status</span>
              <select value={status} onChange={(event) => setStatus(event.target.value as Officer['status'])} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100">
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </label>
            {error && <p role="alert" className="text-sm font-medium text-red-600">{error}</p>}
          </div>
          <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
            <button type="button" onClick={onClose} disabled={saving} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-200 disabled:opacity-50">Cancel</button>
            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"><Check size={16} />{saving ? 'Saving...' : 'Save changes'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [officerError, setOfficerError] = useState('');
  const [editingOfficer, setEditingOfficer] = useState<Officer | null>(null);
  const [records, setRecords] = useState<Record<ResourceKey, ReferenceRecord[]>>(starterRecords);
  const [activeArea, setActiveArea] = useState<SettingsArea>('officers');
  const [teamCategory, setTeamCategory] = useState(TEAMS[0].label);
  const [search, setSearch] = useState('');
  const [listPage, setListPage] = useState(1);
  const [editor, setEditor] = useState<{ config: ResourceConfig; record: ReferenceRecord | null } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ config: ResourceConfig; record: ReferenceRecord } | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      const user = await getCurrentUser();
      if (!user) { navigate('/login', { replace: true }); return; }
      const { data: profile } = await db.from('users').select('full_name, role, region').eq('id', user.id).maybeSingle();
      if (profile?.role !== 'admin') { navigate('/dashboard', { replace: true }); return; }
      setCurrentUser(user); setUserProfile(profile); setRecords(readStoredRecords());
      const { data: officerData, error: officersLoadError } = await db
        .from('users')
        .select('id, full_name, email, region, status')
        .eq('role', 'officer')
        .order('full_name', { ascending: true });
      if (officersLoadError) {
        console.error('Error loading officers:', officersLoadError);
        setOfficerError('Unable to load officer accounts. Please refresh and try again.');
      } else {
        setOfficers(officerData ?? []);
      }
      setLoading(false);
    };
    loadProfile().catch(() => navigate('/dashboard', { replace: true }));
  }, [navigate]);

  useEffect(() => {
    if (!loading && location.hash === '#officers') {
      document.getElementById('officers')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [loading, location.hash]);

  const selectedConfig = resourceConfigs.find((config) => config.key === activeArea);
  const visibleRecords = useMemo(() => {
    const query = search.trim().toLowerCase();
    return selectedConfig ? records[selectedConfig.key].filter((record) =>
      (activeArea !== 'teams' || record.category === teamCategory) &&
      (!query || `${record.name} ${record.shortName} ${record.details}`.toLowerCase().includes(query))
    ) : [];
  }, [activeArea, selectedConfig, records, search, teamCategory]);
  const visibleOfficers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return officers.filter((officer) => !query || `${officer.full_name ?? ''} ${officer.email ?? ''} ${officer.region ?? ''}`.toLowerCase().includes(query));
  }, [officers, search]);
  const pageSize = 8;
  const itemCount = activeArea === 'officers' ? visibleOfficers.length : visibleRecords.length;
  const pageCount = Math.max(1, Math.ceil(itemCount / pageSize));
  const currentPage = Math.min(listPage, pageCount);
  const pageStart = (currentPage - 1) * pageSize;
  const pagedOfficers = visibleOfficers.slice(pageStart, pageStart + pageSize);
  const pagedRecords = visibleRecords.slice(pageStart, pageStart + pageSize);
  const selectedArea = managementAreas.find((area) => area.key === activeArea) ?? managementAreas[0];
  const selectedCount = activeArea === 'officers' ? officers.length : records[activeArea].length;
  const resetList = (area: SettingsArea) => { setActiveArea(area); setSearch(''); setListPage(1); };
  const persistRecords = (nextRecords: Record<ResourceKey, ReferenceRecord[]>) => { setRecords(nextRecords); window.localStorage.setItem(storageKey, JSON.stringify({ ...nextRecords, teamsManaged: true, teamsCategoryVersion: 1 })); };
  const saveRecord = (record: ReferenceRecord) => {
    if (!editor) return;
    const key = editor.config.key;
    const updated = records[key].some((item) => item.id === record.id)
      ? records[key].map((item) => item.id === record.id ? record : item)
      : [record, ...records[key]];
    const next = key === 'teams' ? sortTeams(updated) : updated;
    persistRecords({ ...records, [key]: next });
    setEditor(null);
  };
  const deleteRecord = () => { if (!deleteTarget) return; persistRecords({ ...records, [deleteTarget.config.key]: records[deleteTarget.config.key].filter((item) => item.id !== deleteTarget.record.id) }); setDeleteTarget(null); };
  const saveOfficer = async (officer: Officer, profile: { full_name: string; region: string; status: Officer['status'] }) => {
    const { data, error } = await db
      .from('users')
      .update(profile)
      .eq('id', officer.id)
      .eq('role', 'officer')
      .select('id, full_name, email, region, status')
      .single();
    if (error) throw error;
    setOfficers((current) => current.map((item) => item.id === officer.id ? data : item).sort((a, b) => (a.full_name ?? '').localeCompare(b.full_name ?? '')));
    setEditingOfficer(null);
  };
  if (loading || !currentUser || !userProfile) return null;
  return (
    <div className="flex min-h-screen w-screen flex-col bg-slate-50">
      <DashboardHeader userId={currentUser.id} userName={userProfile.full_name || currentUser.email?.split('@')[0] || 'Admin'} userEmail={currentUser.email || 'No email'} userRole={userProfile.role} userRegion={userProfile.region || ''} notifications={[]} onLogout={() => navigate('/login')} />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <button type="button" onClick={() => navigate('/dashboard')} className="mb-7 inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-slate-500 transition hover:bg-white hover:text-slate-900"><ArrowLeft size={16} />Back to dashboard</button>
        <header className="mb-6">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">Admin workspace</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">Settings</h1>
          <p className="mt-1 text-sm text-slate-500">Manage officers and the options used throughout match reporting.</p>
        </header>
        <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-start">
          <nav aria-label="Settings sections" className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
            {managementAreas.map((area) => {
              const Icon = area.icon;
              const count = area.key === 'officers' ? officers.length : records[area.key].length;
              return (
                <button
                  key={area.key}
                  type="button"
                  onClick={() => resetList(area.key)}
                  aria-current={activeArea === area.key ? 'page' : undefined}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${
                    activeArea === area.key
                      ? 'bg-blue-50 text-blue-800 ring-1 ring-inset ring-blue-200'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon size={18} className="shrink-0" />
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold">{area.title}</span>
                  <span className={`text-xs font-medium ${activeArea === area.key ? 'text-blue-700' : 'text-slate-400'}`}>{count}</span>
                  <ChevronRight size={15} className={activeArea === area.key ? 'text-blue-600' : 'text-slate-300'} />
                </button>
              );
            })}
          </nav>
          <section id="officers" className="scroll-mt-24 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm" aria-labelledby="workspace-heading">
            <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Selected workspace</p>
                <h2 id="workspace-heading" className="mt-1 text-xl font-bold text-slate-900">{activeArea === 'officers' ? 'Registered officers' : selectedConfig?.title}</h2>
                <p className="mt-1 text-sm text-slate-500">{selectedArea.description}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-600">{selectedCount} {selectedCount === 1 ? 'entry' : 'entries'}</span>
                {selectedConfig && <button type="button" onClick={() => setEditor({ config: selectedConfig, record: null })} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"><Plus size={17} />Add {selectedConfig.singular}</button>}
              </div>
            </div>
            {activeArea === 'teams' && (
              <div className="border-b border-slate-100 px-4 py-4 sm:px-5">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">League / category</p>
                <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Filter teams by league or category">
                  {TEAMS.map((group) => {
                    const count = records.teams.filter((team) => team.category === group.label).length;
                    const selected = teamCategory === group.label;
                    return (
                      <button
                        key={group.label}
                        type="button"
                        onClick={() => { setTeamCategory(group.label); setListPage(1); }}
                        aria-pressed={selected}
                        className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-semibold transition ${
                          selected
                            ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700'
                        }`}
                      >
                        {group.label}
                        <span className={`rounded-full px-1.5 py-0.5 text-xs ${selected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>{count}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            <div className="border-b border-slate-100 bg-slate-50/70 p-4 sm:p-5">
              <label className="relative block max-w-md">
                <Search size={17} className="absolute left-3.5 top-3 text-slate-400" />
                <input value={search} onChange={(event) => { setSearch(event.target.value); setListPage(1); }} placeholder={`Search ${activeArea === 'officers' ? 'officers' : selectedConfig?.title.toLowerCase()}...`} aria-label={`Search ${selectedArea.title.toLowerCase()}`} className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
              </label>
            </div>
            <div className="divide-y divide-slate-100">
              {activeArea === 'officers' ? (
                officerError ? <p role="alert" className="px-5 py-8 text-sm text-red-600 sm:px-6">{officerError}</p> : pagedOfficers.length > 0 ? pagedOfficers.map((officer) => (
                  <div key={officer.id} className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-sm font-bold text-blue-700">{(officer.full_name || officer.email || 'O').slice(0, 1).toUpperCase()}</div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-900">{officer.full_name || 'Unnamed Officer'}</p>
                        <p className="truncate text-sm text-slate-500">{officer.email || 'No email'}{officer.region ? ` · ${officer.region}` : ''}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 self-start sm:self-center">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${officer.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{officer.status}</span>
                      <button type="button" onClick={() => setEditingOfficer(officer)} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"><Edit3 size={16} />Edit</button>
                    </div>
                  </div>
                )) : <div className="px-6 py-10 text-center text-sm text-slate-500">{search ? 'No officers match your search.' : 'No registered officers found.'}</div>
              ) : pagedRecords.length > 0 ? pagedRecords.map((record) => (
                <div key={record.id}>
                  <div className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-sm font-bold text-slate-600">{record.name.slice(0, 2).toUpperCase()}</div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-900">{record.name}</p>
                        {activeArea !== 'teams' && <p className="truncate text-sm text-slate-500">{record.shortName}{record.details ? ` · ${record.details}` : ''}</p>}
                      </div>
                    </div>
                    {activeArea !== 'teams' && (
                      <div className="flex items-center justify-between gap-4 sm:justify-end">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${record.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{record.status}</span>
                        <div className="flex gap-1">
                          <button type="button" onClick={() => selectedConfig && setEditor({ config: selectedConfig, record })} aria-label={`Edit ${record.name}`} className="rounded-lg p-2 text-slate-400 transition hover:bg-blue-50 hover:text-blue-600"><Edit3 size={17} /></button>
                          <button type="button" onClick={() => selectedConfig && setDeleteTarget({ config: selectedConfig, record })} aria-label={`Delete ${record.name}`} className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"><Trash2 size={17} /></button>
                        </div>
                      </div>
                    )}
                    {activeArea === 'teams' && <div className="flex gap-1 self-start sm:self-center">
                      <button type="button" onClick={() => selectedConfig && setEditor({ config: selectedConfig, record })} aria-label={`Edit ${record.name}`} className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"><Edit3 size={16} />Edit</button>
                      <button type="button" onClick={() => selectedConfig && setDeleteTarget({ config: selectedConfig, record })} aria-label={`Delete ${record.name}`} className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"><Trash2 size={17} /></button>
                    </div>}
                  </div>
                </div>
              )) : <div className="px-6 py-10 text-center text-sm text-slate-500">{search ? `No ${selectedArea.title.toLowerCase()} match your search.` : `No ${selectedArea.title.toLowerCase()} found.`}</div>}
            </div>
            {pageCount > 1 && (
              <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/60 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <p className="text-sm text-slate-500">Showing {pageStart + 1}–{Math.min(pageStart + pageSize, itemCount)} of {itemCount}</p>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setListPage((page) => Math.max(1, page - 1))} disabled={currentPage === 1} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40">Previous</button>
                  <span className="px-2 text-sm font-medium text-slate-600">Page {currentPage} of {pageCount}</span>
                  <button type="button" onClick={() => setListPage((page) => Math.min(pageCount, page + 1))} disabled={currentPage === pageCount} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40">Next</button>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
      {editor && <ReferenceEditor config={editor.config} record={editor.record} onClose={() => setEditor(null)} onSave={saveRecord} />}
      {deleteTarget && <DeleteConfirmation config={deleteTarget.config} record={deleteTarget.record} onClose={() => setDeleteTarget(null)} onConfirm={deleteRecord} />}
      {editingOfficer && <OfficerEditor officer={editingOfficer} onClose={() => setEditingOfficer(null)} onSave={saveOfficer} />}
    </div>
  );
}
