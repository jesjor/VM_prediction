// VM 2026 - Komplet pointsystem
// Top X logik: gætter du plads 2, og spilleren ender på plads 1, giver det stadig point
// fordi plads 1 er "inden for top 2". Men gætter du plads 1 og han ender på plads 2 = 0 point.

const norm = s => (s || '').trim().toLowerCase();

export function calcTournamentPoints(prediction, results) {
  if (!prediction) return { pts: 0, breakdown: [] };
  let pts = 0;
  const breakdown = [];

  // Top 3 topscorer & assist
  // Logik: gætter du plads i, og spilleren faktisk ender på plads j hvor j <= i → point for plads i
  // Dvs. gætter du top 2, og han vinder (plads 1) → 15 pt (top 2 belønning)
  // Men gætter du top 1, og han ender på plads 2 → 0 pt
  // Samme spiller på alle 3 pladser: tjek alle 3 slots uafhængigt
  const scorerPts = [20, 15, 10];
  for (const cat of [
    { label: 'Topscorer', prefix: 'topscorer' },
    { label: 'Assist',    prefix: 'assist' },
  ]) {
    // Faktiske placeringer (indeks 0 = nr 1, indeks 1 = nr 2, indeks 2 = nr 3)
    const actual = [1,2,3].map(i => norm(results[`${cat.prefix}_${i}_player`] || ''));
    const guesses = [1,2,3].map(i => norm(prediction[`${cat.prefix}_${i}_player`] || ''));

    guesses.forEach((gv, gi) => {
      if (!gv) return;
      // gi = 0 means "I bet this person is top 1" → only scores if actual[0] === gv
      // gi = 1 means "I bet this person is top 2" → scores if actual[0] or actual[1] === gv
      // gi = 2 means "I bet this person is top 3" → scores if actual[0], actual[1] or actual[2] === gv
      const isWithinTop = actual.slice(0, gi + 1).includes(gv);
      if (isWithinTop) {
        pts += scorerPts[gi];
        breakdown.push({ cat: `${cat.label} top ${gi+1}`, pts: scorerPts[gi] });
      }
    });
  }

  // Top 3 lande — samme Top X logik
  const countryPts = [20, 15, 10];
  const actualCountry = [1,2,3].map(i => norm(results[`country_${i}`] || ''));
  const guessCountry  = [1,2,3].map(i => norm(prediction[`country_${i}`] || ''));
  guessCountry.forEach((gv, gi) => {
    if (!gv) return;
    const isWithinTop = actualCountry.slice(0, gi + 1).includes(gv);
    if (isWithinTop) {
      pts += countryPts[gi];
      breakdown.push({ cat: ['VM vinder (top 1)','VM top 2','VM top 3'][gi], pts: countryPts[gi] });
    }
  });

  // Gruppe: vinder 5pt, nr. 2 3pt (eksakt — grupper er binære)
  for (const g of ['a','b','c','d','e','f','g','h','i','j','k','l']) {
    const rw = norm(results[`group_winner_${g}`] || '');
    const r2 = norm(results[`group_runner_${g}`] || '');
    const pw = norm(prediction[`group_winner_${g}`] || '');
    const p2 = norm(prediction[`group_runner_${g}`] || '');
    if (rw && pw && rw === pw) { pts += 5;  breakdown.push({ cat: `Gruppe ${g.toUpperCase()} vinder`, pts: 5 }); }
    if (r2 && p2 && r2 === p2) { pts += 3;  breakdown.push({ cat: `Gruppe ${g.toUpperCase()} nr. 2`,  pts: 3 }); }
  }

  // Øvrige kategorier med opdaterede pointværdier
  const singles = [
    { key: 'most_yellow_player',       label: 'Flest gule kort (spiller)',   pts: 20 },
    { key: 'most_yellow_team_overall', label: 'Flest gule kort (hold)',       pts: 20 },
    { key: 'most_red_player',          label: 'Flest røde kort (spiller)',    pts: 20 },
    { key: 'most_red_team_overall',    label: 'Flest røde kort (hold)',       pts: 20 },
    { key: 'most_card_pts_player',     label: 'Flest kortpoint (spiller)',    pts: 20 },
    { key: 'most_card_pts_team',       label: 'Flest kortpoint (hold)',       pts: 20 },
    { key: 'most_mvp_player',          label: 'Flest MVP (spiller)',          pts: 3  },
    { key: 'tournament_player',        label: 'Turneringsspiller',            pts: 25 },
    { key: 'least_goals_conceded',     label: 'Færrest mål lukket ind',       pts: 20 },
    { key: 'most_goals_scored',        label: 'Flest mål scoret',             pts: 20 },
  ];
  for (const s of singles) {
    const rv = norm(results[s.key] || '');
    const pv = norm(prediction[s.key] || '');
    if (rv && pv && rv === pv) { pts += s.pts; breakdown.push({ cat: s.label, pts: s.pts }); }
  }

  return { pts, breakdown };
}

// Dream team: 5pt pr rigtig spiller, 25pt for bedste spiller
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
    pts += 25;
    breakdown.push({ cat: `Bedste spiller i turneringen`, pts: 25 });
  }

  return { pts, breakdown };
}

// Per-kamp: 1X2=3pt, første målscorer=3pt, kampens spiller=3pt, eksakt score=3pt bonus
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

  // Eksakt score bonus
  // Eksakt score bonus — treat null as 0 (user may have left one field empty meaning 0)
  const predHome = prediction.exact_home !== null && prediction.exact_home !== undefined ? parseInt(prediction.exact_home) : null;
  const predAway = prediction.exact_away !== null && prediction.exact_away !== undefined ? parseInt(prediction.exact_away) : null;
  // If one is set and other is null, treat null as 0
  const ehNorm = predHome !== null ? predHome : (predAway !== null ? 0 : null);
  const eaNorm = predAway !== null ? predAway : (predHome !== null ? 0 : null);
  if (ehNorm !== null && eaNorm !== null && match.home_score !== null && match.away_score !== null) {
    if (ehNorm === match.home_score &&
        eaNorm === match.away_score) {
      pts += 3;
      breakdown.push({ cat: `Eksakt score (${match.home_score}-${match.away_score})`, pts: 3 });
    }
  }

  const evs = events || match.events || [];
  const firstGoal = evs.find(e => e.event_type === 'goal' || e.event_type === 'own_goal');
  if (prediction.first_scorer_team === 'ingen') {
    if (!firstGoal) { pts += 3; breakdown.push({ cat: `Ingen målscorer (0-0)`, pts: 3 }); }
  } else if (prediction.first_scorer_player && firstGoal) {
    if (norm(firstGoal.player) === norm(prediction.first_scorer_player) &&
        norm(firstGoal.team)   === norm(prediction.first_scorer_team)) {
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
