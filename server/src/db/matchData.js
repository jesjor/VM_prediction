// All 104 FIFA World Cup 2026 matches
// Times stored as UTC (ET + 4 hours in summer / ET + 5 in late June/July)
// ET = UTC-4 during DST (summer)

export const STADIUMS = {
  azteca:      { name: 'Estadio Azteca',                city: 'Mexico City, Mexico',       capacity: 87523 },
  akron:       { name: 'Estadio Akron',                 city: 'Zapopan, Mexico',            capacity: 49850 },
  bbva:        { name: 'Estadio BBVA',                  city: 'Monterrey, Mexico',          capacity: 53500 },
  bmo:         { name: 'BMO Field',                     city: 'Toronto, Canada',            capacity: 30000 },
  bcplace:     { name: 'BC Place',                      city: 'Vancouver, Canada',          capacity: 54500 },
  sofi:        { name: 'SoFi Stadium',                  city: 'Inglewood, CA, USA',         capacity: 70240 },
  levis:       { name: "Levi's Stadium",                city: 'Santa Clara, CA, USA',       capacity: 68500 },
  att:         { name: 'AT&T Stadium',                  city: 'Arlington, TX, USA',         capacity: 80000 },
  nrg:         { name: 'NRG Stadium',                   city: 'Houston, TX, USA',           capacity: 72220 },
  metlife:     { name: 'MetLife Stadium',               city: 'East Rutherford, NJ, USA',   capacity: 82500 },
  gillette:    { name: 'Gillette Stadium',              city: 'Foxborough, MA, USA',        capacity: 65878 },
  arrowhead:   { name: 'Arrowhead Stadium',             city: 'Kansas City, MO, USA',       capacity: 76416 },
  lumen:       { name: 'Lumen Field',                   city: 'Seattle, WA, USA',           capacity: 72000 },
  hardrock:    { name: 'Hard Rock Stadium',             city: 'Miami Gardens, FL, USA',     capacity: 65326 },
  mercedes:    { name: 'Mercedes-Benz Stadium',         city: 'Atlanta, GA, USA',           capacity: 71000 },
  lincoln:     { name: 'Lincoln Financial Field',       city: 'Philadelphia, PA, USA',      capacity: 69796 },
};

export const GROUPS = {
  A: { teams: ['Mexico', 'South Africa', 'South Korea', 'Czechia'] },
  B: { teams: ['Canada', 'Bosnia & Herzegovina', 'Qatar', 'Switzerland'] },
  C: { teams: ['Brazil', 'Morocco', 'Haiti', 'Scotland'] },
  D: { teams: ['USA', 'Paraguay', 'Australia', 'Türkiye'] },
  E: { teams: ['Germany', 'Curaçao', 'Ivory Coast', 'Ecuador'] },
  F: { teams: ['Netherlands', 'Japan', 'Sweden', 'Tunisia'] },
  G: { teams: ['Belgium', 'Egypt', 'Iran', 'New Zealand'] },
  H: { teams: ['Spain', 'Cape Verde', 'Saudi Arabia', 'Uruguay'] },
  I: { teams: ['France', 'Senegal', 'Iraq', 'Norway'] },
  J: { teams: ['Argentina', 'Algeria', 'Austria', 'Jordan'] },
  K: { teams: ['Portugal', 'DR Congo', 'Uzbekistan', 'Colombia'] },
  L: { teams: ['England', 'Croatia', 'Ghana', 'Panama'] },
};

// et() converts ET time string to UTC ISO string
function et(dateStr, timeStr) {
  // dateStr: '2026-06-11', timeStr: '15:00' (ET)
  // DST: ET = UTC-4 all through June/July
  const [h, m] = timeStr.split(':').map(Number);
  const utcH = h + 4;
  const date = new Date(`${dateStr}T00:00:00Z`);
  let utcDate = new Date(date);
  let finalH = utcH;
  let daysAdd = 0;
  if (finalH >= 24) { finalH -= 24; daysAdd = 1; }
  if (finalH < 0)   { finalH += 24; daysAdd = -1; }
  utcDate.setUTCDate(utcDate.getUTCDate() + daysAdd);
  const pad = n => String(n).padStart(2, '0');
  return `${utcDate.toISOString().slice(0,10)}T${pad(finalH)}:${pad(m)}:00Z`;
}

export const GROUP_STAGE_MATCHES = [
  // === JUNE 11 ===
  { id: 1,  group: 'A', home: 'Mexico',       away: 'South Africa', kickoff: et('2026-06-11','15:00'), stadium: 'azteca' },
  { id: 2,  group: 'A', home: 'South Korea',  away: 'Czechia',      kickoff: et('2026-06-11','22:00'), stadium: 'akron' },
  // === JUNE 12 ===
  { id: 3,  group: 'B', home: 'Canada',       away: 'Bosnia & Herzegovina', kickoff: et('2026-06-12','15:00'), stadium: 'bmo' },
  { id: 4,  group: 'D', home: 'USA',          away: 'Paraguay',     kickoff: et('2026-06-12','21:00'), stadium: 'sofi' },
  // === JUNE 13 ===
  { id: 5,  group: 'B', home: 'Qatar',        away: 'Switzerland',  kickoff: et('2026-06-13','15:00'), stadium: 'levis' },
  { id: 6,  group: 'C', home: 'Brazil',       away: 'Morocco',      kickoff: et('2026-06-13','18:00'), stadium: 'metlife' },
  { id: 7,  group: 'C', home: 'Haiti',        away: 'Scotland',     kickoff: et('2026-06-13','21:00'), stadium: 'gillette' },
  // === JUNE 14 ===
  { id: 8,  group: 'D', home: 'Australia',    away: 'Türkiye',      kickoff: et('2026-06-14','00:00'), stadium: 'bcplace' },
  { id: 9,  group: 'E', home: 'Germany',      away: 'Curaçao',      kickoff: et('2026-06-14','13:00'), stadium: 'nrg' },
  { id: 10, group: 'F', home: 'Netherlands',  away: 'Japan',        kickoff: et('2026-06-14','16:00'), stadium: 'att' },
  { id: 11, group: 'E', home: 'Ivory Coast',  away: 'Ecuador',      kickoff: et('2026-06-14','19:00'), stadium: 'lincoln' },
  { id: 12, group: 'F', home: 'Sweden',       away: 'Tunisia',      kickoff: et('2026-06-14','22:00'), stadium: 'bbva' },
  // === JUNE 15 ===
  { id: 13, group: 'H', home: 'Spain',        away: 'Cape Verde',   kickoff: et('2026-06-15','12:00'), stadium: 'mercedes' },
  { id: 14, group: 'G', home: 'Belgium',      away: 'Egypt',        kickoff: et('2026-06-15','15:00'), stadium: 'lumen' },
  { id: 15, group: 'H', home: 'Saudi Arabia', away: 'Uruguay',      kickoff: et('2026-06-15','18:00'), stadium: 'hardrock' },
  { id: 16, group: 'G', home: 'Iran',         away: 'New Zealand',  kickoff: et('2026-06-15','21:00'), stadium: 'sofi' },
  // === JUNE 16 ===
  { id: 17, group: 'I', home: 'France',       away: 'Senegal',      kickoff: et('2026-06-16','15:00'), stadium: 'metlife' },
  { id: 18, group: 'I', home: 'Iraq',         away: 'Norway',       kickoff: et('2026-06-16','18:00'), stadium: 'gillette' },
  { id: 19, group: 'J', home: 'Argentina',    away: 'Algeria',      kickoff: et('2026-06-16','21:00'), stadium: 'arrowhead' },
  // === JUNE 17 ===
  { id: 20, group: 'J', home: 'Austria',      away: 'Jordan',       kickoff: et('2026-06-17','00:00'), stadium: 'levis' },
  { id: 21, group: 'K', home: 'Portugal',     away: 'DR Congo',     kickoff: et('2026-06-17','13:00'), stadium: 'nrg' },
  { id: 22, group: 'L', home: 'England',      away: 'Croatia',      kickoff: et('2026-06-17','16:00'), stadium: 'att' },
  { id: 23, group: 'L', home: 'Ghana',        away: 'Panama',       kickoff: et('2026-06-17','19:00'), stadium: 'bmo' },
  { id: 24, group: 'K', home: 'Uzbekistan',   away: 'Colombia',     kickoff: et('2026-06-17','22:00'), stadium: 'azteca' },
  // === JUNE 18 ===
  { id: 25, group: 'A', home: 'Czechia',      away: 'South Africa', kickoff: et('2026-06-18','12:00'), stadium: 'mercedes' },
  { id: 26, group: 'B', home: 'Switzerland',  away: 'Bosnia & Herzegovina', kickoff: et('2026-06-18','15:00'), stadium: 'sofi' },
  { id: 27, group: 'B', home: 'Canada',       away: 'Qatar',        kickoff: et('2026-06-18','18:00'), stadium: 'bcplace' },
  { id: 28, group: 'A', home: 'Mexico',       away: 'South Korea',  kickoff: et('2026-06-18','21:00'), stadium: 'akron' },
  // === JUNE 19 ===
  { id: 29, group: 'D', home: 'USA',          away: 'Australia',    kickoff: et('2026-06-19','15:00'), stadium: 'lumen' },
  { id: 30, group: 'C', home: 'Scotland',     away: 'Morocco',      kickoff: et('2026-06-19','18:00'), stadium: 'gillette' },
  { id: 31, group: 'C', home: 'Brazil',       away: 'Haiti',        kickoff: et('2026-06-19','20:30'), stadium: 'lincoln' },
  { id: 32, group: 'D', home: 'Türkiye',      away: 'Paraguay',     kickoff: et('2026-06-19','23:00'), stadium: 'levis' },
  // === JUNE 20 ===
  { id: 33, group: 'F', home: 'Netherlands',  away: 'Sweden',       kickoff: et('2026-06-20','13:00'), stadium: 'nrg' },
  { id: 34, group: 'E', home: 'Germany',      away: 'Ivory Coast',  kickoff: et('2026-06-20','16:00'), stadium: 'bmo' },
  { id: 35, group: 'E', home: 'Ecuador',      away: 'Curaçao',      kickoff: et('2026-06-20','20:00'), stadium: 'arrowhead' },
  // === JUNE 21 ===
  { id: 36, group: 'F', home: 'Tunisia',      away: 'Japan',        kickoff: et('2026-06-21','00:00'), stadium: 'bbva' },
  { id: 37, group: 'H', home: 'Spain',        away: 'Saudi Arabia', kickoff: et('2026-06-21','12:00'), stadium: 'mercedes' },
  { id: 38, group: 'G', home: 'Belgium',      away: 'Iran',         kickoff: et('2026-06-21','15:00'), stadium: 'sofi' },
  { id: 39, group: 'H', home: 'Uruguay',      away: 'Cape Verde',   kickoff: et('2026-06-21','18:00'), stadium: 'hardrock' },
  { id: 40, group: 'G', home: 'New Zealand',  away: 'Egypt',        kickoff: et('2026-06-21','21:00'), stadium: 'bcplace' },
  // === JUNE 22 ===
  { id: 41, group: 'J', home: 'Argentina',    away: 'Austria',      kickoff: et('2026-06-22','13:00'), stadium: 'att' },
  { id: 42, group: 'I', home: 'France',       away: 'Iraq',         kickoff: et('2026-06-22','17:00'), stadium: 'lincoln' },
  { id: 43, group: 'I', home: 'Norway',       away: 'Senegal',      kickoff: et('2026-06-22','20:00'), stadium: 'metlife' },
  { id: 44, group: 'J', home: 'Jordan',       away: 'Algeria',      kickoff: et('2026-06-22','23:00'), stadium: 'levis' },
  // === JUNE 23 ===
  { id: 45, group: 'K', home: 'Portugal',     away: 'Uzbekistan',   kickoff: et('2026-06-23','13:00'), stadium: 'nrg' },
  { id: 46, group: 'L', home: 'England',      away: 'Ghana',        kickoff: et('2026-06-23','16:00'), stadium: 'gillette' },
  { id: 47, group: 'L', home: 'Panama',       away: 'Croatia',      kickoff: et('2026-06-23','19:00'), stadium: 'bmo' },
  { id: 48, group: 'K', home: 'Colombia',     away: 'DR Congo',     kickoff: et('2026-06-23','22:00'), stadium: 'akron' },
  // === JUNE 24 (final matchday groups A-C) ===
  { id: 49, group: 'B', home: 'Switzerland',  away: 'Canada',       kickoff: et('2026-06-24','15:00'), stadium: 'bcplace' },
  { id: 50, group: 'B', home: 'Bosnia & Herzegovina', away: 'Qatar',kickoff: et('2026-06-24','15:00'), stadium: 'lumen' },
  { id: 51, group: 'C', home: 'Scotland',     away: 'Brazil',       kickoff: et('2026-06-24','18:00'), stadium: 'hardrock' },
  { id: 52, group: 'C', home: 'Morocco',      away: 'Haiti',        kickoff: et('2026-06-24','18:00'), stadium: 'mercedes' },
  { id: 53, group: 'A', home: 'Czechia',      away: 'Mexico',       kickoff: et('2026-06-24','21:00'), stadium: 'azteca' },
  { id: 54, group: 'A', home: 'South Africa', away: 'South Korea',  kickoff: et('2026-06-24','21:00'), stadium: 'bbva' },
  // === JUNE 25 (final matchday groups D-F) ===
  { id: 55, group: 'E', home: 'Curaçao',      away: 'Ivory Coast',  kickoff: et('2026-06-25','16:00'), stadium: 'lincoln' },
  { id: 56, group: 'E', home: 'Ecuador',      away: 'Germany',      kickoff: et('2026-06-25','16:00'), stadium: 'metlife' },
  { id: 57, group: 'F', home: 'Japan',        away: 'Sweden',       kickoff: et('2026-06-25','19:00'), stadium: 'att' },
  { id: 58, group: 'F', home: 'Tunisia',      away: 'Netherlands',  kickoff: et('2026-06-25','19:00'), stadium: 'arrowhead' },
  { id: 59, group: 'D', home: 'Türkiye',      away: 'USA',          kickoff: et('2026-06-25','22:00'), stadium: 'sofi' },
  { id: 60, group: 'D', home: 'Paraguay',     away: 'Australia',    kickoff: et('2026-06-25','22:00'), stadium: 'levis' },
  // === JUNE 26 (final matchday groups G-I) ===
  { id: 61, group: 'I', home: 'Norway',       away: 'France',       kickoff: et('2026-06-26','15:00'), stadium: 'gillette' },
  { id: 62, group: 'I', home: 'Senegal',      away: 'Iraq',         kickoff: et('2026-06-26','15:00'), stadium: 'bmo' },
  { id: 63, group: 'H', home: 'Cape Verde',   away: 'Saudi Arabia', kickoff: et('2026-06-26','20:00'), stadium: 'nrg' },
  { id: 64, group: 'H', home: 'Uruguay',      away: 'Spain',        kickoff: et('2026-06-26','20:00'), stadium: 'akron' },
  { id: 65, group: 'G', home: 'Egypt',        away: 'Iran',         kickoff: et('2026-06-26','23:00'), stadium: 'lumen' },
  { id: 66, group: 'G', home: 'New Zealand',  away: 'Belgium',      kickoff: et('2026-06-26','23:00'), stadium: 'bcplace' },
  // === JUNE 27 (final matchday groups J-L) ===
  { id: 67, group: 'L', home: 'Panama',       away: 'England',      kickoff: et('2026-06-27','17:00'), stadium: 'metlife' },
  { id: 68, group: 'L', home: 'Croatia',      away: 'Ghana',        kickoff: et('2026-06-27','17:00'), stadium: 'lincoln' },
  { id: 69, group: 'K', home: 'Colombia',     away: 'Portugal',     kickoff: et('2026-06-27','19:30'), stadium: 'hardrock' },
  { id: 70, group: 'K', home: 'DR Congo',     away: 'Uzbekistan',   kickoff: et('2026-06-27','19:30'), stadium: 'mercedes' },
  { id: 71, group: 'J', home: 'Algeria',      away: 'Austria',      kickoff: et('2026-06-27','22:00'), stadium: 'arrowhead' },
  { id: 72, group: 'J', home: 'Jordan',       away: 'Argentina',    kickoff: et('2026-06-27','22:00'), stadium: 'att' },
];

// Knockout bracket - teams filled in dynamically as tournament progresses
export const KNOCKOUT_MATCHES = [
  // Round of 32
  { id: 73,  round: 'R32', label: 'Runner-up A vs Runner-up B',          kickoff: et('2026-06-28','15:00'), stadium: 'sofi',      homeSlot: 'R-A',  awaySlot: 'R-B'  },
  { id: 74,  round: 'R32', label: 'Winner E vs Best 3rd',                kickoff: et('2026-06-29','16:30'), stadium: 'gillette',  homeSlot: 'W-E',  awaySlot: 'B3-ABCDF' },
  { id: 75,  round: 'R32', label: 'Winner F vs Runner-up C',             kickoff: et('2026-06-29','21:00'), stadium: 'bbva',      homeSlot: 'W-F',  awaySlot: 'R-C'  },
  { id: 76,  round: 'R32', label: 'Winner C vs Runner-up F',             kickoff: et('2026-06-29','13:00'), stadium: 'nrg',       homeSlot: 'W-C',  awaySlot: 'R-F'  },
  { id: 77,  round: 'R32', label: 'Winner I vs Best 3rd',                kickoff: et('2026-06-30','17:00'), stadium: 'metlife',   homeSlot: 'W-I',  awaySlot: 'B3-CDFGH' },
  { id: 78,  round: 'R32', label: 'Runner-up E vs Runner-up I',          kickoff: et('2026-06-30','13:00'), stadium: 'att',       homeSlot: 'R-E',  awaySlot: 'R-I'  },
  { id: 79,  round: 'R32', label: 'Winner A vs Best 3rd',                kickoff: et('2026-06-30','21:00'), stadium: 'azteca',    homeSlot: 'W-A',  awaySlot: 'B3-CEFHI' },
  { id: 80,  round: 'R32', label: 'Winner L vs Best 3rd',                kickoff: et('2026-07-01','12:00'), stadium: 'mercedes',  homeSlot: 'W-L',  awaySlot: 'B3-EHIJK' },
  { id: 81,  round: 'R32', label: 'Winner D vs Best 3rd',                kickoff: et('2026-07-01','20:00'), stadium: 'levis',     homeSlot: 'W-D',  awaySlot: 'B3-BEFIJ' },
  { id: 82,  round: 'R32', label: 'Winner G vs Best 3rd',                kickoff: et('2026-07-01','16:00'), stadium: 'lumen',     homeSlot: 'W-G',  awaySlot: 'B3-AEHIJ' },
  { id: 83,  round: 'R32', label: 'Runner-up K vs Runner-up L',          kickoff: et('2026-07-02','19:00'), stadium: 'bmo',       homeSlot: 'R-K',  awaySlot: 'R-L'  },
  { id: 84,  round: 'R32', label: 'Winner H vs Runner-up J',             kickoff: et('2026-07-02','15:00'), stadium: 'sofi',      homeSlot: 'W-H',  awaySlot: 'R-J'  },
  { id: 85,  round: 'R32', label: 'Winner B vs Best 3rd',                kickoff: et('2026-07-02','23:00'), stadium: 'bcplace',   homeSlot: 'W-B',  awaySlot: 'B3-EFGIJ' },
  { id: 86,  round: 'R32', label: 'Winner J vs Runner-up H',             kickoff: et('2026-07-03','18:00'), stadium: 'hardrock',  homeSlot: 'W-J',  awaySlot: 'R-H'  },
  { id: 87,  round: 'R32', label: 'Winner K vs Best 3rd',                kickoff: et('2026-07-03','21:30'), stadium: 'arrowhead', homeSlot: 'W-K',  awaySlot: 'B3-DEIJL' },
  { id: 88,  round: 'R32', label: 'Runner-up D vs Runner-up G',          kickoff: et('2026-07-03','14:00'), stadium: 'att',       homeSlot: 'R-D',  awaySlot: 'R-G'  },
  // Round of 16
  { id: 89,  round: 'R16', label: 'Winner M73 vs Winner M74',            kickoff: et('2026-07-04','17:00'), stadium: 'lincoln',   homeSlot: 'W-73', awaySlot: 'W-74' },
  { id: 90,  round: 'R16', label: 'Winner M75 vs Winner M76',            kickoff: et('2026-07-04','13:00'), stadium: 'nrg',       homeSlot: 'W-75', awaySlot: 'W-76' },
  { id: 91,  round: 'R16', label: 'Winner M77 vs Winner M78',            kickoff: et('2026-07-05','16:00'), stadium: 'metlife',   homeSlot: 'W-77', awaySlot: 'W-78' },
  { id: 92,  round: 'R16', label: 'Winner M79 vs Winner M80',            kickoff: et('2026-07-05','20:00'), stadium: 'azteca',    homeSlot: 'W-79', awaySlot: 'W-80' },
  { id: 93,  round: 'R16', label: 'Winner M83 vs Winner M84',            kickoff: et('2026-07-06','15:00'), stadium: 'att',       homeSlot: 'W-83', awaySlot: 'W-84' },
  { id: 94,  round: 'R16', label: 'Winner M81 vs Winner M82',            kickoff: et('2026-07-06','20:00'), stadium: 'lumen',     homeSlot: 'W-81', awaySlot: 'W-82' },
  { id: 95,  round: 'R16', label: 'Winner M86 vs Winner M88',            kickoff: et('2026-07-07','12:00'), stadium: 'mercedes',  homeSlot: 'W-86', awaySlot: 'W-88' },
  { id: 96,  round: 'R16', label: 'Winner M85 vs Winner M87',            kickoff: et('2026-07-07','16:00'), stadium: 'bcplace',   homeSlot: 'W-85', awaySlot: 'W-87' },
  // Quarterfinals
  { id: 97,  round: 'QF',  label: 'QF1: Winner M89 vs Winner M90',       kickoff: et('2026-07-09','16:00'), stadium: 'gillette',  homeSlot: 'W-89', awaySlot: 'W-90' },
  { id: 98,  round: 'QF',  label: 'QF2: Winner M93 vs Winner M94',       kickoff: et('2026-07-10','15:00'), stadium: 'sofi',      homeSlot: 'W-93', awaySlot: 'W-94' },
  { id: 99,  round: 'QF',  label: 'QF3: Winner M91 vs Winner M92',       kickoff: et('2026-07-11','17:00'), stadium: 'hardrock',  homeSlot: 'W-91', awaySlot: 'W-92' },
  { id: 100, round: 'QF',  label: 'QF4: Winner M95 vs Winner M96',       kickoff: et('2026-07-11','21:00'), stadium: 'arrowhead', homeSlot: 'W-95', awaySlot: 'W-96' },
  // Semifinals
  { id: 101, round: 'SF',  label: 'SF1: Winner QF1 vs Winner QF2',       kickoff: et('2026-07-14','15:00'), stadium: 'att',       homeSlot: 'W-97', awaySlot: 'W-98' },
  { id: 102, round: 'SF',  label: 'SF2: Winner QF3 vs Winner QF4',       kickoff: et('2026-07-15','15:00'), stadium: 'mercedes',  homeSlot: 'W-99', awaySlot: 'W-100' },
  // Third place
  { id: 103, round: '3RD', label: '3rd Place: Loser SF1 vs Loser SF2',   kickoff: et('2026-07-18','17:00'), stadium: 'hardrock',  homeSlot: 'L-101', awaySlot: 'L-102' },
  // Final
  { id: 104, round: 'FINAL', label: 'FINAL',                             kickoff: et('2026-07-19','15:00'), stadium: 'metlife',   homeSlot: 'W-101', awaySlot: 'W-102' },
];

export const ALL_MATCHES = [...GROUP_STAGE_MATCHES, ...KNOCKOUT_MATCHES];

// All teams with flag emojis
export const TEAMS = {
  'Mexico':               { flag: '🇲🇽', group: 'A' },
  'South Africa':         { flag: '🇿🇦', group: 'A' },
  'South Korea':          { flag: '🇰🇷', group: 'A' },
  'Czechia':              { flag: '🇨🇿', group: 'A' },
  'Canada':               { flag: '🇨🇦', group: 'B' },
  'Bosnia & Herzegovina': { flag: '🇧🇦', group: 'B' },
  'Qatar':                { flag: '🇶🇦', group: 'B' },
  'Switzerland':          { flag: '🇨🇭', group: 'B' },
  'Brazil':               { flag: '🇧🇷', group: 'C' },
  'Morocco':              { flag: '🇲🇦', group: 'C' },
  'Haiti':                { flag: '🇭🇹', group: 'C' },
  'Scotland':             { flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', group: 'C' },
  'USA':                  { flag: '🇺🇸', group: 'D' },
  'Paraguay':             { flag: '🇵🇾', group: 'D' },
  'Australia':            { flag: '🇦🇺', group: 'D' },
  'Türkiye':              { flag: '🇹🇷', group: 'D' },
  'Germany':              { flag: '🇩🇪', group: 'E' },
  'Curaçao':              { flag: '🇨🇼', group: 'E' },
  'Ivory Coast':          { flag: '🇨🇮', group: 'E' },
  'Ecuador':              { flag: '🇪🇨', group: 'E' },
  'Netherlands':          { flag: '🇳🇱', group: 'F' },
  'Japan':                { flag: '🇯🇵', group: 'F' },
  'Sweden':               { flag: '🇸🇪', group: 'F' },
  'Tunisia':              { flag: '🇹🇳', group: 'F' },
  'Belgium':              { flag: '🇧🇪', group: 'G' },
  'Egypt':                { flag: '🇪🇬', group: 'G' },
  'Iran':                 { flag: '🇮🇷', group: 'G' },
  'New Zealand':          { flag: '🇳🇿', group: 'G' },
  'Spain':                { flag: '🇪🇸', group: 'H' },
  'Cape Verde':           { flag: '🇨🇻', group: 'H' },
  'Saudi Arabia':         { flag: '🇸🇦', group: 'H' },
  'Uruguay':              { flag: '🇺🇾', group: 'H' },
  'France':               { flag: '🇫🇷', group: 'I' },
  'Senegal':              { flag: '🇸🇳', group: 'I' },
  'Iraq':                 { flag: '🇮🇶', group: 'I' },
  'Norway':               { flag: '🇳🇴', group: 'I' },
  'Argentina':            { flag: '🇦🇷', group: 'J' },
  'Algeria':              { flag: '🇩🇿', group: 'J' },
  'Austria':              { flag: '🇦🇹', group: 'J' },
  'Jordan':               { flag: '🇯🇴', group: 'J' },
  'Portugal':             { flag: '🇵🇹', group: 'K' },
  'DR Congo':             { flag: '🇨🇩', group: 'K' },
  'Uzbekistan':           { flag: '🇺🇿', group: 'K' },
  'Colombia':             { flag: '🇨🇴', group: 'K' },
  'England':              { flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', group: 'L' },
  'Croatia':              { flag: '🇭🇷', group: 'L' },
  'Ghana':                { flag: '🇬🇭', group: 'L' },
  'Panama':               { flag: '🇵🇦', group: 'L' },
};
