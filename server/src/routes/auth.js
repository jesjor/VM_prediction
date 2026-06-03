import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { pool } from '../db/index.js';
import { signToken } from '../middleware/auth.js';

const router = Router();

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: 'Mangler brugernavn eller adgangskode' });

  try {
    const result = await pool.query('SELECT * FROM admins WHERE username=$1', [username]);
    if (result.rows.length === 0)
      return res.status(401).json({ error: 'Forkert brugernavn eller adgangskode' });

    const admin = result.rows[0];
    const ok = await bcrypt.compare(password, admin.password_hash);
    if (!ok)
      return res.status(401).json({ error: 'Forkert brugernavn eller adgangskode' });

    const token = signToken({ id: admin.id, username: admin.username });
    res.json({ token, username: admin.username });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Serverfejl' });
  }
});

export default router;
