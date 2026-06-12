import { Router } from 'express';
import { pool } from '../db/index.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

// ── STATIC ROUTES FIRST ───────────────────────────────────────────────────

// GET all squads
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM squads ORDER BY team ASC, position ASC, player ASC');
    const grouped = {};
    result.rows.forEach(r => { if (!grouped[r.team]) grouped[r.team] = []; grouped[r.team].push(r); });
    res.json(grouped);
  } catch (err) { res.status(500).json({ error: 'Serverfejl' }); }
});

// GET tournament results
router.get('/results', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tournament_results ORDER BY result_key ASC');
    const obj = {};
    result.rows.forEach(r => { obj[r.result_key] = { team: r.team, player: r.player }; });
    res.json(obj);
  } catch (err) { res.status(500).json({ error: 'Serverfejl' }); }
});

// PUT tournament result (admin)
router.put('/results/:key', requireAdmin, async (req, res) => {
  const { team, player } = req.body;
  try {
    await pool.query(`
      INSERT INTO tournament_results (result_key, team, player) VALUES ($1,$2,$3)
      ON CONFLICT (result_key) DO UPDATE SET team=$2, player=$3, updated_at=NOW()
    `, [req.params.key, team||null, player||null]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: 'Serverfejl' }); }
});

// PUT dream team official result (admin)
router.put('/dream-team-result', requireAdmin, async (req, res) => {
  const { players, best_player } = req.body;
  try {
    await pool.query(`INSERT INTO tournament_results (result_key, player) VALUES ('dream_team_players', $1)
      ON CONFLICT (result_key) DO UPDATE SET player=$1, updated_at=NOW()`, [JSON.stringify(players)]);
    if (best_player) {
      await pool.query(`INSERT INTO tournament_results (result_key, player) VALUES ('dream_team_best_player', $1)
        ON CONFLICT (result_key) DO UPDATE SET player=$1, updated_at=NOW()`, [best_player]);
    }
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: 'Serverfejl' }); }
});

// GET dream team prediction for a participant
router.get('/dream-team/:participantId', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM dream_team_predictions WHERE participant_id=$1', [req.params.participantId]);
    res.json(r.rows[0] || null);
  } catch (err) { res.status(500).json({ error: 'Serverfejl' }); }
});

// PUT dream team prediction
router.put('/dream-team/:participantId', async (req, res) => {
  const { pin, players, best_player, best_player_team } = req.body;
  try {
    const part = await pool.query('SELECT id FROM participants WHERE id=$1 AND pin=$2', [req.params.participantId, pin]);
    if (!part.rows.length) return res.status(401).json({ error: 'Ugyldig PIN' });
    const lockTime = new Date('2026-06-11T18:45:00Z');
    if (new Date() > lockTime) return res.status(403).json({ error: 'VM Hold-gæt er låst!' });
    if (!Array.isArray(players) || players.length > 11) return res.status(400).json({ error: 'Maks 11 spillere' });
    await pool.query(`
      INSERT INTO dream_team_predictions (participant_id, players, best_player_team, best_player)
      VALUES ($1,$2,$3,$4)
      ON CONFLICT (participant_id) DO UPDATE SET players=$2, best_player_team=$3, best_player=$4, updated_at=NOW()
    `, [req.params.participantId, JSON.stringify(players), best_player_team||null, best_player||null]);
    res.json({ ok: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Serverfejl' }); }
});

// POST add player (admin)
router.post('/', requireAdmin, async (req, res) => {
  const { team, player, position, number } = req.body;
  if (!team || !player) return res.status(400).json({ error: 'Hold og spiller kræves' });
  try {
    const result = await pool.query(
      'INSERT INTO squads (team, player, position, number) VALUES ($1,$2,$3,$4) ON CONFLICT (team, player) DO UPDATE SET position=$3, number=$4 RETURNING *',
      [team, player, position, number]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: 'Serverfejl' }); }
});

// ── DYNAMIC /:id ROUTES ───────────────────────────────────────────────────

// DELETE player (admin)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM squads WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: 'Serverfejl' }); }
});

export default router;
