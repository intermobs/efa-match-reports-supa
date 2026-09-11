import { useEffect, useState } from 'react';
import { ArrowLeft, Building2, ChevronRight, Layers3, Settings, ShieldCheck, Trophy, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DashboardHeader from '../components/DashboardHeader';
import { db, getCurrentUser } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

interface UserProfile {
  full_name?: string | null;
  role?: string | null;
  region?: string | null;
}

const managementAreas = [
  {
    title: 'Teams',
    description: 'Manage the clubs and teams available when creating a match.',
    icon: Users,
    accent: 'blue',
  },
  {
    title: 'Tournaments',
    description: 'Prepare tournament competitions for match scheduling and reporting.',
    icon: Trophy,
    accent: 'amber',
  },
  {
    title: 'Leagues',
    description: 'Organise league competitions and their participating teams.',
    icon: Layers3,
    accent: 'emerald',
  },
];

const accentStyles = {
  blue: 'bg-blue-50 text-blue-700 ring-blue-100',
  amber: 'bg-amber-50 text-amber-700 ring-amber-100',
  emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
};

export default function SettingsPage() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      const user = await getCurrentUser();
      if (!user) {
        navigate('/login', { replace: true });
        return;
      }

      const { data: profile } = await db
        .from('users')
        .select('full_name, role, region')
        .eq('id', user.id)
        .maybeSingle();

      if (profile?.role !== 'admin') {
        navigate('/dashboard', { replace: true });
        return;
      }

      setCurrentUser(user);
      setUserProfile(profile);
      setLoading(false);
    };

    loadProfile().catch(() => navigate('/dashboard', { replace: true }));
  }, [navigate]);

  if (loading || !currentUser || !userProfile) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardHeader
        userId={currentUser.id}
        userName={userProfile.full_name || currentUser.email?.split('@')[0] || 'Admin'}
        userEmail={currentUser.email || 'No email'}
        userRole={userProfile.role}
        userRegion={userProfile.region || ''}
        notifications={[]}
        onLogout={() => navigate('/login')}
      />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="mb-6 inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-slate-500 transition hover:bg-white hover:text-slate-900"
        >
          <ArrowLeft size={16} />
          Back to dashboard
        </button>

        <div className="mb-8 flex flex-col gap-4 border-b border-slate-200 pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
              <Settings size={14} />
              Admin settings
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Competition setup</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Set up the competition data that will power match creation and reporting across the command centre.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 shadow-sm sm:self-auto">
            <ShieldCheck size={15} className="text-emerald-600" />
            Admin access
          </div>
        </div>

        <section aria-labelledby="management-heading">
          <div className="mb-4">
            <h2 id="management-heading" className="text-lg font-bold text-slate-900">Manage reference data</h2>
            <p className="mt-1 text-sm text-slate-500">These areas are ready for admin-managed records.</p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {managementAreas.map(({ title, description, icon: Icon, accent }) => (
              <button
                key={title}
                type="button"
                disabled
                className="group flex min-h-52 cursor-not-allowed flex-col items-start rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm opacity-90"
                title="Management tools will be available in a future update"
              >
                <span className={`mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl ring-1 ${accentStyles[accent as keyof typeof accentStyles]}`}>
                  <Icon size={21} />
                </span>
                <span className="flex w-full items-start justify-between gap-3">
                  <span>
                    <span className="block text-base font-bold text-slate-900">{title}</span>
                    <span className="mt-1 block text-sm leading-5 text-slate-500">{description}</span>
                  </span>
                  <ChevronRight size={18} className="mt-0.5 shrink-0 text-slate-300" />
                </span>
                <span className="mt-auto pt-5 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Coming soon</span>
              </button>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white/70 p-5 sm:p-6">
          <div className="flex gap-4">
            <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 sm:flex">
              <Building2 size={19} />
            </div>
            <div>
              <h2 className="font-bold text-slate-900">More settings can live here</h2>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
                This workspace is intentionally prepared for future admin tools such as venues, competition seasons, match statuses, and reporting options.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
