import { Router } from 'express';
import { pool } from '../db/index.js';
import { requireAdmin } from '../middleware/auth.js';
import { calcTournamentPoints, calcMatchPoints, calcDreamTeamPoints } from '../db/points.js';

const router = Router();

// ── STATIC ROUTES FIRST (before /:id) ─────────────────────────────────────

// GET leaderboard
router.get('/', async (req, res) => {
  try {
    const parts = await pool.query('SELECT id, name, created_at FROM participants ORDER BY name ASC');
    const resultsRaw = await pool.query('SELECT result_key, team, player FROM tournament_results');
    const tournResults = {};
    resultsRaw.rows.forEach(r => { tournResults[r.result_key] = r.player || r.team; });
    const dtPlayersRaw = tournResults['dream_team_players'];
    const dtResults = {
      dream_team_players: dtPlayersRaw ? JSON.parse(dtPlayersRaw) : [],
      dream_team_best_player: tournResults['dream_team_best_player'] || ''
    };
    const matches = await pool.query(`
      SELECT m.*, COALESCE(json_agg(me ORDER BY me.minute ASC) FILTER (WHERE me.id IS NOT NULL), '[]') as events
      FROM matches m LEFT JOIN match_events me ON me.match_id = m.id
      WHERE m.status = 'finished' GROUP BY m.id
    `);
    const matchMap = {};
    matches.rows.forEach(m => matchMap[m.id] = m);
    const data = await Promise.all(parts.rows.map(async p => {
      const [tp, mp, dt] = await Promise.all([
        pool.query('SELECT * FROM tournament_predictions WHERE participant_id=$1', [p.id]),
        pool.query('SELECT * FROM match_predictions WHERE participant_id=$1', [p.id]),
        pool.query('SELECT * FROM dream_team_predictions WHERE participant_id=$1', [p.id]),
      ]);
      const tournPred = tp.rows[0] || {};
      const tournPts = calcTournamentPoints(tournPred, tournResults);
      const dreamPts = calcDreamTeamPoints(dt.rows[0] || null, dtResults);
      let matchPts = 0;
      const matchBreakdown = [];
      for (const pred of mp.rows) {
        const match = matchMap[pred.match_id];
        if (!match) continue;
        const r = calcMatchPoints(pred, match, match.events);
        matchPts += r.pts;
        matchBreakdown.push(...r.breakdown);
      }
      return { ...p, tournament_pts: tournPts.pts, dream_team_pts: dreamPts.pts, match_pts: matchPts,
               total_pts: tournPts.pts + dreamPts.pts + matchPts,
               _varGuess: tournPts.varGuess,
               breakdown: [...tournPts.breakdown, ...dreamPts.breakdown, ...matchBreakdown] };
    }));
    // VAR penalty ranking: nearest guess wins 30pt, 2nd nearest 15pt
    const varTotalRes = await pool.query("SELECT player FROM tournament_results WHERE result_key='var_penalties_total'");
    const varTotal = varTotalRes.rows.length ? parseInt(varTotalRes.rows[0].player) || null : null;

    if (varTotal !== null) {
      // Rank all participants by closeness to actual
      const withVar = data.filter(p => p._varGuess !== null && p._varGuess !== undefined);
      withVar.sort((a, b) => Math.abs(a._varGuess - varTotal) - Math.abs(b._varGuess - varTotal));
      if (withVar.length > 0) {
        withVar[0].tournament_pts += 30;
        withVar[0].total_pts += 30;
        withVar[0].breakdown.push({ cat: `VAR straffespark (gættet ${withVar[0]._varGuess}, var ${varTotal}) 🎯 1. plads`, pts: 30 });
      }
      if (withVar.length > 1 && Math.abs(withVar[1]._varGuess - varTotal) !== Math.abs(withVar[0]._varGuess - varTotal)) {
        withVar[1].tournament_pts += 15;
        withVar[1].total_pts += 15;
        withVar[1].breakdown.push({ cat: `VAR straffespark (gættet ${withVar[1]._varGuess}, var ${varTotal}) 2. plads`, pts: 15 });
      }
    }

    // VAR special predictions scoring
    const varPreds = await pool.query('SELECT * FROM var_predictions');
    const varTotalsRes = await pool.query(
      "SELECT result_key, player FROM tournament_results WHERE result_key IN ('var_penalties_total','var_red_cards_total','var_goals_disallowed_total')"
    );
    const varTotals = {};
    varTotalsRes.rows.forEach(r => { varTotals[r.result_key] = parseInt(r.player)||null; });

    const varPredMap = {};
    varPreds.rows.forEach(vp => { varPredMap[vp.participant_id] = vp; });

    // For each VAR category: nearest guess wins 30pt, 2nd nearest 15pt
    const varCategories = [
      { key: 'var_penalties', totalKey: 'var_penalties_total', label: 'VAR straffespark' },
      { key: 'var_red_cards', totalKey: 'var_red_cards_total', label: 'VAR røde kort' },
      { key: 'var_goals_disallowed', totalKey: 'var_goals_disallowed_total', label: 'VAR annullerede mål' },
    ];

    for (const cat of varCategories) {
      const actual = varTotals[cat.totalKey];
      if (actual === null || actual === undefined) continue;

      const ranked = data
        .filter(p => varPredMap[p.id]?.[cat.key] !== null && varPredMap[p.id]?.[cat.key] !== undefined)
        .map(p => ({ p, guess: parseInt(varPredMap[p.id][cat.key]), diff: Math.abs(parseInt(varPredMap[p.id][cat.key]) - actual) }))
        .sort((a, b) => a.diff - b.diff);

      if (ranked.length > 0) {
        ranked[0].p.tournament_pts += 30;
        ranked[0].p.total_pts += 30;
        ranked[0].p.breakdown.push({ cat: `${cat.label} (gættet ${ranked[0].guess}, var ${actual}) 🎯 1.`, pts: 30 });
      }
      if (ranked.length > 1 && ranked[1].diff !== ranked[0].diff) {
        ranked[1].p.tournament_pts += 15;
        ranked[1].p.total_pts += 15;
        ranked[1].p.breakdown.push({ cat: `${cat.label} (gættet ${ranked[1].guess}, var ${actual}) 2.`, pts: 15 });
      }
    }

    data.sort((a, b) => b.total_pts - a.total_pts);
    res.json(data);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Serverfejl' }); }
});

// POST create participant
router.post('/', async (req, res) => {
  const { name, pin } = req.body;
  if (!name || !pin || pin.length !== 4) return res.status(400).json({ error: 'Navn og 4-cifret PIN kræves' });
  try {
    const existing = await pool.query('SELECT id FROM participants WHERE LOWER(name)=LOWER($1)', [name]);
    if (existing.rows.length) return res.status(409).json({ error: 'Navn er allerede taget' });
    const result = await pool.query('INSERT INTO participants (name, pin) VALUES ($1,$2) RETURNING id, name', [name, pin]);
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: 'Serverfejl' }); }
});

// POST verify PIN
router.post('/verify', async (req, res) => {
  const { name, pin } = req.body;
  try {
    const result = await pool.query('SELECT id, name FROM participants WHERE LOWER(name)=LOWER($1) AND pin=$2', [name, pin]);
    if (!result.rows.length) return res.status(401).json({ error: 'Forkert navn eller PIN' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: 'Serverfejl' }); }
});

// GET guess counts for tournament predictions
router.get('/guess-counts/tournament', async (req, res) => {
  try {
    const tp = await pool.query('SELECT * FROM tournament_predictions');
    const counts = { topscorer:{}, assist:{}, country:{}, group_winner:{}, tournament_player:{}, least_goals:{}, most_goals:{}, most_mvp:{}, yellow_player:{}, red_player:{}, card_pts_player:{} };
    for (const p of tp.rows) {
      [1,2,3].forEach(i => {
        const ts=p[`topscorer_${i}_player`]; if(ts) counts.topscorer[ts]=(counts.topscorer[ts]||0)+1;
        const as=p[`assist_${i}_player`]; if(as) counts.assist[as]=(counts.assist[as]||0)+1;
        const co=p[`country_${i}`]; if(co) counts.country[co]=(counts.country[co]||0)+1;
      });
      ['a','b','c','d','e','f','g','h','i','j','k','l'].forEach(g => {
        const gw=p[`group_winner_${g}`]; if(gw) counts.group_winner[gw]=(counts.group_winner[gw]||0)+1;
      });
      if(p.tournament_player) counts.tournament_player[p.tournament_player]=(counts.tournament_player[p.tournament_player]||0)+1;
      if(p.least_goals_conceded) counts.least_goals[p.least_goals_conceded]=(counts.least_goals[p.least_goals_conceded]||0)+1;
      if(p.most_goals_scored) counts.most_goals[p.most_goals_scored]=(counts.most_goals[p.most_goals_scored]||0)+1;
      if(p.most_mvp_player) counts.most_mvp[p.most_mvp_player]=(counts.most_mvp[p.most_mvp_player]||0)+1;
      if(p.most_yellow_player) counts.yellow_player[p.most_yellow_player]=(counts.yellow_player[p.most_yellow_player]||0)+1;
      if(p.most_red_player) counts.red_player[p.most_red_player]=(counts.red_player[p.most_red_player]||0)+1;
      if(p.most_card_pts_player) counts.card_pts_player[p.most_card_pts_player]=(counts.card_pts_player[p.most_card_pts_player]||0)+1;
    }
    res.json({ total: tp.rows.length, counts });
  } catch(err) { res.status(500).json({ error: 'Serverfejl' }); }
});

// GET guess counts for a specific match
router.get('/guess-counts/match/:matchId', async (req, res) => {
  try {
    const mp = await pool.query('SELECT prediction, COUNT(*) as count FROM match_predictions WHERE match_id=$1 GROUP BY prediction', [req.params.matchId]);
    const counts = { '1':0, 'X':0, '2':0, total:0 };
    for (const r of mp.rows) { counts[r.prediction]=parseInt(r.count); counts.total+=parseInt(r.count); }
    res.json(counts);
  } catch(err) { res.status(500).json({ error: 'Serverfejl' }); }
});

// GET activity feed
router.get('/feed/activity', async (req, res) => {
  try {
    const recentMatches = await pool.query(`
      SELECT m.id, m.home_team, m.away_team, m.home_score, m.away_score, m.kickoff, m.round, m.group_name, m.status,
             COALESCE(json_agg(me ORDER BY me.minute) FILTER (WHERE me.id IS NOT NULL), '[]') as events
      FROM matches m LEFT JOIN match_events me ON me.match_id=m.id
      WHERE m.status='finished' GROUP BY m.id ORDER BY m.kickoff DESC LIMIT 8
    `);
    const feed = [];
    for (const m of recentMatches.rows) {
      const preds = await pool.query(`SELECT mp.*, p.name FROM match_predictions mp JOIN participants p ON p.id=mp.participant_id WHERE mp.match_id=$1`, [m.id]);
      const actual = m.home_score > m.away_score ? '1' : m.away_score > m.home_score ? '2' : 'X';
      const evs = m.events||[];
      const firstGoal = evs.find(e=>e.event_type==='goal'||e.event_type==='own_goal');
      const participantResults = preds.rows.map(pred => {
        let pts=0;
        if(pred.prediction===actual) pts+=3;
        const eh=pred.exact_home!==null?parseInt(pred.exact_home):(pred.exact_away!==null?0:null);
        const ea=pred.exact_away!==null?parseInt(pred.exact_away):(pred.exact_home!==null?0:null);
        if(eh!==null&&ea!==null&&eh===m.home_score&&ea===m.away_score) pts+=3;
        if(pred.first_scorer_team==='ingen'&&!firstGoal) pts+=3;
        else if(pred.first_scorer_player&&firstGoal&&firstGoal.player?.toLowerCase()===pred.first_scorer_player?.toLowerCase()) pts+=3;
        if(pred.match_mvp_player&&m.match_mvp_player?.toLowerCase()===pred.match_mvp_player?.toLowerCase()) pts+=3;
        return { name: pred.name, pts };
      }).sort((a,b)=>b.pts-a.pts);
      feed.push({ matchId:m.id, home:m.home_team, away:m.away_team, score:`${m.home_score}-${m.away_score}`, kickoff:m.kickoff, round:m.round, group:m.group_name, participants:participantResults, maxPts:Math.max(0,...participantResults.map(p=>p.pts)) });
    }
    res.json(feed);
  } catch(err) { console.error(err); res.status(500).json({error:'Serverfejl'}); }
});

// GET consensus
router.get('/consensus/tournament', async (req, res) => {
  try {
    const total = await pool.query('SELECT COUNT(*) as count FROM tournament_predictions');
    const n = parseInt(total.rows[0].count);
    if (n===0) return res.json({ total:0, items:[] });
    const tp = await pool.query('SELECT * FROM tournament_predictions');
    const counts = {};
    const add = (key,val) => { if(!val) return; if(!counts[key]) counts[key]={}; counts[key][val]=(counts[key][val]||0)+1; };
    for (const p of tp.rows) {
      add('VM Vinder', p.country_1); add('VM Top 2', p.country_2); add('VM Top 3', p.country_3);
      add('Topscorer Top 1', p.topscorer_1_player); add('Topscorer Top 2', p.topscorer_2_player);
      add('Assist Top 1', p.assist_1_player); add('Turneringsspiller', p.tournament_player);
    }
    const items = [];
    for (const [cat, valMap] of Object.entries(counts)) {
      const sorted = Object.entries(valMap).sort((a,b)=>b[1]-a[1]);
      const [topVal,topCount] = sorted[0];
      items.push({ cat, top:topVal, count:topCount, pct:Math.round(topCount/n*100), total:n, others:sorted.slice(1,3).map(([v,c])=>({v,c})) });
    }
    items.sort((a,b)=>b.pct-a.pct);
    res.json({ total:n, items });
  } catch(err) { res.status(500).json({error:'Serverfejl'}); }
});

// GET all VAR predictions (for leaderboard)
router.get('/var-predictions/all', async (req, res) => {
  try {
    const r = await pool.query('SELECT vp.*, p.name FROM var_predictions vp JOIN participants p ON p.id=vp.participant_id');
    res.json(r.rows);
  } catch(err) { res.status(500).json({ error: 'Serverfejl' }); }
});

// ── DYNAMIC /:id ROUTES BELOW ──────────────────────────────────────────────

router.get('/:id/tournament-prediction', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM tournament_predictions WHERE participant_id=$1', [req.params.id]);
    res.json(r.rows[0] || null);
  } catch (err) { res.status(500).json({ error: 'Serverfejl' }); }
});

router.put('/:id/tournament-prediction', async (req, res) => {
  const { pin, ...prediction } = req.body;
  try {
    const part = await pool.query('SELECT id FROM participants WHERE id=$1 AND pin=$2', [req.params.id, pin]);
    if (!part.rows.length) return res.status(401).json({ error: 'Ugyldig PIN' });
    const lockTime = new Date('2026-06-22T21:59:00Z'); // 22. juni kl. 23:59 dansk tid — alle hold har spillet 1 kamp
    if (new Date() > lockTime) return res.status(403).json({ error: 'Turneringsgæt er låst!' });
    const existing = await pool.query('SELECT id FROM tournament_predictions WHERE participant_id=$1', [req.params.id]);
    const params = buildParams(prediction, req.params.id);
    if (existing.rows.length) {
      await pool.query(`UPDATE tournament_predictions SET
        topscorer_1_team=$1,topscorer_1_player=$2,topscorer_2_team=$3,topscorer_2_player=$4,topscorer_3_team=$5,topscorer_3_player=$6,
        assist_1_team=$7,assist_1_player=$8,assist_2_team=$9,assist_2_player=$10,assist_3_team=$11,assist_3_player=$12,
        country_1=$13,country_2=$14,country_3=$15,
        group_winner_a=$16,group_winner_b=$17,group_winner_c=$18,group_winner_d=$19,group_winner_e=$20,group_winner_f=$21,
        group_winner_g=$22,group_winner_h=$23,group_winner_i=$24,group_winner_j=$25,group_winner_k=$26,group_winner_l=$27,
        group_runner_a=$28,group_runner_b=$29,group_runner_c=$30,group_runner_d=$31,group_runner_e=$32,group_runner_f=$33,
        group_runner_g=$34,group_runner_h=$35,group_runner_i=$36,group_runner_j=$37,group_runner_k=$38,group_runner_l=$39,
        most_yellow_team=$40,most_yellow_player=$41,most_red_team=$42,most_red_player=$43,most_yellow_team_overall=$44,most_red_team_overall=$45,
        most_mvp_player=$46,most_mvp_team=$47,tournament_player=$48,tournament_player_team=$49,
        least_goals_conceded=$50,most_goals_scored=$51,most_card_pts_player=$52,most_card_pts_player_team=$53,most_card_pts_team=$54,
        var_penalties=$55,
        updated_at=NOW() WHERE participant_id=$56`, params);
    } else {
      await pool.query(`INSERT INTO tournament_predictions (
        topscorer_1_team,topscorer_1_player,topscorer_2_team,topscorer_2_player,topscorer_3_team,topscorer_3_player,
        assist_1_team,assist_1_player,assist_2_team,assist_2_player,assist_3_team,assist_3_player,
        country_1,country_2,country_3,
        group_winner_a,group_winner_b,group_winner_c,group_winner_d,group_winner_e,group_winner_f,
        group_winner_g,group_winner_h,group_winner_i,group_winner_j,group_winner_k,group_winner_l,
        group_runner_a,group_runner_b,group_runner_c,group_runner_d,group_runner_e,group_runner_f,
        group_runner_g,group_runner_h,group_runner_i,group_runner_j,group_runner_k,group_runner_l,
        most_yellow_team,most_yellow_player,most_red_team,most_red_player,most_yellow_team_overall,most_red_team_overall,
        most_mvp_player,most_mvp_team,tournament_player,tournament_player_team,
        least_goals_conceded,most_goals_scored,most_card_pts_player,most_card_pts_player_team,most_card_pts_team,
        var_penalties,participant_id
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34,$35,$36,$37,$38,$39,$40,$41,$42,$43,$44,$45,$46,$47,$48,$49,$50,$51,$52,$53,$54,$55,$56)`, params);
    }
    res.json({ ok: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Serverfejl' }); }
});

function buildParams(p, participantId) {
  return [
    p.topscorer_1_team,p.topscorer_1_player,p.topscorer_2_team,p.topscorer_2_player,p.topscorer_3_team,p.topscorer_3_player,
    p.assist_1_team,p.assist_1_player,p.assist_2_team,p.assist_2_player,p.assist_3_team,p.assist_3_player,
    p.country_1,p.country_2,p.country_3,
    p.group_winner_a,p.group_winner_b,p.group_winner_c,p.group_winner_d,p.group_winner_e,p.group_winner_f,
    p.group_winner_g,p.group_winner_h,p.group_winner_i,p.group_winner_j,p.group_winner_k,p.group_winner_l,
    p.group_runner_a,p.group_runner_b,p.group_runner_c,p.group_runner_d,p.group_runner_e,p.group_runner_f,
    p.group_runner_g,p.group_runner_h,p.group_runner_i,p.group_runner_j,p.group_runner_k,p.group_runner_l,
    p.most_yellow_team,p.most_yellow_player,p.most_red_team,p.most_red_player,p.most_yellow_team_overall,p.most_red_team_overall,
    p.most_mvp_player,p.most_mvp_team,p.tournament_player,p.tournament_player_team,
    p.least_goals_conceded,p.most_goals_scored,p.most_card_pts_player,p.most_card_pts_player_team,p.most_card_pts_team,
    p.var_penalties ?? null,
    participantId,
  ];
}

router.get('/:id/match-predictions', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM match_predictions WHERE participant_id=$1', [req.params.id]);
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: 'Serverfejl' }); }
});

router.put('/:id/match-predictions/:matchId', async (req, res) => {
  const { pin, prediction, first_scorer_team, first_scorer_player, match_mvp_team, match_mvp_player, exact_home, exact_away } = req.body;
  const { id, matchId } = req.params;
  try {
    const part = await pool.query('SELECT id FROM participants WHERE id=$1 AND pin=$2', [id, pin]);
    if (!part.rows.length) return res.status(401).json({ error: 'Ugyldig PIN' });
    const match = await pool.query('SELECT kickoff FROM matches WHERE id=$1', [matchId]);
    if (!match.rows.length) return res.status(404).json({ error: 'Kamp ikke fundet' });
    const lockTime = new Date(new Date(match.rows[0].kickoff).getTime() - 15*60*1000);
    if (new Date() > lockTime) return res.status(403).json({ error: 'Gæt er låst!' });
    await pool.query(`
      INSERT INTO match_predictions (participant_id,match_id,prediction,first_scorer_team,first_scorer_player,match_mvp_team,match_mvp_player,exact_home,exact_away)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      ON CONFLICT (participant_id,match_id) DO UPDATE SET
        prediction=EXCLUDED.prediction,first_scorer_team=EXCLUDED.first_scorer_team,
        first_scorer_player=EXCLUDED.first_scorer_player,match_mvp_team=EXCLUDED.match_mvp_team,
        match_mvp_player=EXCLUDED.match_mvp_player,exact_home=EXCLUDED.exact_home,exact_away=EXCLUDED.exact_away
    `, [id,matchId,prediction,first_scorer_team||null,first_scorer_player||null,match_mvp_team||null,match_mvp_player||null,exact_home??null,exact_away??null]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: 'Serverfejl' }); }
});

router.get('/:id/profile', async (req, res) => {
  try {
    const part = await pool.query('SELECT id, name, created_at FROM participants WHERE id=$1', [req.params.id]);
    if (!part.rows.length) return res.status(404).json({ error: 'Ikke fundet' });
    const [tp, mp, dt] = await Promise.all([
      pool.query('SELECT * FROM tournament_predictions WHERE participant_id=$1', [req.params.id]),
      pool.query('SELECT * FROM match_predictions WHERE participant_id=$1', [req.params.id]),
      pool.query('SELECT * FROM dream_team_predictions WHERE participant_id=$1', [req.params.id]),
    ]);
    res.json({ participant: part.rows[0], tournament: tp.rows[0]||null, matches: mp.rows, dreamTeam: dt.rows[0]||null });
  } catch (err) { res.status(500).json({ error: 'Serverfejl' }); }
});

router.get('/:id/streak', async (req, res) => {
  try {
    const preds = await pool.query(`
      SELECT mp.*, m.home_score, m.away_score, m.status, m.kickoff, m.home_team, m.away_team, m.match_mvp_player,
             COALESCE(json_agg(me ORDER BY me.minute) FILTER (WHERE me.id IS NOT NULL), '[]') as events
      FROM match_predictions mp JOIN matches m ON m.id=mp.match_id
      LEFT JOIN match_events me ON me.match_id=m.id
      WHERE mp.participant_id=$1 AND m.status='finished'
      GROUP BY mp.id, m.id ORDER BY m.kickoff DESC
    `, [req.params.id]);
    let streak=0;
    for (const pred of preds.rows) {
      const actual=pred.home_score>pred.away_score?'1':pred.away_score>pred.home_score?'2':'X';
      const evs=pred.events||[];
      const firstGoal=evs.find(e=>e.event_type==='goal'||e.event_type==='own_goal');
      let pts=0;
      if(pred.prediction===actual) pts+=3;
      const eh=pred.exact_home!==null?parseInt(pred.exact_home):(pred.exact_away!==null?0:null);
      const ea=pred.exact_away!==null?parseInt(pred.exact_away):(pred.exact_home!==null?0:null);
      if(eh!==null&&ea!==null&&eh===pred.home_score&&ea===pred.away_score) pts+=3;
      if(pred.first_scorer_team==='ingen'&&!firstGoal) pts+=3;
      else if(pred.first_scorer_player&&firstGoal&&firstGoal.player?.toLowerCase()===pred.first_scorer_player?.toLowerCase()) pts+=3;
      if(pred.match_mvp_player&&pred.match_mvp_player?.toLowerCase()===pred.match_mvp_player?.toLowerCase()) pts+=3;
      if(pts>0) streak++; else break;
    }
    res.json({ streak });
  } catch(err) { res.status(500).json({error:'Serverfejl'}); }
});

router.get('/:id/personal-stats', async (req, res) => {
  try {
    const preds = await pool.query(`
      SELECT mp.*, m.home_score, m.away_score, m.status, m.home_team, m.away_team, m.match_mvp_player, m.kickoff,
             COALESCE(json_agg(me ORDER BY me.minute) FILTER (WHERE me.id IS NOT NULL), '[]') as events
      FROM match_predictions mp JOIN matches m ON m.id=mp.match_id
      LEFT JOIN match_events me ON me.match_id=m.id
      WHERE mp.participant_id=$1 AND m.status='finished'
      GROUP BY mp.id, m.id ORDER BY m.kickoff DESC
    `, [req.params.id]);
    let resultHits=0,exactHits=0,scorerHits=0,mvpHits=0,totalPts=0,bestMatch={pts:0};
    for (const pred of preds.rows) {
      const actual=pred.home_score>pred.away_score?'1':pred.away_score>pred.home_score?'2':'X';
      const evs=pred.events||[];
      const firstGoal=evs.find(e=>e.event_type==='goal'||e.event_type==='own_goal');
      let pts=0;
      if(pred.prediction===actual){resultHits++;pts+=3;}
      const eh=pred.exact_home!==null?parseInt(pred.exact_home):(pred.exact_away!==null?0:null);
      const ea=pred.exact_away!==null?parseInt(pred.exact_away):(pred.exact_home!==null?0:null);
      if(eh!==null&&ea!==null&&eh===pred.home_score&&ea===pred.away_score){exactHits++;pts+=3;}
      if(pred.first_scorer_player&&firstGoal&&firstGoal.player?.toLowerCase()===pred.first_scorer_player?.toLowerCase()){scorerHits++;pts+=3;}
      if(pred.match_mvp_player&&pred.match_mvp_player?.toLowerCase()===pred.match_mvp_player?.toLowerCase()){mvpHits++;pts+=3;}
      totalPts+=pts;
      if(pts>bestMatch.pts) bestMatch={pts,home:pred.home_team,away:pred.away_team,score:`${pred.home_score}-${pred.away_score}`,kickoff:pred.kickoff};
    }
    res.json({
      total_matches:preds.rows.length,
      result_hits:resultHits,result_pct:preds.rows.length>0?Math.round(resultHits/preds.rows.length*100):0,
      exact_hits:exactHits,scorer_hits:scorerHits,
      scorer_pct:preds.rows.length>0?Math.round(scorerHits/preds.rows.length*100):0,
      mvp_hits:mvpHits,total_match_pts:totalPts,
      best_match:bestMatch.pts>0?bestMatch:null,
    });
  } catch(err) { res.status(500).json({error:'Serverfejl'}); }
});

router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM participants WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: 'Serverfejl' }); }
});

export default router;

// ── VAR SPECIAL PREDICTIONS ───────────────────────────────────────────────

// GET VAR prediction for a participant
router.get('/:id/var-prediction', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM var_predictions WHERE participant_id=$1', [req.params.id]);
    res.json(r.rows[0] || null);
  } catch(err) { res.status(500).json({ error: 'Serverfejl' }); }
});

// PUT VAR prediction
router.put('/:id/var-prediction', async (req, res) => {
  const { pin, var_penalties, var_red_cards, var_goals_disallowed } = req.body;
  try {
    const part = await pool.query('SELECT id FROM participants WHERE id=$1 AND pin=$2', [req.params.id, pin]);
    if (!part.rows.length) return res.status(401).json({ error: 'Ugyldig PIN' });
    const lockTime = new Date('2026-06-22T21:59:00Z'); // 22. juni kl. 23:59 dansk tid — alle hold har spillet 1 kamp
    if (new Date() > lockTime) return res.status(403).json({ error: 'VAR-gæt er låst!' });
    await pool.query(`
      INSERT INTO var_predictions (participant_id, var_penalties, var_red_cards, var_goals_disallowed)
      VALUES ($1,$2,$3,$4)
      ON CONFLICT (participant_id) DO UPDATE SET
        var_penalties=$2, var_red_cards=$3, var_goals_disallowed=$4, updated_at=NOW()
    `, [req.params.id, var_penalties??null, var_red_cards??null, var_goals_disallowed??null]);
    res.json({ ok: true });
  } catch(err) { res.status(500).json({ error: 'Serverfejl' }); }
});

// GET all VAR predictions (for leaderboard)
