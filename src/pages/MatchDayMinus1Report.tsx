import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useLocation, useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';

const schema = z.object({
  tournament: z.string().min(1, 'Required'),
  officerName: z.string().min(1, 'Required'),
  date: z.string().min(1, 'Required'),
  homeTeam: z.string().min(1, 'Required'),
  awayTeam: z.string().min(1, 'Required'),
  venue: z.string().min(1, 'Required'),
  league: z.string().min(1, 'Required'),
  stadium: z.string().min(1, 'Required'),
  expectedAttendance: z.number().min(0, { message: 'Required' }),
  venueMeeting: z.string().min(1, 'Required'),
  stewardsBriefing: z.string().min(1, 'Required'),
  control_measures: z.string().min(1, 'Required'),
  matchCoordination: z.string().min(1, 'Required'),
  teamTrainings: z.string().min(1, 'Required'),
  pressConferences: z.string().min(1, 'Required'),
  locCounterparts: z.string().min(1, 'Required'),
  vocCommanderCooperation: z.string().min(1, 'Required'),
  stadiumAuthorityCooperation: z.string().min(1, 'Required'),
  pleDelegationCooperation: z.string().min(1, 'Required'),
  overallEvaluation: z.string().min(1, 'Required'),
  issuesDescription: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function MatchDayMinus1Report() {
  const location = useLocation();
  const navigate = useNavigate();
  const { matchData: match } = location.state || {};

  const buildDefaultValues = (report?: any) => ({
    officerName: report?.officer_name || match?.assignedOfficerName || 'Unassigned',
    date: report?.date || match?.date || new Date().toISOString().split('T')[0],
    homeTeam: report?.home_team || match?.homeTeam || '',
    awayTeam: report?.away_team || match?.awayTeam || '',
    stadium: report?.stadium || match?.stadium || '',
    venue: report?.venue || match?.venue || '',
    tournament: report?.tournament || match?.tournament || '',
    league: report?.league || match?.league || '',
    expectedAttendance: report?.expected_attendance ?? undefined,
    venueMeeting: report?.venue_meeting || '',
    stewardsBriefing: report?.stewards_briefing || '',
    control_measures: report?.control_measures || '',
    matchCoordination: report?.match_coordination || '',
    teamTrainings: report?.team_trainings || '',
    pressConferences: report?.press_conferences || '',
    locCounterparts: report?.loc_counterparts || '',
    vocCommanderCooperation: report?.voc_commander_cooperation || '',
    stadiumAuthorityCooperation: report?.stadium_authority_cooperation || '',
    pleDelegationCooperation: report?.ple_delegation_cooperation || '',
    overallEvaluation: report?.overall_evaluation || '',
    issuesDescription: report?.issues_description || '',
  });

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
        .from('m1_reports')
        .select('*')
        .eq('match_id', match.id)
        .maybeSingle();

      if (!isMounted) return;

      if (error) {
        console.error('Error loading existing Match Day -1 report:', error);
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
  }, [match?.id, reset]);

  const onSubmit = async (data: FormData) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert("You must be logged in.");
    if (!match?.id) return alert("Match ID missing!");

    try {
      const { error: reportError } = await supabase
        .from('m1_reports')
        .upsert({
          id: `M1-${match.id}`,
          match_id: match.id,
          officer_email: user.email,
          tournament: data.tournament,
          officer_name: data.officerName,
          date: data.date,
          home_team: data.homeTeam,
          away_team: data.awayTeam,
          venue: data.venue,
          league: data.league,
          stadium: data.stadium,
          expected_attendance: data.expectedAttendance,
          venue_meeting: data.venueMeeting,
          stewards_briefing: data.stewardsBriefing,
          control_measures: data.control_measures,
          match_coordination: data.matchCoordination,
          team_trainings: data.teamTrainings,
          press_conferences: data.pressConferences,
          loc_counterparts: data.locCounterparts,
          voc_commander_cooperation: data.vocCommanderCooperation,
          stadium_authority_cooperation: data.stadiumAuthorityCooperation,
          ple_delegation_cooperation: data.pleDelegationCooperation,
          overall_evaluation: data.overallEvaluation,
          issues_description: data.issuesDescription,
          submitted_at: new Date().toISOString()
        });

      if (reportError) throw reportError;

      const { error: updateError } = await supabase
        .from('matches')
        .update({ status: 'Active' })
        .eq('id', match.id);

      if (updateError) throw updateError;

      alert('Successfully saved Match Day -1 Report!');
      navigate('/dashboard');
    } catch (error: any) {
      console.error(error);
      alert('Error saving data: ' + error.message);
    }
  };

  return (
  <div className="w-screen min-h-screen !bg-gray-50 flex items-center justify-center p-3 sm:p-4">
    <div className="mx-auto flex max-w-6xl flex-col gap-6 w-full">
      <div className="overflow-hidden rounded-[32px] border border-slate-200 !bg-white shadow-xl shadow-slate-200/50">
        
        <div className="border-b border-slate-200 !bg-white px-4 py-4 sm:px-6 sm:py-5 lg:px-10">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div className="flex min-w-0 items-center gap-3 sm:gap-4">
              <button type="button" onClick={() => navigate(-1)} className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 !bg-white px-2.5 py-2 text-xs font-medium text-slate-600 shadow-sm transition hover:!bg-slate-50 hover:text-slate-900 sm:gap-2 sm:px-3 sm:text-sm">
                <ArrowLeft size={14} className="sm:h-4 sm:w-4" /> Back
              </button>
              <div className="flex min-w-0 items-center gap-2">
                <span className="h-2 w-2 shrink-0 rounded-full !bg-sky-500 sm:h-2.5 sm:w-2.5" aria-hidden="true" />
                <h1 className="text-xs font-semibold leading-tight text-slate-800 sm:text-sm">Match Day -1 Report</h1>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-slate-200 !bg-slate-50 px-2.5 py-1.5 text-[11px] font-medium text-slate-600 sm:px-3 sm:text-xs">Match ID: {match?.id ?? 'N/A'}</span>
              <span className="rounded-full border border-slate-200 !bg-slate-50 px-2.5 py-1.5 text-[11px] font-medium text-slate-600 sm:px-3 sm:text-xs">Status: {match ? 'In progress' : 'Draft'}</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 px-4 pb-6 pt-6 sm:px-6 sm:pb-8 sm:pt-8 lg:px-10">
          
          {/* Match Details Section */}
          <section className="border border-slate-200 !bg-slate-50 p-6 shadow-sm rounded-3xl">
            <h2 className="text-xl font-semibold text-slate-900">Match Details</h2>
            <div className="mt-6 space-y-4 grid gap-4 md:grid-cols-2">
              <SummaryBadge label="Tournament" value={match?.tournament || 'N/A'} />
              <SummaryBadge label="League" value={match?.league || 'N/A'} />
              <SummaryBadge label="Home Team" value={match?.homeTeam || 'N/A'} />
              <SummaryBadge label="Away Team" value={match?.awayTeam || 'N/A'} />
              <SummaryBadge label="Venue" value={match?.venue || 'N/A'} />
              <SummaryBadge label="Stadium" value={match?.stadium || 'N/A'} />
              <SummaryBadge label="Date" value={match?.date || 'N/A'} />
              <SummaryBadge label="Officer" value={match?.assignedOfficerName || 'N/A'} />
            </div>
          </section>

          {/* Attendance Section */}
          <section className="rounded-3xl border border-slate-200 !bg-slate-50 p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">Attendance</h2>
            <div className="mt-6 max-w-sm">
              <Input label="Expected Stadium Attendance" type="number" {...register('expectedAttendance', { valueAsNumber: true })} error={errors.expectedAttendance} />
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 !bg-slate-50 p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">Operational observations</h2>
            <div className="mt-6 space-y-5">
              {[
                { label: 'How was the Venue Safety & Security meeting? Explain Briefly', field: 'venueMeeting' },
                { label: 'How was the Briefing of Stewards’ supervisors? Explain Briefly', field: 'stewardsBriefing' },
                { label: 'How is the red-line precinct? Explain Briefly', field: 'control_measures' },
                { label: 'How was the Match coordination meeting? Explain Briefly', field: 'matchCoordination' },
                { label: 'How were the Official Team trainings? Explain Briefly', field: 'teamTrainings' },
                { label: 'How were the Press Conferences? Explain Briefly', field: 'pressConferences' },
                { label: 'How was the cooperation and teamwork with LOC counterparts? Explain Briefly', field: 'locCounterparts' },
                { label: 'How was the Cooperation and teamwork with the Venue Operations Center (VOC) Commander? Explain Briefly', field: 'vocCommanderCooperation' },
                { label: 'How was the Cooperation and teamwork with Stadium Authority? Explain Briefly', field: 'stadiumAuthorityCooperation' },
                { label: 'How was the Cooperation and teamwork with PLE delegation? Explain Briefly', field: 'pleDelegationCooperation' },
              ].map((item) => (
                <TextArea className="!bg-white"
                  key={item.field}
                  label={item.label}
                  {...register(item.field as any)}
                  error={errors[item.field as keyof FormData]}
                />
              ))}
            </div>
          </section>

          {/* Final Evaluation */}
          <section className="rounded-3xl border border-slate-200 !bg-slate-50 p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">Final evaluation</h2>
            <p className="mt-1 text-sm text-slate-500">Summarise any issues and provide your overall assessment.</p>
            <div className="mt-6 space-y-5">
              <TextArea label="What is your Overall evaluation?" {...register('overallEvaluation')} error={errors.overallEvaluation} />
              <TextArea label="If there were any issue/concerns, please provide a description and evaluation of the resolution for each of the issues." {...register('issuesDescription')} error={errors.issuesDescription} />
            </div>
          </section>

          {/* Action Buttons */}
          
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
