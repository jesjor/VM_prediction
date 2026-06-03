import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import { ALL_MATCHES, STADIUMS } from './matchData.js';
import { OFFICIAL_SQUADS } from './squads.js';

const { Pool } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

export async function initDb() {
  const client = await pool.connect();
  try {
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await client.query(schema);

    // Seed matches
    for (const m of ALL_MATCHES) {
      const stadium = STADIUMS[m.stadium];
      await client.query(`
        INSERT INTO matches (id, round, group_name, home_team, away_team, home_slot, away_slot, kickoff, stadium_key, stadium_name, stadium_city, stadium_capacity, label)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
        ON CONFLICT (id) DO UPDATE SET kickoff=EXCLUDED.kickoff, stadium_key=EXCLUDED.stadium_key, stadium_name=EXCLUDED.stadium_name, stadium_city=EXCLUDED.stadium_city, label=EXCLUDED.label
      `, [m.id, m.group ? 'GROUP' : m.round, m.group||null, m.home||null, m.away||null, m.homeSlot||null, m.awaySlot||null, m.kickoff, m.stadium, stadium.name, stadium.city, stadium.capacity, m.label||null]);
    }

    // Seed all 48 squads (official)
    let playerCount = 0;
    for (const [team, players] of Object.entries(OFFICIAL_SQUADS)) {
      for (const p of players) {
        await client.query(
          'INSERT INTO squads (team, player, position) VALUES ($1,$2,$3) ON CONFLICT (team, player) DO UPDATE SET position=$3',
          [team, p.player, p.position]
        );
        playerCount++;
      }
    }
    console.log(`✅ ${playerCount} spillere seedet`);

    // Default admin
    const adminUser = process.env.ADMIN_USER || 'admin';
    const adminPass = process.env.ADMIN_PASS || 'vm2026admin';
    const existing = await client.query('SELECT id FROM admins WHERE username=$1', [adminUser]);
    if (existing.rows.length === 0) {
      const hash = await bcrypt.hash(adminPass, 10);
      await client.query('INSERT INTO admins (username, password_hash) VALUES ($1,$2)', [adminUser, hash]);
      console.log(`✅ Admin oprettet: ${adminUser} / ${adminPass}`);
    }

    console.log(`✅ Database initialiseret — ${ALL_MATCHES.length} kampe seedet`);
  } finally {
    client.release();
  }
}
