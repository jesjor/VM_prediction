import { Router } from 'express';
import { pool } from '../db/index.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

// GET all matches (public)
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
    const { id } = req.params;
    const match = await pool.query(`
      SELECT m.*,
        COALESCE(json_agg(me ORDER BY me.minute ASC) FILTER (WHERE me.id IS NOT NULL), '[]') as events
      FROM matches m
      LEFT JOIN match_events me ON me.match_id = m.id
      WHERE m.id = $1
      GROUP BY m.id
    `, [id]);
    if (!match.rows.length) return res.status(404).json({ error: 'Kamp ikke fundet' });
    res.json(match.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Serverfejl' });
  }
});

// PATCH match result (admin only)
router.patch('/:id/result', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const {
    home_team, away_team,
    home_score, away_score,
    home_score_et, away_score_et,
    home_score_pens, away_score_pens,
    winner, status,
    events = []
  } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(`
      UPDATE matches SET
        home_team = COALESCE($1, home_team),
        away_team = COALESCE($2, away_team),
        home_score = $3, away_score = $4,
        home_score_et = $5, away_score_et = $6,
        home_score_pens = $7, away_score_pens = $8,
        winner = $9, status = $10, updated_at = NOW()
      WHERE id = $11
    `, [home_team, away_team, home_score, away_score,
        home_score_et, away_score_et, home_score_pens, away_score_pens,
        winner, status || 'finished', id]);

    // Replace events for this match
    if (events.length > 0 || status === 'finished') {
      await client.query('DELETE FROM match_events WHERE match_id=$1', [id]);
      for (const ev of events) {
        await client.query(`
          INSERT INTO match_events (match_id, team, player, event_type, minute)
          VALUES ($1,$2,$3,$4,$5)
        `, [id, ev.team, ev.player, ev.event_type, ev.minute]);
      }
    }

    // Auto-update knockout progression
    if (winner && status === 'finished') {
      await propagateWinner(client, parseInt(id), winner, home_score, away_score);
    }

    await client.query('COMMIT');

    // Return updated match
    const updated = await pool.query('SELECT * FROM matches WHERE id=$1', [id]);
    res.json(updated.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Serverfejl ved opdatering' });
  } finally {
    client.release();
  }
});

// Propagate winner to next knockout match
async function propagateWinner(client, matchId, winner, homeScore, awayScore) {
  // Find next match where this match's winner should fill a slot
  const winSlot = `W-${matchId}`;
  const loseSlot = `L-${matchId}`;
  const loser = homeScore >= awayScore ? null : null; // will be set below from match
  
  const matchRow = await client.query('SELECT home_team, away_team FROM matches WHERE id=$1', [matchId]);
  if (!matchRow.rows.length) return;
  const { home_team, away_team } = matchRow.rows[0];
  const loserTeam = winner === home_team ? away_team : home_team;

  // Winner slot → next match home or away
  await client.query(`
    UPDATE matches SET home_team = $1, updated_at = NOW()
    WHERE home_slot = $2 AND home_team IS NULL
  `, [winner, winSlot]);
  await client.query(`
    UPDATE matches SET away_team = $1, updated_at = NOW()
    WHERE away_slot = $2 AND away_team IS NULL
  `, [winner, winSlot]);

  // Loser slot (3rd place match)
  if (loserTeam) {
    await client.query(`
      UPDATE matches SET home_team = $1, updated_at = NOW()
      WHERE home_slot = $2 AND home_team IS NULL
    `, [loserTeam, loseSlot]);
    await client.query(`
      UPDATE matches SET away_team = $1, updated_at = NOW()
      WHERE away_slot = $2 AND away_team IS NULL
    `, [loserTeam, loseSlot]);
  }
}

export default router;
