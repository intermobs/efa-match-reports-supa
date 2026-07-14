import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useLocation, useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Upload } from 'lucide-react';
import { supabase } from '../lib/supabase';

const schema = z.object({
  matchDate: z.string().min(1, 'Required'),
  matchNo: z.string().min(1, 'Required'),
  kickOff: z.string().min(1, 'Required'),
  homeTeam: z.string().min(1, 'Required'),
  awayTeam: z.string().min(1, 'Required'),
  venue: z.string().min(1, 'Required'),
  stadium: z.string().min(1, 'Required'),
  incidentLocation: z.string().min(1, 'Required'),
  whatHappened: z.string().min(1, 'Required'),
  actionsTaken: z.string().min(1, 'Required'),
  additionalInfo: z.string().optional(),
});

type FormData = z.infer<typeof schema>;
type ExistingReport = Record<string, unknown>;

export default function IncidentReport() {
  const [file, setFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [existingPhotoPath, setExistingPhotoPath] = useState<string | null>(null);
  const [hasExistingData, setHasExistingData] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { matchData: match, mode } = location.state || {};
  const isViewOnly = mode === 'view';

  const buildDefaultValues = useCallback((report?: ExistingReport): FormData => ({
    matchDate: (report?.match_date as string | undefined) || match?.date || new Date().toISOString().split('T')[0],
    matchNo: (report?.match_no as string | undefined) || '',
    kickOff: (report?.kick_off as string | undefined) || '',
    homeTeam: (report?.home_team as string | undefined) || match?.homeTeam || '',
    awayTeam: (report?.away_team as string | undefined) || match?.awayTeam || '',
    venue: (report?.venue as string | undefined) || match?.venue || '',
    stadium: (report?.stadium as string | undefined) || match?.stadium || '',
    incidentLocation: (report?.incident_location as string | undefined) || '',
    whatHappened: (report?.what_happened as string | undefined) || '',
    actionsTaken: (report?.actions_taken as string | undefined) || '',
    additionalInfo: (report?.additional_info as string | undefined) || '',
  }), [match?.date, match?.homeTeam, match?.awayTeam, match?.venue, match?.stadium]);

  const { register, handleSubmit, reset, formState: { isSubmitting, errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: buildDefaultValues(),
  });

  useEffect(() => {
    let isMounted = true;

    const loadReportData = async () => {
      if (!match?.id) return;

      const { data: report, error } = await supabase
        .from('incident_reports')
        .select('*')
        .eq('match_id', match.id)
        .maybeSingle();

      if (!isMounted) return;

      if (error) {
        console.error('Error loading report data:', error);
        setHasExistingData(false);
        reset(buildDefaultValues());
        return;
      }

      if (report) {
        setHasExistingData(true);
        setExistingPhotoPath(report.incident_photo_url || null);
        reset(buildDefaultValues(report));
        if (report.incident_photo_url) {
          setImagePreview(
            supabase.storage.from('incident-photos').getPublicUrl(report.incident_photo_url).data.publicUrl
          );
        }
      } else {
        setHasExistingData(false);
        setExistingPhotoPath(null);
        reset(buildDefaultValues());
      }
    };

    loadReportData();

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
      // 2. Handle file upload if present
      let imageUrl = existingPhotoPath;
      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `incident-${match.id}-${Date.now()}.${fileExt}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('incident-photos')
          .upload(fileName, file);
        if (uploadError) throw uploadError;
        imageUrl = uploadData.path;
      }

      // 3. Save to 'incident_reports' table
      const { error: reportError } = await supabase
        .from('incident_reports')
        .upsert({
          id: `IR-${match.id}`,
          match_id: match.id,
          officer_email: user.email,
          match_date: data.matchDate,
          match_no: data.matchNo,
          kick_off: data.kickOff,
          home_team: data.homeTeam,
          away_team: data.awayTeam,
          venue: data.venue,
          stadium: data.stadium,
          incident_location: data.incidentLocation,
          what_happened: data.whatHappened,
          actions_taken: data.actionsTaken,
          additional_info: data.additionalInfo,
          incident_photo_url: imageUrl,
          submitted_at: new Date().toISOString()
        });

      if (reportError) throw reportError;

      alert('Successfully saved Incident Report!');
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
        
        {/* Gradient Header */}
        <div className="!bg-gradient-to-r from-red-700 via-red-800 to-red-950 px-8 py-10 sm:px-12">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-red-100">Incident Report</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <span className="rounded-2xl border border-white/15 !bg-white/10 px-4 py-2 text-sm text-white">Security & Safety</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 px-6 pb-8 pt-8 sm:px-10 sm:pb-10">
          
          {/* Incident Details Section */}
          <section className="rounded-3xl border border-slate-200 !bg-slate-50 p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">Incident Details</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <Input label="Match Date" type="date" {...register('matchDate')} error={errors.matchDate} disabled={isViewOnly} />
              <Input label="Match Number" {...register('matchNo')} error={errors.matchNo} disabled={isViewOnly} />
              <Input label="Kick-off time" type="time" {...register('kickOff')} error={errors.kickOff} disabled={isViewOnly} />
              <SummaryBadge label="Home Team" value={match?.homeTeam || 'Unknown'} />
              <SummaryBadge label="Away Team" value={match?.awayTeam || 'Unknown'} />
              <SummaryBadge label="Venue" value={match?.venue || 'Unknown'} />
              <SummaryBadge label="Stadium" value={match?.stadium || 'Unknown'} />
                  
            </div>
          </section>

          {/* Incident Narrative Section */}
          <section className="rounded-3xl border border-slate-200 !bg-slate-50 p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">Incident Description</h2>
            <div className="mt-6 space-y-5">
              <TextArea className="!bg-white" label="Where and when did the incident take place?" {...register('incidentLocation')} error={errors.incidentLocation} disabled={isViewOnly} />
              <TextArea className="!bg-white" label="Please specify as accurately as possible, what happened." {...register('whatHappened')} error={errors.whatHappened} disabled={isViewOnly} />
              <TextArea className="!bg-white" label="What actions were taken to resolve the Incident?" {...register('actionsTaken')} error={errors.actionsTaken} disabled={isViewOnly} />
              <TextArea className="!bg-white" label="Any Additional Information" {...register('additionalInfo')} error={errors.additionalInfo} disabled={isViewOnly} />
            </div>
          </section>

          {/* Photo Upload Section */}
          <section className="rounded-3xl border border-slate-200 !bg-slate-50 p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-slate-900">Evidence</h3>
            <div className="mt-6 p-6 border-2 border-dashed border-slate-300 rounded-2xl !bg-white text-center">
              <Upload className="mx-auto text-slate-400 mb-2" />
              <input 
                type="file" 
                accept="image/*" 
                capture="environment" 
                onChange={(e) => {
                  const selectedFile = e.target.files ? e.target.files[0] : null;
                  setFile(selectedFile);
                  if (selectedFile) setImagePreview(URL.createObjectURL(selectedFile));
                  else setImagePreview(null);
                }} 
                className="text-sm text-slate-500" 
                disabled={isViewOnly}
              />
              <p className="text-xs text-slate-400 mt-2">Capture or select an image of the incident</p>
            </div>
            {imagePreview && (
              <div className="mt-4">
                <img src={imagePreview} alt="Incident" className="max-w-full h-auto rounded-lg shadow-md border" />
              </div>
            )}
          </section>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-end">
            <button type="button" onClick={() => navigate('/dashboard')} className="inline-flex items-center justify-center rounded-2xl border border-slate-300 !bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:!bg-slate-100">Cancel</button>
            {!isViewOnly && (
              <>
                <button type="button" className="inline-flex items-center justify-center rounded-2xl border border-slate-300 !bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:!bg-slate-100">Save Draft</button>
                <button type="submit" disabled={isSubmitting} className="inline-flex items-center justify-center rounded-2xl !bg-red-700 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-red-500/20 transition hover:!bg-red-800">
                  {isSubmitting ? (hasExistingData ? 'Updating...' : 'Submitting...') : (hasExistingData ? 'Update' : 'Submit Report')}
                </button>
              </>
            )}
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

type FormFieldProps = {
  label: string;
  error?: { message?: string };
  disabled?: boolean;
};

function Input({ label, error, disabled, ...props }: FormFieldProps & React.ComponentProps<'input'>) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input {...props} disabled={disabled} className={`w-full px-4 py-3 border rounded-lg text-black ${error ? 'border-red-600' : 'border-gray-300'} ${disabled ? '!bg-gray-100' : ''}`} />
      {error && <p className="text-red-600 text-xs mt-1">{error.message}</p>}
    </div>
  );
}

function TextArea({ label, error, disabled, ...props }: FormFieldProps & React.ComponentProps<'textarea'>) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <textarea {...props} disabled={disabled} rows={3} className={`w-full px-4 py-3 border rounded-lg text-black ${error ? 'border-red-600' : 'border-gray-300'} ${disabled ? '!bg-gray-100' : ''}`} />
      {error && <p className="text-red-600 text-xs mt-1">{error.message}</p>}
    </div>
  );
}
