import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useLocation, useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '../lib/supabase'; // Supabase client

const schema = z.object({
  tournament: z.string().min(1, 'Required'),
  officerName: z.string().min(1, 'Required'),
  date: z.string().min(1, 'Required'),
  homeTeam: z.string().min(1, 'Required'),
  awayTeam: z.string().min(1, 'Required'),
  homeScore: z.number().min(0, { message: 'Required' }),
  awayScore: z.number().min(0, { message: 'Required' }),
  league: z.string().min(1, 'Required'),
  venue: z.string().min(1, 'Required'),
  stadium: z.string().min(1, 'Required'),
  attendance: z.number().min(0, { message: 'Required' }),
  accessControl: z.string().min(1, 'Required'),
  staircases: z.string().min(1, 'Required'),
  supporterBehavior: z.string().min(1, 'Required'),
  officialBehavior: z.string().min(1, 'Required'),
  vocInteraction: z.string().min(1, 'Required'),
  stadiumCleanliness: z.string().min(1, 'Required'),
  securityDebrief: z.string().min(1, 'Required'),
  locCooperation: z.string().min(1, 'Required'),
  stadiumAuthority: z.string().min(1, 'Required'),
  pleDelegation: z.string().min(1, 'Required'),
  overallEvaluation: z.string().min(1, 'Required'),
  issuesDescription: z.string().optional(),
});

type FormData = z.infer<typeof schema>;
type ExistingReport = Record<string, unknown>;

export default function MatchDayReport() {
  const location = useLocation();
  const navigate = useNavigate();
  const { matchData: match } = location.state || {}; // Extract match data

  const buildDefaultValues = useCallback((report?: ExistingReport): FormData => ({
    officerName: (report?.officer_name as string | undefined) || match?.assignedOfficerName || 'Unassigned',
    date: (report?.date as string | undefined) || match?.date || new Date().toISOString().split('T')[0],
    homeTeam: (report?.home_team as string | undefined) || match?.homeTeam || '',
    awayTeam: (report?.away_team as string | undefined) || match?.awayTeam || '',
    stadium: (report?.stadium as string | undefined) || match?.stadium || '',
    venue: (report?.venue as string | undefined) || match?.venue || '',
    tournament: (report?.tournament as string | undefined) || match?.tournament || '',
    league: (report?.league as string | undefined) || match?.league || '',
    homeScore: (report?.home_score as number | undefined) ?? 0,
    awayScore: (report?.away_score as number | undefined) ?? 0,
    attendance: (report?.attendance as number | undefined) ?? 0,
    accessControl: (report?.access_control as string | undefined) || '',
    staircases: (report?.staircases as string | undefined) || '',
    supporterBehavior: (report?.supporter_behavior as string | undefined) || '',
    officialBehavior: (report?.official_behavior as string | undefined) || '',
    vocInteraction: (report?.voc_interaction as string | undefined) || '',
    stadiumCleanliness: (report?.stadium_cleanliness as string | undefined) || '',
    securityDebrief: (report?.security_debrief as string | undefined) || '',
    locCooperation: (report?.loc_cooperation as string | undefined) || '',
    stadiumAuthority: (report?.stadium_authority as string | undefined) || '',
    pleDelegation: (report?.ple_delegation as string | undefined) || '',
    overallEvaluation: (report?.overall_evaluation as string | undefined) || '',
    issuesDescription: (report?.issues_description as string | undefined) || '',
  }), [match?.assignedOfficerName, match?.date, match?.homeTeam, match?.awayTeam, match?.stadium, match?.venue, match?.tournament, match?.league]);

  const [hasExistingData, setHasExistingData] = useState(false);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: buildDefaultValues(),
  });

  useEffect(() => {
    let isMounted = true;

    const hydrateExistingReport = async () => {
      if (!match?.id) return;

      const { data: existingReport, error } = await supabase
        .from('matchday_reports')
        .select('*')
        .eq('match_id', match.id)
        .maybeSingle();

      if (!isMounted) return;

      if (error) {
        console.error('Error loading existing Match Day report:', error);
        setHasExistingData(false);
        reset(buildDefaultValues());
        return;
      }

      setHasExistingData(Boolean(existingReport));
      reset(buildDefaultValues(existingReport));
    };

    hydrateExistingReport();

    return () => {
      isMounted = false;
    };
  }, [match?.id, reset, buildDefaultValues]);

  const onSubmit = async (data: FormData) => {
    // 1. Get user from Supabase Auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert("You must be logged in.");
    if (!match?.id) return alert("Match ID missing!");

    try {
      // 2. Save to 'matchday_reports' table
      const { error: reportError } = await supabase
        .from('matchday_reports')
        .upsert({
          id: `MD-${match.id}`,
          match_id: match.id,
          officer_email: user.email,
          tournament: data.tournament,
          officer_name: data.officerName,
          date: data.date,
          home_team: data.homeTeam,
          away_team: data.awayTeam,
          home_score: data.homeScore,
          away_score: data.awayScore,
          league: data.league,
          venue: data.venue,
          stadium: data.stadium,
          attendance: data.attendance,
          access_control: data.accessControl,
          staircases: data.staircases,
          supporter_behavior: data.supporterBehavior,
          official_behavior: data.officialBehavior,
          voc_interaction: data.vocInteraction,
          stadium_cleanliness: data.stadiumCleanliness,
          security_debrief: data.securityDebrief,
          loc_cooperation: data.locCooperation,
          stadium_authority: data.stadiumAuthority,
          ple_delegation: data.pleDelegation,
          overall_evaluation: data.overallEvaluation,
          issues_description: data.issuesDescription,
          submitted_at: new Date().toISOString()
        });

      if (reportError) throw reportError;

      // 3. Update Match Status
      const { error: updateError } = await supabase
        .from('matches')
        .update({ status: 'Completed' })
        .eq('id', match.id);

      if (updateError) throw updateError;

      alert('Successfully saved Match Day Report!');
      navigate('/dashboard');
    } catch (error: unknown) {
      console.error(error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      alert('Error saving data: ' + message);
    }
  };

  return (
  <div className="w-screen min-h-screen !bg-gray-50 flex items-center justify-center p-4">
    <div className="mx-auto flex max-w-6xl flex-col gap-6 w-full">
      <div className="overflow-hidden rounded-[32px] border border-slate-200 !bg-white shadow-xl shadow-slate-200/50">
       
          <div className="!bg-gradient-to-r from-sky-600 via-blue-700 to-indigo-700 px-8 py-10 sm:px-12">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-sky-100">Match Day Report</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <span className="rounded-2xl border border-white/15 !bg-white/10 px-4 py-2 text-sm text-white">Match ID: {match?.id ?? 'N/A'}</span>
                <span className="rounded-2xl border border-white/15 !bg-white/10 px-4 py-2 text-sm text-white">Status: {match ? 'In progress' : 'Draft'}</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 px-6 pb-8 pt-8 sm:px-10 sm:pb-10">
            <section className=" border border-slate-200 !bg-slate-50 p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900">Match Details</h2>
                <div className="mt-6 space-y-4 grid gap-4 md:grid-cols-2">
                  <SummaryBadge label="Venue" value={match?.venue || 'Unknown'} />
                  <SummaryBadge label="Assigned officer" value={match?.assignedOfficerName || 'Unassigned'} />
                  <SummaryBadge label="Tournament" value={match?.tournament || 'Unknown'} />
                  <SummaryBadge label="League" value={match?.league || 'Unknown'} />
                  <SummaryBadge label="Stadium" value={match?.stadium || 'Unknown'} />
                  <SummaryBadge label="Home Team" value={match?.homeTeam || 'Unknown'} />
                  <SummaryBadge label="Away Team" value={match?.awayTeam || 'Unknown'} />
                  <SummaryBadge label="Date" value={match?.date || 'Unknown'} />
                </div>    
            </section>

            <section className="grid gap-6 lg:grid-cols-[1fr_280px]">
              <div className="rounded-3xl border border-slate-200 !bg-slate-50 p-6 shadow-sm">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Score & attendance</h2>
                  <p className="mt-1 text-sm text-slate-500">Capture the final score and actual attendance.</p>
                </div>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <Input label="Home Score" type="number" {...register('homeScore', { valueAsNumber: true })} error={errors.homeScore} />
                  <Input label="Away Score" type="number" {...register('awayScore', { valueAsNumber: true })} error={errors.awayScore} />
                  <Input label="Attendance" type="number" {...register('attendance', { valueAsNumber: true })} error={errors.attendance} />
                </div>
              </div>
            </section>

            <section className="grid gap-6">
              <div className="rounded-3xl border border-slate-200 !bg-slate-50 p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-slate-900">Operational observations</h2>
                <p className="mt-1 text-sm text-slate-500">Provide a concise evaluation for each key area below.</p>
                <div className="mt-6 space-y-5">
                  {[
                    { label: 'Access control operation', field: 'accessControl' },
                    { label: 'Staircases and gangways', field: 'staircases' },
                    { label: 'Supporter behaviour', field: 'supporterBehavior' },
                    { label: 'Team official behaviour', field: 'officialBehavior' },
                    { label: 'VOC interaction', field: 'vocInteraction' },
                    { label: 'Stadium cleanliness', field: 'stadiumCleanliness' },
                    { label: 'Security debrief', field: 'securityDebrief' },
                    { label: 'LOC cooperation', field: 'locCooperation' },
                    { label: 'Stadium authority cooperation', field: 'stadiumAuthority' },
                    { label: 'PLE delegation cooperation', field: 'pleDelegation' },
                  ].map((item) => (
                    <TextArea className="!bg-white"
                      key={item.field}
                      label={item.label}
                      {...register(item.field as any)}
                      error={errors[item.field as keyof FormData]}
                    />
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 !bg-slate-50 p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-slate-900">Final evaluation</h2>
                <p className="mt-1 text-sm text-slate-500">Summarise any issues and provide your overall assessment.</p>
                <div className="mt-6 space-y-5">
                  <TextArea label="Overall evaluation" {...register('overallEvaluation')} error={errors.overallEvaluation} />
                  <TextArea label="Issues or concerns" {...register('issuesDescription')} error={errors.issuesDescription} />
                </div>
              </div>
            </section>

            <div className="flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-end">
              <button type="button" className="inline-flex items-center justify-center rounded-2xl border border-slate-300 !bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:!bg-slate-100">Save draft</button>
              <button type="submit" disabled={isSubmitting} className="inline-flex items-center justify-center rounded-2xl !bg-sky-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-500/20 transition hover:!bg-sky-700 disabled:cursor-not-allowed disabled:!bg-slate-400">{isSubmitting ? (hasExistingData ? 'Updating...' : 'Submitting...') : (hasExistingData ? 'Update' : 'Submit report')}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function SummaryBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl !bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-2 text-sm font-medium text-slate-900">{value}</p>
    </div>
  );
}

function TextArea({ label, error, ...props }: any) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">{label}</label>
      <textarea
        {...props}
        rows={4}
        className={`w-full resize-none rounded-2xl border px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition duration-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 ${error ? 'border-red-500 ring-red-100 focus:border-red-500 focus:ring-red-100' : 'border-slate-200'}`}
      />
      {error && <p className="mt-2 text-xs text-red-600">{error.message}</p>}
    </div>
  );
}

function Input({ label, error, ...props }: any) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">{label}</label>
      <input
        {...props}
        className={`w-full rounded-2xl border !bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition duration-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 ${error ? 'border-red-500 ring-red-100 focus:border-red-500 focus:ring-red-100' : 'border-slate-200'}`}
      />
      {error && <p className="mt-2 text-xs text-red-600">{error.message}</p>}
    </div>
  );
}
