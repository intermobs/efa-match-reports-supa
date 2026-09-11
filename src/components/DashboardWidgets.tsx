/* eslint-disable */
/* @ts-nocheck */
import { useState } from 'react';
import Select from 'react-select';
import { db } from '../lib/supabase';
import { TOURNAMENTS, LEAGUES, TEAMS, VENUES, STADIUMS } from '../hooks/constants';

const selectStyles = {
  control: (base: any) => ({ ...base, padding: '2px', borderColor: '#d1d5db', minHeight: '38px' }),
  singleValue: (base: any) => ({ ...base, color: 'black' }),
  option: (base: any, state: any) => ({ ...base, color: 'black', backgroundColor: state.isFocused ? '#EFF6FF' : 'white' }),
  menuPortal: (base: any) => ({ ...base, zIndex: 9999 })
};

export function AddMatchForm({ onAdd, officers }: { onAdd: () => void; officers: any[] }) {
  const [data, setData] = useState({ homeTeam: '', awayTeam: '', date: '', stadium: '', tournament: '', league: '', venue: '', assignedUserId: '', assignedOfficerName: '' });

  const submit = async () => {
    if (!data.homeTeam || !data.awayTeam || !data.date || !data.assignedUserId) return alert('All fields required');
    const { error } = await db.from('matches').insert([{ ...data, assignedUserId: data.assignedUserId, status: 'M-1 Pending', createdAt: new Date().toISOString() }]);
    if (error) return alert('Error saving match: ' + error.message);
    onAdd();
  };

  return (
    <div className="p-4 md:p-6 !bg-gray-50 border-b grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      <Select options={TOURNAMENTS} menuPortalTarget={document.body} placeholder="Tournament" styles={selectStyles} onChange={(v: any) => setData({ ...data, tournament: v.label })} />
      <Select options={LEAGUES} menuPortalTarget={document.body} placeholder="League" styles={selectStyles} onChange={(v: any) => setData({ ...data, league: v.label })} />
      <Select options={TEAMS} menuPortalTarget={document.body} placeholder="Home Team" styles={selectStyles} onChange={(v: any) => setData({ ...data, homeTeam: v.value })} />
      <Select options={TEAMS} menuPortalTarget={document.body} placeholder="Away Team" styles={selectStyles} onChange={(v: any) => setData({ ...data, awayTeam: v.value })} />
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

export function StatCard({ title, subtitle, subtitle2, value, icon, onClick }: any) {
  const clickable = Boolean(onClick);
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left bg-white p-6 rounded-3xl shadow-sm border border-gray-100 transition-all duration-200 ${clickable ? 'hover:shadow-xl hover:border-gray-200 cursor-pointer transform hover:-translate-y-0.5' : ''}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-600">{title}</p>
          {subtitle && <p className="mt-2 text-xs text-slate-500">{subtitle}</p>}
          {subtitle2 && <p className="mt-2 text-xs text-slate-500">{subtitle2}</p>}
        </div>
        <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">{icon}</div>
      </div>
      <div className="mt-6">
        <p className="text-3xl font-semibold tracking-tight text-slate-900">{value}</p>
      </div>
    </button>
  );
}
