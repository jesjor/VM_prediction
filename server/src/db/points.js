// VM 2026 - Komplet pointsystem (opdateret)

const norm = s => (s || '').trim().toLowerCase();

export function calcTournamentPoints(prediction, results) {
  if (!prediction) return { pts: 0, breakdown: [] };
  let pts = 0;
  const breakdown = [];

  // Top 3 scorer & assist — kun eksakt plads tæller. Samme spiller på flere pladser = alle tæller hvis rigtig.
  for (const cat of [
    { label: 'Topscorer', prefix: 'topscorer' },
    { label: 'Assist', prefix: 'assist' },
  ]) {
    const rvals = [1,2,3].map(i => norm(results[`${cat.prefix}_${i}_player`] || ''));
    const pvals = [1,2,3].map(i => norm(prediction[`${cat.prefix}_${i}_player`] || ''));
    const posP = [5, 3, 1];
    pvals.forEach((pv, i) => {
      if (!pv) return;
      if (pv === rvals[i]) {
        pts += posP[i];
        breakdown.push({ cat: `${cat.label} ${i+1}. plads`, pts: posP[i] });
      }
      // 0 point for forkert plads — ingen bonus
    });
  }

  // Top 3 lande — Vinder: 20pt, 2. plads: 15pt, 3. plads: 10pt. Ingen bonus for forkert plads.
  const countryPts = [20, 15, 10];
  const rCountry = [1,2,3].map(i => norm(results[`country_${i}`] || ''));
  const pCountry = [1,2,3].map(i => norm(prediction[`country_${i}`] || ''));
  pCountry.forEach((pv, i) => {
    if (!pv) return;
    if (pv === rCountry[i]) {
      pts += countryPts[i];
      breakdown.push({ cat: ['Vinder af VM','2. plads VM','3. plads VM'][i], pts: countryPts[i] });
    }
  });

  // Gruppe: vinder 5pt, nr. 2 3pt
  for (const g of ['a','b','c','d','e','f','g','h','i','j','k','l']) {
    const rw = norm(results[`group_winner_${g}`] || '');
    const r2 = norm(results[`group_runner_${g}`] || '');
    const pw = norm(prediction[`group_winner_${g}`] || '');
    const p2 = norm(prediction[`group_runner_${g}`] || '');
    if (rw && pw && rw === pw) { pts += 5; breakdown.push({ cat: `Gruppe ${g.toUpperCase()} vinder`, pts: 5 }); }
    if (r2 && p2 && r2 === p2) { pts += 3; breakdown.push({ cat: `Gruppe ${g.toUpperCase()} nr. 2`, pts: 3 }); }
  }

  // Øvrige kategorier
  const singles = [
    { key: 'most_yellow_player',      label: 'Flest gule kort (spiller)', pts: 3 },
    { key: 'most_yellow_team_overall',label: 'Flest gule kort (hold)',    pts: 3 },
    { key: 'most_red_player',         label: 'Flest røde kort (spiller)', pts: 3 },
    { key: 'most_red_team_overall',   label: 'Flest røde kort (hold)',    pts: 3 },
    { key: 'most_mvp_player',         label: 'Flest MVP (spiller)',       pts: 3 },
    { key: 'tournament_player',       label: 'Turneringsspiller',         pts: 5 },
    { key: 'least_goals_conceded',    label: 'Færrest mål lukket ind',    pts: 3 },
    { key: 'most_goals_scored',       label: 'Flest mål scoret',          pts: 3 },
  ];
  for (const s of singles) {
    const rv = norm(results[s.key] || '');
    const pv = norm(prediction[s.key] || '');
    if (rv && pv && rv === pv) { pts += s.pts; breakdown.push({ cat: s.label, pts: s.pts }); }
  }

  return { pts, breakdown };
}

// Dream team: 5pt pr rigtig spiller i VM holdet, 20pt for bedste spiller
export function calcDreamTeamPoints(prediction, results) {
  if (!prediction || !results) return { pts: 0, breakdown: [] };
  let pts = 0;
  const breakdown = [];

  const officialTeam = (results.dream_team_players || []).map(p => norm(p));
  const predicted = (prediction.players || []).map(p => norm(p.player));

  for (const pv of predicted) {
    if (!pv) continue;
    if (officialTeam.includes(pv)) {
      pts += 5;
      breakdown.push({ cat: `VM hold: ${pv}`, pts: 5 });
    }
  }

  const rBest = norm(results.dream_team_best_player || '');
  const pBest = norm(prediction.best_player || '');
  if (rBest && pBest && rBest === pBest) {
    pts += 20;
    breakdown.push({ cat: `Bedste spiller i turneringen`, pts: 20 });
  }

  return { pts, breakdown };
}

// Per-kamp: 1X2=3pt, første målscorer=3pt, kampens spiller=3pt
export function calcMatchPoints(prediction, match, events) {
  if (!match || match.status !== 'finished') return { pts: 0, breakdown: [] };
  let pts = 0;
  const breakdown = [];

  let actual = null;
  if (match.home_score !== null && match.away_score !== null) {
    actual = match.home_score > match.away_score ? '1' : match.away_score > match.home_score ? '2' : 'X';
  }
  if (actual && prediction.prediction === actual) {
    pts += 3;
    breakdown.push({ cat: `Kampresultat (${match.home_team} vs ${match.away_team})`, pts: 3 });
  }

  const evs = events || match.events || [];
  const firstGoal = evs.find(e => e.event_type === 'goal' || e.event_type === 'own_goal');
  if (prediction.first_scorer_team === 'ingen') {
    if (!firstGoal) { pts += 3; breakdown.push({ cat: `Ingen målscorer (0-0)`, pts: 3 }); }
  } else if (prediction.first_scorer_player && firstGoal) {
    if (norm(firstGoal.player) === norm(prediction.first_scorer_player) &&
        norm(firstGoal.team) === norm(prediction.first_scorer_team)) {
      pts += 3;
      breakdown.push({ cat: `Første målscorer: ${prediction.first_scorer_player}`, pts: 3 });
    }
  }

  if (prediction.match_mvp_player && match.match_mvp_player) {
    if (norm(match.match_mvp_player) === norm(prediction.match_mvp_player)) {
      pts += 3;
      breakdown.push({ cat: `Kampens spiller: ${prediction.match_mvp_player}`, pts: 3 });
    }
  }

  return { pts, breakdown };
}
