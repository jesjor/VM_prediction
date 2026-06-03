import { Router } from 'express';
import { pool } from '../db/index.js';
import { requireAdmin } from '../middleware/auth.js';
import { calcTournamentPoints, calcMatchPoints, calcDreamTeamPoints } from '../db/points.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const parts = await pool.query('SELECT id, name, created_at FROM participants ORDER BY name ASC');
    const resultsRaw = await pool.query('SELECT result_key, team, player FROM tournament_results');
    const results = {};
    resultsRaw.rows.forEach(r => { results[r.result_key] = r.player || r.team; });

    // Build dream team results
    const dtPlayersRaw = results['dream_team_players'];
    const dtResults = {
      dream_team_players: dtPlayersRaw ? JSON.parse(dtPlayersRaw) : [],
      dream_team_best_player: results['dream_team_best_player'] || ''
    };
    // Also map other result keys for tournament calc
    const tournResults = {};
    resultsRaw.rows.forEach(r => { tournResults[r.result_key] = r.player || r.team; });

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

      return {
        ...p,
        tournament_pts: tournPts.pts,
        dream_team_pts: dreamPts.pts,
        match_pts: matchPts,
        total_pts: tournPts.pts + dreamPts.pts + matchPts,
        breakdown: [...tournPts.breakdown, ...dreamPts.breakdown, ...matchBreakdown],
      };
    }));

    data.sort((a, b) => b.total_pts - a.total_pts);
    res.json(data);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Serverfejl' }); }
});

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

router.post('/verify', async (req, res) => {
  const { name, pin } = req.body;
  try {
    const result = await pool.query('SELECT id, name FROM participants WHERE LOWER(name)=LOWER($1) AND pin=$2', [name, pin]);
    if (!result.rows.length) return res.status(401).json({ error: 'Forkert navn eller PIN' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: 'Serverfejl' }); }
});

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
    const lockTime = new Date('2026-06-11T18:45:00Z');
    if (new Date() > lockTime) return res.status(403).json({ error: 'Turneringsgæt er låst — VM er startet!' });

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
        least_goals_conceded=$50,most_goals_scored=$51,updated_at=NOW()
        WHERE participant_id=$52`, params);
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
        least_goals_conceded,most_goals_scored,participant_id
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34,$35,$36,$37,$38,$39,$40,$41,$42,$43,$44,$45,$46,$47,$48,$49,$50,$51,$52)`, params);
    }
    res.json({ ok: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Serverfejl' }); }
});

function buildParams(p, participantId) {
  return [
    p.topscorer_1_team, p.topscorer_1_player, p.topscorer_2_team, p.topscorer_2_player, p.topscorer_3_team, p.topscorer_3_player,
    p.assist_1_team, p.assist_1_player, p.assist_2_team, p.assist_2_player, p.assist_3_team, p.assist_3_player,
    p.country_1, p.country_2, p.country_3,
    p.group_winner_a, p.group_winner_b, p.group_winner_c, p.group_winner_d, p.group_winner_e, p.group_winner_f,
    p.group_winner_g, p.group_winner_h, p.group_winner_i, p.group_winner_j, p.group_winner_k, p.group_winner_l,
    p.group_runner_a, p.group_runner_b, p.group_runner_c, p.group_runner_d, p.group_runner_e, p.group_runner_f,
    p.group_runner_g, p.group_runner_h, p.group_runner_i, p.group_runner_j, p.group_runner_k, p.group_runner_l,
    p.most_yellow_team, p.most_yellow_player, p.most_red_team, p.most_red_player, p.most_yellow_team_overall, p.most_red_team_overall,
    p.most_mvp_player, p.most_mvp_team, p.tournament_player, p.tournament_player_team,
    p.least_goals_conceded, p.most_goals_scored,
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
    if (new Date() > lockTime) return res.status(403).json({ error: 'Gæt er låst — kampen starter snart!' });
    await pool.query(`
      INSERT INTO match_predictions (participant_id, match_id, prediction, first_scorer_team, first_scorer_player, match_mvp_team, match_mvp_player, exact_home, exact_away)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      ON CONFLICT (participant_id, match_id) DO UPDATE SET
        prediction=EXCLUDED.prediction, first_scorer_team=EXCLUDED.first_scorer_team,
        first_scorer_player=EXCLUDED.first_scorer_player, match_mvp_team=EXCLUDED.match_mvp_team,
        match_mvp_player=EXCLUDED.match_mvp_player, exact_home=EXCLUDED.exact_home, exact_away=EXCLUDED.exact_away
    `, [id, matchId, prediction, first_scorer_team||null, first_scorer_player||null, match_mvp_team||null, match_mvp_player||null, exact_home??null, exact_away??null]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: 'Serverfejl' }); }
});

// GET public profile for any participant (all predictions visible)
router.get('/:id/profile', async (req, res) => {
  try {
    const part = await pool.query('SELECT id, name, created_at FROM participants WHERE id=$1', [req.params.id]);
    if (!part.rows.length) return res.status(404).json({ error: 'Deltager ikke fundet' });
    const [tp, mp, dt] = await Promise.all([
      pool.query('SELECT * FROM tournament_predictions WHERE participant_id=$1', [req.params.id]),
      pool.query('SELECT * FROM match_predictions WHERE participant_id=$1', [req.params.id]),
      pool.query('SELECT * FROM dream_team_predictions WHERE participant_id=$1', [req.params.id]),
    ]);
    res.json({
      participant: part.rows[0],
      tournament: tp.rows[0] || null,
      matches: mp.rows,
      dreamTeam: dt.rows[0] || null,
    });
  } catch (err) { res.status(500).json({ error: 'Serverfejl' }); }
});

router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM participants WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: 'Serverfejl' }); }
});

export default router;
