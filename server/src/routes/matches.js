import { Router } from 'express';
import { pool } from '../db/index.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

// GET all matches
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
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Serverfejl' });
  }
});

// GET single match
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
  } catch (err) {
    res.status(500).json({ error: 'Serverfejl' });
  }
});

// Calculate score from events
function calcScoreFromEvents(events, homeTeam, awayTeam) {
  let home = 0, away = 0;
  for (const ev of events) {
    if (ev.event_type === 'goal') {
      if (ev.team === homeTeam) home++;
      else if (ev.team === awayTeam) away++;
    } else if (ev.event_type === 'own_goal') {
      // Own goal counts for the OTHER team
      if (ev.team === homeTeam) away++;
      else if (ev.team === awayTeam) home++;
    }
  }
  return { home, away };
}

// PATCH match result (admin only)
router.patch('/:id/result', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const {
    home_team, away_team,
    home_score_et, away_score_et,
    home_score_pens, away_score_pens,
    status, match_mvp_player, match_mvp_team,
    events = []
  } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Get current match to fill in team names if not provided
    const cur = await client.query('SELECT * FROM matches WHERE id=$1', [id]);
    if (!cur.rows.length) throw new Error('Kamp ikke fundet');
    const match = cur.rows[0];
    const hTeam = home_team || match.home_team;
    const aTeam = away_team || match.away_team;

    // Auto-calculate score from goal events
    const { home: homeScore, away: awayScore } = calcScoreFromEvents(events, hTeam, aTeam);

    // Determine winner (regular time, or ET/pens if provided)
    let winner = null;
    const finalStatus = status || 'finished';
    if (finalStatus === 'finished') {
      if (home_score_pens !== undefined && home_score_pens !== null) {
        winner = home_score_pens > away_score_pens ? hTeam : aTeam;
      } else if (home_score_et !== undefined && home_score_et !== null) {
        winner = home_score_et > away_score_et ? hTeam : aTeam;
      } else {
        if (homeScore > awayScore) winner = hTeam;
        else if (awayScore > homeScore) winner = aTeam;
        // draw in group stage = no winner
      }
    }

    await client.query(`
      UPDATE matches SET
        home_team = $1, away_team = $2,
        home_score = $3, away_score = $4,
        home_score_et = $5, away_score_et = $6,
        home_score_pens = $7, away_score_pens = $8,
        winner = $9, status = $10,
        match_mvp_player = $11, match_mvp_team = $12,
        updated_at = NOW()
      WHERE id = $13
    `, [hTeam, aTeam, homeScore, awayScore,
        home_score_et ?? null, away_score_et ?? null,
        home_score_pens ?? null, away_score_pens ?? null,
        winner, finalStatus,
        match_mvp_player || null, match_mvp_team || null,
        id]);

    // Replace events
    await client.query('DELETE FROM match_events WHERE match_id=$1', [id]);
    for (const ev of events) {
      if (!ev.player || !ev.event_type) continue;
      await client.query(`
        INSERT INTO match_events (match_id, team, player, event_type, minute, assist_player, assist_team)
        VALUES ($1,$2,$3,$4,$5,$6,$7)
      `, [id, ev.team, ev.player, ev.event_type, ev.minute || null, ev.assist_player || null, ev.assist_team || null]);
    }

    // Propagate winner to knockout bracket
    if (winner) {
      await propagateWinner(client, parseInt(id), winner, hTeam, aTeam);
    }

    await client.query('COMMIT');

    const updated = await pool.query(`
      SELECT m.*, COALESCE(json_agg(me ORDER BY me.minute ASC) FILTER (WHERE me.id IS NOT NULL), '[]') as events
      FROM matches m LEFT JOIN match_events me ON me.match_id = m.id
      WHERE m.id = $1 GROUP BY m.id
    `, [id]);
    res.json(updated.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: err.message || 'Serverfejl' });
  } finally {
    client.release();
  }
});

// GET card points leaderboard (public)
// Gul=2pt, Rød=5pt, Gul+Rød i samme kamp=5pt (kun rødt), 2 gule i samme kamp=4pt
router.get('/stats/cards', async (req, res) => {
  try {
    const events = await pool.query(`
      SELECT me.match_id, me.team, me.player, me.event_type
      FROM match_events me
      WHERE me.event_type IN ('yellow','red','yellow_red')
      ORDER BY me.match_id, me.player
    `);

    // Group by player+team, per match
    const perPlayerMatch = {}; // key: player|team|matchId
    for (const ev of events.rows) {
      const key = `${ev.player}|||${ev.team}|||${ev.match_id}`;
      if (!perPlayerMatch[key]) perPlayerMatch[key] = { player: ev.player, team: ev.team, match_id: ev.match_id, yellows: 0, reds: 0, yellow_reds: 0 };
      if (ev.event_type === 'yellow') perPlayerMatch[key].yellows++;
      if (ev.event_type === 'red') perPlayerMatch[key].reds++;
      if (ev.event_type === 'yellow_red') perPlayerMatch[key].yellow_reds++;
    }

    // Calculate points per player per match, then sum
    const playerTotals = {}; // key: player|team
    const teamTotals = {};

    for (const entry of Object.values(perPlayerMatch)) {
      // Per match: gul+rød = kun rødt (5pt), ellers: gul=2pt each, rød=5pt
      let pts = 0;
      if (entry.yellow_reds > 0) {
        // yellow_red event = gul efterfulgt af rødt = 5pt (kun rødt tæller)
        pts += entry.yellow_reds * 5;
        pts += entry.yellows * 2; // any additional yellows still count
        pts += entry.reds * 5;
      } else {
        pts += entry.yellows * 2;
        pts += entry.reds * 5;
      }

      const pk = `${entry.player}|||${entry.team}`;
      if (!playerTotals[pk]) playerTotals[pk] = { player: entry.player, team: entry.team, pts: 0 };
      playerTotals[pk].pts += pts;

      if (!teamTotals[entry.team]) teamTotals[entry.team] = { team: entry.team, pts: 0 };
      teamTotals[entry.team].pts += pts;
    }

    const players = Object.values(playerTotals).sort((a,b) => b.pts - a.pts).slice(0,20);
    const teams = Object.values(teamTotals).sort((a,b) => b.pts - a.pts);

    res.json({ players, teams });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Serverfejl' });
  }
});

async function propagateWinner(client, matchId, winner, homeTeam, awayTeam) {
  const winSlot = `W-${matchId}`;
  const loseSlot = `L-${matchId}`;
  const loser = winner === homeTeam ? awayTeam : homeTeam;

  await client.query(`UPDATE matches SET home_team=$1, updated_at=NOW() WHERE home_slot=$2 AND home_team IS NULL`, [winner, winSlot]);
  await client.query(`UPDATE matches SET away_team=$1, updated_at=NOW() WHERE away_slot=$2 AND away_team IS NULL`, [winner, winSlot]);
  if (loser) {
    await client.query(`UPDATE matches SET home_team=$1, updated_at=NOW() WHERE home_slot=$2 AND home_team IS NULL`, [loser, loseSlot]);
    await client.query(`UPDATE matches SET away_team=$1, updated_at=NOW() WHERE away_slot=$2 AND away_team IS NULL`, [loser, loseSlot]);
  }
}

export default router;
