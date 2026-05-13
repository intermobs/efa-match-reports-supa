import { useEffect, useState } from 'react'; // Added useState
import { useForm, Controller } from 'react-hook-form';
import { useLocation, useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Select from 'react-select';
//import { db } from '../lib/supabase';
import { ShieldAlert, Upload } from 'lucide-react';
import { supabase } from '../lib/supabase'; // Use Supabase

const TEAMS = [
  { value: 'Mbabane Swallows', label: 'Mbabane Swallows' },
  { value: 'Mbabane Highlanders', label: 'Mbabane Highlanders' },
  { value: 'Manzini Wanderers', label: 'Manzini Wanderers' },
  { value: 'Moneni Pirates', label: 'Moneni Pirates' },
  { value: 'Green Mamba', label: 'Green Mamba' }
];
/*
const TOURNAMENTS = [
  { value: 'MTN Premier League', label: 'MTN Premier League' },
  { value: 'Mulasport NFD', label: 'Mulasport NFD' },
  { value: 'Ingwenyama Cup', label: 'SMVA Ingwenyama Cup' }
];
*/
const STADIUMS = [
  { value: 'Somhlolo National Stadium', label: 'Somhlolo National Stadium' },
  { value: 'Mavuso Sports Centre', label: 'Mavuso Sports Centre' }
];
/*
const LEAGUES = [
  { value: 'Premier League', label: 'PLE' },
  { value: 'Super League', label: 'Super League' },
  { value: 'Regional League', label: 'Regional League' },
  { value: 'NFD', label: 'NFD' }
]; */
const VENUES = [
  { value: 'hhohho', label: 'Hhohho' },
  { value: 'lubombo', label: 'Lubombo' },
  { value: 'manzini', label: 'Manzini' },
  { value: 'shiselweni', label: 'Shiselweni' }
];
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

export default function IncidentReport() {
  const [file, setFile] = useState<File | null>(null); // THIS IS MANDATORY
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { matchData: match, mode } = location.state || {}; // Extract mode
  const isViewOnly = mode === 'view';

  const { register, handleSubmit, control, reset, formState: { isSubmitting, errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      matchDate: match?.date || new Date().toISOString().split('T')[0],
      homeTeam: match?.homeTeam || '',
      awayTeam: match?.awayTeam || '',
      stadium: match?.stadium || '',
      venue: match?.venue || '',
    }
  });

  // Sync with Dashboard data
  useEffect(() => { if (match) reset({ ...match, matchDate: match.date }); }, [match, reset]);

  // Load existing report data if in view mode
  useEffect(() => {
    if (isViewOnly && match?.id) {
      const loadReportData = async () => {
        try {
          const { data: report, error } = await supabase
            .from('incident_reports')
            .select('*')
            .eq('id', `IR-${match.id}`)
            .maybeSingle();

          if (error) throw error;
          if (report) {
            reset({
              matchDate: report.match_date,
              matchNo: report.match_no,
              kickOff: report.kick_off,
              homeTeam: report.home_team,
              awayTeam: report.away_team,
              venue: report.venue,
              stadium: report.stadium,
              incidentLocation: report.incident_location,
              whatHappened: report.what_happened,
              actionsTaken: report.actions_taken,
              additionalInfo: report.additional_info,
            });
            if (report.incident_photo_url) {
              setImagePreview(supabase.storage.from('incident-photos').getPublicUrl(report.incident_photo_url).data.publicUrl);
            }
          }
        } catch (error) {
          console.error('Error loading report data:', error);
        }
      };
      loadReportData();
    }
  }, [isViewOnly, match?.id, reset]);
  
  const onSubmit = async (data: FormData) => {
    // 1. Get user from Supabase Auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert("You must be logged in.");
    if (!match?.id) return alert("Match ID missing!");

    try {
      // 2. Handle file upload if present
      let imageUrl = null;
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
    } catch (error: any) {
      console.error(error);
      alert('Error saving data: ' + error.message);
    }
  };
  
  return (
    <div className="w-screen min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl bg-white rounded-2xl shadow-xl overflow-hidden border border-red-100">
        <div className="bg-gradient-to-r from-red-800 to-red-950 py-8 px-10 text-white text-center">
          <ShieldAlert className="w-12 h-12 mx-auto mb-2 text-white" />
          <h1 className="text-3xl font-bold tracking-tight">INCIDENT REPORT</h1>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-8 md:p-12 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label="Match Date" type="date" {...register('matchDate')} error={errors.matchDate} disabled={isViewOnly || !!match} />
            <Input label="Match Number" {...register('matchNo')} error={errors.matchNo} disabled={isViewOnly} />
            <Input label="Kick-off time" type="time" {...register('kickOff')} error={errors.kickOff} disabled={isViewOnly} />
            <SearchableDropdown label="Home Team" name="homeTeam" control={control} options={TEAMS} error={errors.homeTeam} disabled={isViewOnly || !!match} />
            <SearchableDropdown label="Away Team" name="awayTeam" control={control} options={TEAMS} error={errors.awayTeam} disabled={isViewOnly || !!match} />
            <SearchableDropdown label="Venue" name="venue" control={control} options={VENUES} error={errors.venue} disabled={isViewOnly || !!match} />
            <SearchableDropdown label="Stadium" name="stadium" control={control} options={STADIUMS} error={errors.stadium} disabled={isViewOnly || !!match} />
          </div>
          
          <div className="space-y-6">
            <TextArea label="Where and when did the incident take place?" {...register('incidentLocation')} error={errors.incidentLocation} disabled={isViewOnly} />
            <TextArea label="Please specify as accurately as possible, what happened." {...register('whatHappened')} error={errors.whatHappened} disabled={isViewOnly} />
            <TextArea label="What actions were taken to resolve the Incident?" {...register('actionsTaken')} error={errors.actionsTaken} disabled={isViewOnly} />
            <TextArea label="Any Additional Information" {...register('additionalInfo')} error={errors.additionalInfo} disabled={isViewOnly} />
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Please Upload Incident Photo</h3>
            <div className="p-6 border-2 border-dashed border-gray-300 rounded-xl text-center">
              <Upload className="mx-auto text-gray-400 mb-2" />
              <input 
                type="file" 
                accept="image/*" 
                capture="environment" 
                onChange={(e) => {
                  const selectedFile = e.target.files ? e.target.files[0] : null;
                  setFile(selectedFile);
                  if (selectedFile) {
                    setImagePreview(URL.createObjectURL(selectedFile));
                  } else {
                    setImagePreview(null);
                  }
                }} 
                className="text-sm text-gray-500" 
                disabled={isViewOnly}
              />
              <p className="text-xs text-gray-500 mt-2">Capture or select an image of the incident</p>
            </div>
            {imagePreview && (
              <div className="mt-4">
                <img src={imagePreview} alt="Incident photo" className="max-w-full h-auto rounded-lg shadow-md" />
              </div>
            )}
          </div>

          <div className="flex gap-4 justify-end pt-6">
            <button type="button" onClick={() => navigate('/dashboard')} className="px-8 py-3 !bg-red-600 text-white rounded-xl hover:!bg-red-700">Cancel</button>
            {!isViewOnly && (
              <>
                <button type="button" className="px-8 py-3 !bg-gray-600 text-white rounded-xl hover:!bg-gray-700">Save Draft</button>
                <button type="submit" disabled={isSubmitting} className="px-10 py-3 !bg-green-600 text-white rounded-xl hover:!bg-green-700">{isSubmitting ? 'Submitting...' : 'Submit Report'}</button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

// Helpers updated for Error handling
function SearchableDropdown({ label, name, control, options, error, disabled }: any) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <Controller name={name} control={control} render={({ field }) => (
        <Select {...field} options={options} onChange={(v: any) => field.onChange(v.value)} value={options.find((o: any) => o.value === field.value)} isDisabled={disabled}
          styles={{ 
            control: (base) => ({ ...base, borderColor: error ? '#dc2626' : '#d1d5db', padding: '2px' }),
            option: (base) => ({ ...base, color: 'black' }), singleValue: (base) => ({ ...base, color: 'black' }) 
          }} 
        />
      )} />
      {error && <p className="text-red-600 text-xs mt-1">{error.message}</p>}
    </div>
  );
}

function Input({ label, error, disabled, ...props }: any) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input {...props} disabled={disabled} className={`w-full px-4 py-3 border rounded-lg text-black ${error ? 'border-red-600' : 'border-gray-300'} ${disabled ? 'bg-gray-100' : ''}`} />
      {error && <p className="text-red-600 text-xs mt-1">{error.message}</p>}
    </div>
  );
}

function TextArea({ label, error, disabled, ...props }: any) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <textarea {...props} disabled={disabled} rows={3} className={`w-full px-4 py-3 border rounded-lg text-black ${error ? 'border-red-600' : 'border-gray-300'} ${disabled ? 'bg-gray-100' : ''}`} />
      {error && <p className="text-red-600 text-xs mt-1">{error.message}</p>}
    </div>
  );
}
