/* eslint-disable */
/* @ts-nocheck */
import { useState } from 'react';
import type { ReactNode } from 'react';
import Select from 'react-select';
import { db } from '../lib/supabase';
import { TOURNAMENTS, LEAGUES, getConfiguredTeams, VENUES, STADIUMS } from '../hooks/constants';

const selectStyles = {
  control: (base: any) => ({ ...base, padding: '2px', borderColor: '#d1d5db', minHeight: '38px' }),
  singleValue: (base: any) => ({ ...base, color: 'black' }),
  option: (base: any, state: any) => ({ ...base, color: 'black', backgroundColor: state.isFocused ? '#EFF6FF' : 'white' }),
  menuPortal: (base: any) => ({ ...base, zIndex: 9999 })
};

export function AddMatchForm({ onAdd, officers }: { onAdd: () => void; officers: any[] }) {
  const [data, setData] = useState({ homeTeam: '', awayTeam: '', date: '', stadium: '', tournament: '', league: '', venue: '', assignedUserId: '', assignedOfficerName: '' });
  const teams = getConfiguredTeams();

  const teamOptionsFor = (excludedTeam: string) => teams.map((group: any) => ({
    ...group,
    options: group.options.filter((team: any) => team.value !== excludedTeam),
  })).filter((group: any) => group.options.length > 0);

  const submit = async () => {
    if (!data.homeTeam || !data.awayTeam || !data.date || !data.assignedUserId) return alert('All fields required');
    if (data.homeTeam === data.awayTeam) return alert('Home team and away team must be different.');
    const { error } = await db.from('matches').insert([{ ...data, assignedUserId: data.assignedUserId, status: 'M-1 Pending', createdAt: new Date().toISOString() }]);
    if (error) return alert('Error saving match: ' + error.message);
    onAdd();
  };

  return (
    <div className="p-4 md:p-6 !bg-gray-50 border-b grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      <Select options={TOURNAMENTS} menuPortalTarget={document.body} placeholder="Tournament" styles={selectStyles} onChange={(v: any) => setData({ ...data, tournament: v.label })} />
      <Select options={LEAGUES} menuPortalTarget={document.body} placeholder="League" styles={selectStyles} onChange={(v: any) => setData({ ...data, league: v.label })} />
      <Select
        options={teamOptionsFor(data.awayTeam)}
        value={data.homeTeam ? { value: data.homeTeam, label: data.homeTeam } : null}
        menuPortalTarget={document.body}
        placeholder="Home Team"
        styles={selectStyles}
        onChange={(v: any) => setData({ ...data, homeTeam: v?.value || '' })}
        noOptionsMessage={() => 'Select a different away team first'}
      />
      <Select
        options={teamOptionsFor(data.homeTeam)}
        value={data.awayTeam ? { value: data.awayTeam, label: data.awayTeam } : null}
        menuPortalTarget={document.body}
        placeholder="Away Team"
        styles={selectStyles}
        onChange={(v: any) => setData({ ...data, awayTeam: v?.value || '' })}
        noOptionsMessage={() => 'Select a different home team first'}
      />
      <input
        type="date"
        className="p-2 border border-gray-200 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 [&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:!bg-blue-900 [&::-webkit-calendar-picker-indicator]:font-white"
        onChange={(e) => setData({ ...data, date: e.target.value })}
      />
      <Select options={VENUES} menuPortalTarget={document.body} placeholder="Venue" styles={selectStyles} onChange={(v: any) => setData({ ...data, venue: v.value })} />
      <Select options={STADIUMS} menuPortalTarget={document.body} placeholder="Stadium" styles={selectStyles} onChange={(v: any) => setData({ ...data, stadium: v.value })} />
      <Select options={officers} menuPortalTarget={document.body} placeholder="Assign Officer" styles={selectStyles} onChange={(v: any) => setData({ ...data, assignedUserId: v.value, assignedOfficerName: v.label })} />
      <button onClick={submit} className="sm:col-span-2 lg:col-span-1 !bg-green-600 text-white font-bold rounded-lg hover:!bg-green-700 transition-colors py-2">
        Save Match
      </button>
    </div>
  );
}

type StatCardProps = {
  title: string;
  detail: string;
  value: number;
  icon: ReactNode;
  onClick?: () => void;
};

export function StatCard({ title, detail, value, icon, onClick }: StatCardProps) {
  const content = (
    <>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">{value}</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-2.5 text-slate-500">{icon}</div>
      </div>
      <p className="mt-2 truncate text-xs text-slate-500">{detail}</p>
    </>
  );
  const className = `w-full rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm ${
    onClick ? 'transition hover:border-blue-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500' : ''
  }`;

  return onClick
    ? <button type="button" onClick={onClick} className={className}>{content}</button>
    : <div className={className}>{content}</div>;
}
