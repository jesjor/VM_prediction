import { Router } from 'express';
import { pool } from '../db/index.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const matches = await pool.query(`
      SELECT m.*,
        COALESCE(json_agg(me ORDER BY me.minute ASC) FILTER (WHERE me.id IS NOT NULL), '[]') as events
      FROM matches m
      LEFT JOIN match_events me ON me.match_id = m.id
      GROUP BY m.id
      ORDER BY m.kickoff ASC, m.id ASC
    `);
    res.json(matches.rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Serverfejl' }); }
});

router.get('/:id', async (req, res) => {
  try {
    const match = await pool.query(`
      SELECT m.*,
        COALESCE(json_agg(me ORDER BY me.minute ASC) FILTER (WHERE me.id IS NOT NULL), '[]') as events
      FROM matches m
      LEFT JOIN match_events me ON me.match_id = m.id
      WHERE m.id = $1
      GROUP BY m.id
    `, [req.params.id]);
    if (!match.rows.length) return res.status(404).json({ error: 'Kamp ikke fundet' });
    res.json(match.rows[0]);
  } catch (err) { res.status(500).json({ error: 'Serverfejl' }); }
});

function calcScoreFromEvents(events, homeTeam, awayTeam) {
  let home = 0, away = 0;
  for (const ev of events) {
    if (ev.event_type === 'goal') {
      if (ev.team === homeTeam) home++; else if (ev.team === awayTeam) away++;
    } else if (ev.event_type === 'own_goal') {
      if (ev.team === homeTeam) away++; else if (ev.team === awayTeam) home++;
    }
  }
  return { home, away };
}

router.patch('/:id/result', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { home_team, away_team, home_score_et, away_score_et, home_score_pens, away_score_pens,
          status, match_mvp_player, match_mvp_team, events = [] } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const cur = await client.query('SELECT * FROM matches WHERE id=$1', [id]);
    if (!cur.rows.length) throw new Error('Kamp ikke fundet');
    const match = cur.rows[0];
    const hTeam = home_team || match.home_team;
    const aTeam = away_team || match.away_team;

    const { home: homeScore, away: awayScore } = calcScoreFromEvents(events, hTeam, aTeam);

    let winner = null;
    const finalStatus = status || 'finished';
    if (finalStatus === 'finished') {
      if (home_score_pens != null) {
        winner = parseInt(home_score_pens) > parseInt(away_score_pens) ? hTeam : aTeam;
      } else if (home_score_et != null) {
        winner = parseInt(home_score_et) > parseInt(away_score_et) ? hTeam : aTeam;
      } else {
        if (homeScore > awayScore) winner = hTeam;
        else if (awayScore > homeScore) winner = aTeam;
      }
    }

    await client.query(`
      UPDATE matches SET
        home_team=$1, away_team=$2,
        home_score=$3, away_score=$4,
        home_score_et=$5, away_score_et=$6,
        home_score_pens=$7, away_score_pens=$8,
        winner=$9, status=$10,
        match_mvp_player=$11, match_mvp_team=$12,
        updated_at=NOW()
      WHERE id=$13
    `, [hTeam, aTeam, homeScore, awayScore,
        home_score_et??null, away_score_et??null,
        home_score_pens??null, away_score_pens??null,
        winner, finalStatus, match_mvp_player||null, match_mvp_team||null, id]);

    await client.query('DELETE FROM match_events WHERE match_id=$1', [id]);
    for (const ev of events) {
      if (!ev.player || !ev.event_type) continue;
      // assist_team always = goal team (same team scores and assists)
      const assistTeam = ev.event_type === 'goal' && ev.assist_player ? ev.team : null;
      await client.query(`
        INSERT INTO match_events (match_id, team, player, event_type, minute, assist_player, assist_team)
        VALUES ($1,$2,$3,$4,$5,$6,$7)
      `, [id, ev.team, ev.player, ev.event_type, ev.minute||null,
          ev.assist_player||null, assistTeam]);
    }

    if (winner) await propagateWinner(client, parseInt(id), winner, hTeam, aTeam);
    await client.query('COMMIT');
    // Auto-update group standings and propagate knockout slots
    try { const { calcGroupStandings } = await import("../db/standings.js"); await calcGroupStandings(); } catch(e) { console.error("Standings update failed:", e.message); }

    const updated = await pool.query(`
      SELECT m.*, COALESCE(json_agg(me ORDER BY me.minute ASC) FILTER (WHERE me.id IS NOT NULL), '[]') as events
      FROM matches m LEFT JOIN match_events me ON me.match_id=m.id
      WHERE m.id=$1 GROUP BY m.id
    `, [id]);
    res.json(updated.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: err.message || 'Serverfejl' });
  } finally { client.release(); }
});

router.get('/stats/tournament', async (req, res) => {
  try {
    const events = await pool.query(`
      SELECT me.*, m.home_team, m.away_team
      FROM match_events me JOIN matches m ON m.id=me.match_id
      WHERE m.status='finished' ORDER BY me.match_id, me.minute
    `);
    const goalMap={}, assistMap={}, yellowMap={}, redMap={}, teamGoals={}, teamConceded={};
    for (const e of events.rows) {
      const key = `${e.player}|||${e.team}`;
      if (e.event_type==='goal') {
        goalMap[key] = goalMap[key]||{player:e.player,team:e.team,count:0};
        goalMap[key].count++;
        teamGoals[e.team]=(teamGoals[e.team]||0)+1;
        const opp=e.team===e.home_team?e.away_team:e.home_team;
        teamConceded[opp]=(teamConceded[opp]||0)+1;
        if (e.assist_player) {
          const ak=`${e.assist_player}|||${e.team}`;
          assistMap[ak]=assistMap[ak]||{player:e.assist_player,team:e.team,count:0};
          assistMap[ak].count++;
        }
      }
      if (e.event_type==='own_goal') {
        const opp=e.team===e.home_team?e.away_team:e.home_team;
        teamGoals[opp]=(teamGoals[opp]||0)+1;
        teamConceded[e.team]=(teamConceded[e.team]||0)+1;
      }
      if (e.event_type==='yellow') {
        yellowMap[key]=yellowMap[key]||{player:e.player,team:e.team,count:0};
        yellowMap[key].count++;
      }
      if (e.event_type==='red'||e.event_type==='yellow_red') {
        redMap[key]=redMap[key]||{player:e.player,team:e.team,count:0};
        redMap[key].count++;
      }
    }
    const sort=obj=>Object.values(obj).sort((a,b)=>b.count-a.count);
    const sortTeam=obj=>Object.entries(obj).map(([team,count])=>({team,count})).sort((a,b)=>b.count-a.count);
    res.json({
      topscorers: sort(goalMap).slice(0,20),
      assists: sort(assistMap).slice(0,20),
      yellow_cards: sort(yellowMap).slice(0,20),
      red_cards: sort(redMap).slice(0,20),
      team_goals: sortTeam(teamGoals).slice(0,20),
      team_conceded: sortTeam(teamConceded).slice(0,20),
    });
  } catch(err) { console.error(err); res.status(500).json({error:'Serverfejl'}); }
});

router.get('/stats/cards', async (req, res) => {
  try {
    const events = await pool.query(`
      SELECT me.match_id, me.team, me.player, me.event_type
      FROM match_events me JOIN matches m ON m.id=me.match_id
      WHERE me.event_type IN ('yellow','red','yellow_red') AND m.status='finished'
    `);
    const perPlayerMatch={};
    for (const ev of events.rows) {
      const key=`${ev.player}|||${ev.team}|||${ev.match_id}`;
      if (!perPlayerMatch[key]) perPlayerMatch[key]={player:ev.player,team:ev.team,match_id:ev.match_id,yellows:0,reds:0,yellow_reds:0};
      if (ev.event_type==='yellow') perPlayerMatch[key].yellows++;
      if (ev.event_type==='red') perPlayerMatch[key].reds++;
      if (ev.event_type==='yellow_red') perPlayerMatch[key].yellow_reds++;
    }
    const playerTotals={}, teamTotals={};
    for (const entry of Object.values(perPlayerMatch)) {
      let pts=0;
      if (entry.yellow_reds>0) { pts+=entry.yellow_reds*5; pts+=entry.yellows*2; pts+=entry.reds*5; }
      else { pts+=entry.yellows*2; pts+=entry.reds*5; }
      const pk=`${entry.player}|||${entry.team}`;
      playerTotals[pk]=playerTotals[pk]||{player:entry.player,team:entry.team,pts:0};
      playerTotals[pk].pts+=pts;
      teamTotals[entry.team]=teamTotals[entry.team]||{team:entry.team,pts:0};
      teamTotals[entry.team].pts+=pts;
    }
    res.json({
      players: Object.values(playerTotals).sort((a,b)=>b.pts-a.pts).slice(0,20),
      teams: Object.values(teamTotals).sort((a,b)=>b.pts-a.pts),
    });
  } catch(err) { console.error(err); res.status(500).json({error:'Serverfejl'}); }
});

async function propagateWinner(client, matchId, winner, homeTeam, awayTeam) {
  const winSlot=`W-${matchId}`, loseSlot=`L-${matchId}`;
  const loser=winner===homeTeam?awayTeam:homeTeam;
  await client.query(`UPDATE matches SET home_team=$1,updated_at=NOW() WHERE home_slot=$2 AND home_team IS NULL`,[winner,winSlot]);
  await client.query(`UPDATE matches SET away_team=$1,updated_at=NOW() WHERE away_slot=$2 AND away_team IS NULL`,[winner,winSlot]);
  if (loser) {
    await client.query(`UPDATE matches SET home_team=$1,updated_at=NOW() WHERE home_slot=$2 AND home_team IS NULL`,[loser,loseSlot]);
    await client.query(`UPDATE matches SET away_team=$1,updated_at=NOW() WHERE away_slot=$2 AND away_team IS NULL`,[loser,loseSlot]);
  }
}

export default router;

// GET group standings (public)
router.get('/stats/standings', async (req, res) => {
  try {
    const { getGroupStandings } = await import('../db/standings.js');
    const standings = await getGroupStandings();
    res.json(standings);
  } catch(err) { console.error(err); res.status(500).json({ error: 'Serverfejl' }); }
});

// GET all participants' predictions + points for a specific match (public after lock)
router.get('/:id/participants', async (req, res) => {
  try {
    const match = await pool.query(`
      SELECT m.*, COALESCE(json_agg(me ORDER BY me.minute) FILTER (WHERE me.id IS NOT NULL), '[]') as events
      FROM matches m LEFT JOIN match_events me ON me.match_id=m.id
      WHERE m.id=$1 GROUP BY m.id
    `, [req.params.id]);
    if (!match.rows.length) return res.status(404).json({ error: 'Ikke fundet' });
    const m = match.rows[0];

    // Only reveal after lock time (15 min before kickoff)
    const lockTime = new Date(new Date(m.kickoff).getTime() - 15*60*1000);
    if (new Date() < lockTime) return res.json({ locked: false, participants: [] });

    const preds = await pool.query(`
      SELECT mp.*, p.name
      FROM match_predictions mp
      JOIN participants p ON p.id=mp.participant_id
      WHERE mp.match_id=$1
      ORDER BY p.name
    `, [req.params.id]);

    // Calculate points per participant
    const evs = m.events || [];
    const firstGoal = evs.find(e => e.event_type==='goal' || e.event_type==='own_goal');
    const actual = m.home_score !== null
      ? m.home_score > m.away_score ? '1' : m.away_score > m.home_score ? '2' : 'X'
      : null;

    const results = preds.rows.map(pred => {
      const breakdown = [];
      let pts = 0;

      if (actual && pred.prediction === actual) {
        pts += 3; breakdown.push({ cat: 'Kampresultat', pts: 3, hit: true });
      } else if (pred.prediction) {
        breakdown.push({ cat: `Kampresultat (gættet ${pred.prediction}, blev ${actual||'?'})`, pts: 0, hit: false });
      }

      const ehNorm = pred.exact_home !== null && pred.exact_home !== undefined ? parseInt(pred.exact_home) : (pred.exact_away !== null && pred.exact_away !== undefined ? 0 : null);
      const eaNorm = pred.exact_away !== null && pred.exact_away !== undefined ? parseInt(pred.exact_away) : (pred.exact_home !== null && pred.exact_home !== undefined ? 0 : null);
      if (ehNorm !== null && eaNorm !== null && m.home_score !== null) {
        if (ehNorm === m.home_score && eaNorm === m.away_score) {
          pts += 3; breakdown.push({ cat: `Eksakt score ${m.home_score}-${m.away_score}`, pts: 3, hit: true });
        } else {
          breakdown.push({ cat: `Eksakt score (gættet ${ehNorm}-${eaNorm}, blev ${m.home_score}-${m.away_score})`, pts: 0, hit: false });
        }
      }

      if (pred.first_scorer_team === 'ingen') {
        if (!firstGoal) { pts += 3; breakdown.push({ cat: 'Ingen mål (0-0)', pts: 3, hit: true }); }
        else breakdown.push({ cat: 'Ingen mål (der var mål)', pts: 0, hit: false });
      } else if (pred.first_scorer_player) {
        const hit = firstGoal &&
          firstGoal.player?.toLowerCase() === pred.first_scorer_player?.toLowerCase() &&
          firstGoal.team?.toLowerCase() === pred.first_scorer_team?.toLowerCase();
        if (hit) { pts += 3; breakdown.push({ cat: `Første målscorer: ${pred.first_scorer_player}`, pts: 3, hit: true }); }
        else breakdown.push({ cat: `Scorer: gættet ${pred.first_scorer_player}, var ${firstGoal?.player||'ingen'}`, pts: 0, hit: false });
      }

      if (pred.match_mvp_player) {
        const hit = m.match_mvp_player && m.match_mvp_player.toLowerCase() === pred.match_mvp_player.toLowerCase();
        if (hit) { pts += 3; breakdown.push({ cat: `MVP: ${pred.match_mvp_player}`, pts: 3, hit: true }); }
        else breakdown.push({ cat: `MVP: gættet ${pred.match_mvp_player}, var ${m.match_mvp_player||'ikke sat'}`, pts: 0, hit: false });
      }

      return { name: pred.name, participant_id: pred.participant_id, prediction: pred.prediction,
               exact_home: pred.exact_home, exact_away: pred.exact_away,
               first_scorer_player: pred.first_scorer_player, first_scorer_team: pred.first_scorer_team,
               match_mvp_player: pred.match_mvp_player, pts, breakdown };
    });

    results.sort((a,b) => b.pts - a.pts);
    res.json({ locked: true, match: m, participants: results });
  } catch(err) { console.error(err); res.status(500).json({ error: 'Serverfejl' }); }
});
