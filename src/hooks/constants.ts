const NATIONAL_TEAM_COUNTRIES = [
  'Angola',
  'Botswana',
  'Comoros',
  'Eswatini',
  'Lesotho',
  'Madagascar',
  'Malawi',
  'Mauritius',
  'Mozambique',
  'Namibia',
  'Seychelles',
  'South Africa',
  'Zambia',
  'Zimbabwe',
];

const nationalTeamOptions = NATIONAL_TEAM_COUNTRIES.map((country) => ({ value: country, label: country }));

export const TEAMS = [
  {
    label: "MTN Premier League",
    options: [
      { value: 'Amawele FC', label: 'Amawele FC' },
      { value: 'Ezulwini United FC', label: 'Ezulwini United FC' },
      { value: 'Green Mamba FC', label: 'Green Mamba FC' },
      { value: 'Manzini Sea Birds FC', label: 'Manzini Sea Birds FC' },
      { value: 'Ppk Professionals FC', label: 'Ppk Professionals FC' },
      { value: 'Mbabane Highlanders FC', label: 'Mbabane Highlanders FC' },
      { value: 'Mbabane Swallows FC', label: 'Mbabane Swallows FC' },
      { value: 'Moneni Pirates FC', label: 'Moneni Pirates FC' },
      { value: 'Nsingizini Hotspurs FC', label: 'Nsingizini Hotspurs FC' },
      { value: 'Rangers FC', label: 'Rangers FC' },
      { value: 'Royal Leopard FC', label: 'Royal Leopard FC' },
      { value: 'Ubombo Sugar FC', label: 'Ubombo Sugar FC' },
      { value: 'Young Buffaloes FC', label: 'Young Buffaloes FC' },
      { value: 'Madlenya FC', label: 'Madlenya FC'},
      { value: 'Celtics FC', label: 'Celtics FC' },
      { value: 'Red Rhinos FC', label: 'Red Rhinos FC' }
    ]
  },
  {
    label: "Mulasport National First Division",
    options: [
      { value: 'All Nations FC', label: 'All Nations FC' },
      { value: 'Nkwene Sundowns FC', label: 'Nkwene Sundowns FC' },
      { value: 'Manzini Sundowns FC', label: 'Manzini Sundowns FC' },
      { value: 'Moyeni Supersport FC', label: 'Moyeni Supersport' },
      { value: 'CPL FC', label: 'CPL FC' },
      { value: 'Magwanyana FC', label: 'Magwanyana FC' },
      { value: 'Viva Stumbo XI FC', label: 'Viva Stumbo XI FC' },
      { value: 'Lozitha Spurs FC', label: 'Lozitha Spurs FC' },
      { value: 'Mankayane United FC', label: 'Mankayane United FC' },
      { value: 'Msumpe Manchester FC', label: 'Msumpe Manchester FC' },
      { value: 'Mpini Cosmos FC', label: 'Mpini Cosmos FC' },
      { value: 'Manzini Wanderers FC', label: 'Manzini Wanderers FC' },
      { value: 'Emajukujuku FC', label: 'Emajukujuku FC' },
      { value: 'Sisonkhe FC', label: 'Sisonkhe FC' },
      { value: 'Malanti Chiefs FC', label: 'Malanti Chiefs FC' },
      { value: 'Sidvwashini United FC', label: 'Sidvwashini United FC' }
    ]
  },
  {
    label: "Women Football League",
    options: [
      { value: 'Young Buffaloes Ladies FC', label: 'Young Buffaloes Ladies FC' },
      { value: 'Nsingizini Hotspurs Ladies FC', label: 'Nsingizini Hotspurs Ladies FC' },
      { value: 'Manzini Wanderers Ladies FC', label: 'Manzini Wanderers Ladies FC' },
      { value: 'Mbabane Swallows Ladies FC', label: 'Mbabane Swallows Ladies FC' },
      { value: 'Royal Leopards Ladies FC', label: 'Royal Leopards Ladies FC' },
      { value: 'Green Mamba Ladies FC', label: 'Green Mamba Ladies FC' },
      { value: 'AS Interladies FC', label: 'AS Interladies FC' },
      { value: 'Southern Divas FC', label: 'Southern Divas FC' },
      { value: 'Matsapha Roses FC', label: 'Matsapha Roses FC' },
      { value: 'Mbekelweni Ladies FC', label: 'Mbekelweni Ladies FC' },
      { value: 'Sidvwashini United Ladies FC', label: 'Sidvwashini United Ladies FC' },
      { value: 'MT Phoenix Ladies FC', label: 'MT Phoenix Ladies FC' }
    ]
  },
  {
    label: "National Teams - Senior",
    options: nationalTeamOptions
  },
  { label: "National Teams - U15", options: nationalTeamOptions },
  { label: "National Teams - U17", options: nationalTeamOptions },
  { label: "National Teams - U20", options: nationalTeamOptions },
  { label: "National Teams - U23", options: nationalTeamOptions },
];

export const normalizeTeamCategory = (category?: string) => {
  const aliases: Record<string, string> = {
    "Mulasport National First Division (NFD)": "Mulasport National First Division",
    "Women's Category": "Women Football League",
    "National Teams (COSAFA/Regional)": "National Teams - Senior",
  };
  const normalized = category ? aliases[category] || category : TEAMS[0].label;
  return TEAMS.some((group) => group.label === normalized) ? normalized : TEAMS[0].label;
};

export const getConfiguredTeams = () => {
  if (typeof window === 'undefined') return TEAMS;

  try {
    const stored = window.localStorage.getItem('efa-reference-data');
    if (!stored) return TEAMS;
    const settings = JSON.parse(stored) as {
      teamsManaged?: boolean;
      teams?: { name: string; shortName?: string; category?: string }[];
    };
    const savedTeams = settings.teams;
    if (!Array.isArray(savedTeams)) return TEAMS;

    const configuredTeams = settings.teamsManaged
      ? savedTeams.map((team) => ({
          category: normalizeTeamCategory(team.category),
          value: team.shortName || team.name,
          label: team.name,
        }))
      : TEAMS.flatMap((group) => group.options.map((team) => {
          const savedTeam = savedTeams.find((item) =>
            (item.name === team.label || item.shortName === team.value) &&
            normalizeTeamCategory(item.category) === group.label
          );
          return {
            category: normalizeTeamCategory(savedTeam?.category || group.label),
            value: savedTeam?.shortName || team.value,
            label: savedTeam?.name || team.label,
          };
        }));
    const customTeams = savedTeams
      .filter(() => !settings.teamsManaged)
      .filter((team) => !TEAMS.some((group) =>
        normalizeTeamCategory(team.category) === group.label &&
        group.options.some((option) => option.label === team.name || option.value === team.shortName)
      ))
      .map((team) => ({ category: normalizeTeamCategory(team.category), value: team.shortName || team.name, label: team.name }));

    return TEAMS.map((group) => ({
      label: group.label,
      options: [...configuredTeams, ...customTeams]
        .filter((team) => team.category === group.label)
        .map(({ value, label }) => ({ value, label })),
    }));
  } catch (error) {
    console.error('Unable to read managed team settings:', error);
    return TEAMS;
  }
};

export const TOURNAMENTS = [
  {
    label: "Professional League",
    options: [
      { value: 'MTN Premier League', label: 'MTN Premier League' },
      { value: 'Mulasport NFD', label: 'Mulasport NFD' }
    ]
  },
  {
    label: "Cup Competitions",
    options: [
      { value: 'Ingwenyama Cup', label: 'SMVA Ingwenyama Cup' },
      { value: 'FA Cup', label: 'FA Cup' }
    ]
  },
  {
    label: "Development & Women's",
    options: [
      { value: 'Women\'s Football League', label: 'Women\'s Football League' },
      { value: 'U-20 Youth League', label: 'U-20 Youth League' },
      { value: 'Regional Super Cup', label: 'Regional Super Cup' }
    ]
  },
  {
    label: "International/Regional",
    options: [
      { value: 'COSAFA Cup', label: 'COSAFA Cup' },
      { value: 'AFCON Qualifiers', label: 'AFCON Qualifiers' },
      { value: 'CAF Champions League', label: 'CAF Champions League' },
      { value: 'CAF Confederation Cup', label: 'CAF Confederation Cup' }
    ]
  }
];

export const STADIUMS = [
  {
    label: "Hhohho Region",
    options: [
      { value: 'Somhlolo National Stadium', label: 'Somhlolo National Stadium' },
      { value: 'Prince of Wales Stadium', label: 'Prince of Wales Stadium' },
      { value: 'Mkhuzweni Technical Centre', label: 'Mkhuzweni Technical Centre' }
    ]
  },
  {
    label: "Manzini Region",
    options: [
      { value: 'Mavuso Sports Centre', label: 'Mavuso Sports Centre' },
      { value: 'Bhunya Stadium', label: 'Bhunya Stadium' },
      { value: 'Killarney Sports Field', label: 'Killarney Sports Field' }
    ]
  },
  {
    label: "Lubombo Region",
    options: [
      { value: 'Kalanga Stadium', label: 'Kalanga Stadium' },
      { value: 'Mhlume Stadium', label: 'Mhlume Stadium' }
    ]
  },
  {
    label: "Shiselweni Region",
    options: [
      { value: 'Mayaluka Stadium', label: 'Mayaluka Stadium' },
      { value: 'King Sobhuza II Memorial Stadium', label: 'King Sobhuza II Memorial Stadium' }   
    ]
  }
];

export const LEAGUES = [
  {
    label: "Professional Divisions",
    options: [
      { value: 'MTN Premier League', label: 'MTN Premier League' },
      { value: 'Mulasport NFD', label: 'National First Division (NFD)' }
    ]
  },
  {
    label: "Regional Leagues",
    options: [
      { value: 'Hhohho Super League', label: 'Hhohho Super League' },
      { value: 'Manzini Super League', label: 'Manzini Super League' },
      { value: 'Lubombo Super League', label: 'Lubombo Super League' },
      { value: 'Shiselweni Super League', label: 'Shiselweni Super League' },
      { value: 'Regional First Division', label: 'Regional First Division' }
    ]
  },
  {
    label: "Women's & Youth",
    options: [
      { value: 'Women\'s Football League', label: 'Women\'s Football League' },
      { value: 'U-20 Youth League', label: 'U-20 Youth League' },
      { value: 'U-17 Youth League', label: 'U-17 Youth League' }
    ]
  },
  {
    label: "Other",
    options: [
      { value: 'Other/Friendly', label: 'Friendly/Exhibition Match' }
    ]
  }
];

export const VENUES = [
  { value: 'Hhohho', label: 'Hhohho' },
  { value: 'Lubombo', label: 'Lubombo' },
  { value: 'Manzini', label: 'Manzini' },
  { value: 'Shiselweni', label: 'Shiselweni' }
];

export const FIELD_LABELS: Record<string, string> = {
  expected_attendance: 'Expected Stadium Attendance',
  venue_meeting: 'How was the Venue Safety & Security meeting? Explain Briefly',
  stewards_briefing: 'How was the Briefing of Stewards’ supervisors? Explain Briefly',
  control_measures: 'How is the red-line precinct? Explain Briefly',
  match_coordination: 'How was the Match coordination meeting? Explain Briefly',
  loc_cooperation: 'How was the cooperation and teamwork with LOC counterparts? Explain briefly.',
  team_trainings: 'How were the Official Team trainings? Explain Briefly',
  voc_commander_cooperation: 'How was the Cooperation and teamwork with the Venue Operations Center (VOC) Commander? Explain Briefly',
  stadium_authority_cooperation: 'How was the Cooperation and teamwork with Stadium Authority? Explain Briefly',
  ple_delegation_cooperation: 'How was the Cooperation and teamwork with PLE delegation? Explain Briefly',
  attendance: 'What was the stadium attendance?',
  access_control: 'How was the Access control operation during matchday? Explain briefly.',
  staircases: 'Were Staircases and gangways clear of Spectators? Explain briefly.',
  supporter_behavior: 'How was the general behaviour of Supporters? Explain briefly.',
  official_behavior: 'How was the behaviour of Team officials? Explain briefly.',
  voc_interaction: 'How was the interaction with the Venue Operation Center (VOC)? Explain briefly.',
  stadium_cleanliness: 'Were Stadium surroundings clean? Explain briefly.',
  security_debrief: 'How was the general Security debriefing? Explain briefly.',
  stadium_authority: 'How was the cooperation and teamwork with the Stadium authority? Explain briefly.',
  ple_delegation: 'How was the cooperation and teamwork with the PLE delegation? Explain briefly.',
  incident_location: 'Where and when did the incident take place?',
  incident_description: 'Please specify as accurately as possible, what happened.',
  incident_resolution: 'What actions were taken to resolve the Incident?',
  additional_information: 'Any Additional Information',
  incident_photo_url: 'Incident Photo',
  overall_evaluation: 'What is your Overall evaluation?',
  issues_description: 'If there were any issues/concerns, please provide a Description and Evaluation of the resolution for each of the issues. Explain briefly.',
  what_happened: 'Please specify as accurately as possible, what happened.',
  actions_taken: 'What actions were taken to resolve the Incident?',
  additional_info: 'Please provide any additional information.',
  redline_precinct: 'How is the red-line precinct? Explain Briefly',
  press_conferences: 'How were the Press Conferences? Explain Briefly',
  organizing_committee_cooperation: 'How was the cooperation and teamwork with LOC counterparts? Explain Briefly',
  loc_counterparts: 'How was the cooperation and teamwork with LOC counterparts? Explain Briefly',
  home_score: 'Home Score',
  away_score: 'Away Score'
};

export const FIELD_ORDERS: Record<string, string[]> = {
  m1: ['expected_attendance','venue_meeting','stewards_briefing','control_measures',
    'match_coordination','team_trainings','press_conferences','loc_counterparts','voc_commander_cooperation',
    'stadium_authority_cooperation','ple_delegation_cooperation','overall_evaluation','issues_description'
  ],
  day: ['home_score','away_score','attendance','access_control','staircases',
    'supporter_behavior','official_behavior','voc_interaction','stadium_cleanliness',
    'security_debrief','loc_cooperation','stadium_authority','ple_delegation','overall_evaluation',
    'issues_description'
  ],
  incident: ['incident_location', 'incident_description', 'incident_resolution', 'additional_information']
};

export const METADATA_KEYS = ['home_team', 'id', 'match_id', 'away_team', 'date', 'venue', 'stadium', 'assigned_officer_name', 'assigned_officer', 'tournament', 'league', 'officer_email', 'report_id', 'created_at', 'updated_at', 'status', 'officer_name', 'submitted_at'];
