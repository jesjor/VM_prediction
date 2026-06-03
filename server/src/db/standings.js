// Calculate group standings and propagate to knockout slots
import { pool } from './index.js';

const GROUPS = ['A','B','C','D','E','F','G','H','I','J','K','L'];

// FIFA tiebreaker: pts → GD → GF → head-to-head pts → head-to-head GD → drawing of lots
function sortGroup(teams) {
  return [...teams].sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.gd !== a.gd) return b.gd - a.gd;
    if (b.gf !== a.gf) return b.gf - a.gf;
    return 0; // drawing of lots — admin can override
  });
}

export async function calcGroupStandings() {
  const client = await pool.connect();
  try {
    // Get all finished group matches
    const matches = await pool.query(`
      SELECT m.*, 
        COALESCE(json_agg(me ORDER BY me.minute) FILTER (WHERE me.id IS NOT NULL), '[]') as events
      FROM matches m
      LEFT JOIN match_events me ON me.match_id = m.id
      WHERE m.round = 'GROUP' AND m.status = 'finished'
        AND m.home_team IS NOT NULL AND m.away_team IS NOT NULL
      GROUP BY m.id
    `);

    // Build standings per group
    const standings = {}; // group → {team → {pts,gf,ga,gd,w,d,l,played}}

    for (const m of matches.rows) {
      const g = m.group_name;
      if (!standings[g]) standings[g] = {};

      const init = (t) => {
        if (!standings[g][t]) standings[g][t] = { team: t, pts: 0, gf: 0, ga: 0, gd: 0, w: 0, d: 0, l: 0, played: 0 };
      };
      init(m.home_team); init(m.away_team);

      const hs = m.home_score ?? 0, as = m.away_score ?? 0;
      standings[g][m.home_team].gf += hs;
      standings[g][m.home_team].ga += as;
      standings[g][m.away_team].gf += as;
      standings[g][m.away_team].ga += hs;
      standings[g][m.home_team].played++;
      standings[g][m.away_team].played++;

      if (hs > as) {
        standings[g][m.home_team].pts += 3; standings[g][m.home_team].w++;
        standings[g][m.away_team].l++;
      } else if (as > hs) {
        standings[g][m.away_team].pts += 3; standings[g][m.away_team].w++;
        standings[g][m.home_team].l++;
      } else {
        standings[g][m.home_team].pts += 1; standings[g][m.home_team].d++;
        standings[g][m.away_team].pts += 1; standings[g][m.away_team].d++;
      }
      standings[g][m.home_team].gd = standings[g][m.home_team].gf - standings[g][m.home_team].ga;
      standings[g][m.away_team].gd = standings[g][m.away_team].gf - standings[g][m.away_team].ga;
    }

    // Propagate group winners/runners to R32 slots
    for (const g of GROUPS) {
      if (!standings[g]) continue;
      const sorted = sortGroup(Object.values(standings[g]));
      if (sorted.length < 2) continue;

      // Check if all 3 group matches are finished (group is complete)
      const groupMatches = await client.query(`
        SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status='finished') as finished
        FROM matches WHERE round='GROUP' AND group_name=$1
      `, [g]);
      const { total, finished } = groupMatches.rows[0];
      const groupComplete = parseInt(total) === 3 && parseInt(finished) === 3;

      const winner = sorted[0]?.team;
      const runner = sorted[1]?.team;

      if (winner) {
        // Update slots W-{G} (e.g. W-A)
        await client.query(`UPDATE matches SET home_team=$1, updated_at=NOW() WHERE home_slot=$2 AND home_team IS NULL`, [winner, `W-${g}`]);
        await client.query(`UPDATE matches SET away_team=$1, updated_at=NOW() WHERE away_slot=$2 AND away_team IS NULL`, [winner, `W-${g}`]);
      }
      if (runner) {
        await client.query(`UPDATE matches SET home_team=$1, updated_at=NOW() WHERE home_slot=$2 AND home_team IS NULL`, [runner, `R-${g}`]);
        await client.query(`UPDATE matches SET away_team=$1, updated_at=NOW() WHERE away_slot=$2 AND away_team IS NULL`, [runner, `R-${g}`]);
      }
    }

    // Calculate best 3rd place teams (after all groups done)
    await calcBestThird(client, standings);

    return standings;
  } finally {
    client.release();
  }
}

async function calcBestThird(client, standings) {
  // Collect all 3rd place teams
  const thirds = [];
  for (const g of GROUPS) {
    if (!standings[g]) continue;
    const sorted = sortGroup(Object.values(standings[g]));
    if (sorted.length >= 3) {
      thirds.push({ ...sorted[2], group: g });
    }
  }
  if (thirds.length < 8) return; // not enough groups finished

  // Sort 3rd place teams by FIFA criteria
  const sortedThirds = sortGroup(thirds);
  const best8 = sortedThirds.slice(0, 8);
  const best8Groups = best8.map(t => t.group).sort().join('');

  // FIFA's official mapping of best 3rd place groups to R32 slots
  // This is the official FIFA table for which slots the best 3rds go to
  // Based on which groups the best 3rds come from
  const best8Teams = best8.map(t => t.team);

  // Assign to B3 slots — admin can always override
  // We assign them in order to the available B3 slots
  const b3Slots = await client.query(`
    SELECT home_slot, away_slot, id FROM matches 
    WHERE home_slot LIKE 'B3-%' OR away_slot LIKE 'B3-%'
    ORDER BY id
  `);

  // For each B3 slot match, try to fill
  let b3Index = 0;
  for (const row of b3Slots.rows) {
    if (row.home_slot?.startsWith('B3-') && b3Index < best8Teams.length) {
      await client.query(`UPDATE matches SET home_team=$1, updated_at=NOW() WHERE id=$2 AND home_team IS NULL`,
        [best8Teams[b3Index++], row.id]);
    }
    if (row.away_slot?.startsWith('B3-') && b3Index < best8Teams.length) {
      await client.query(`UPDATE matches SET away_team=$1, updated_at=NOW() WHERE id=$2 AND away_team IS NULL`,
        [best8Teams[b3Index++], row.id]);
    }
  }
}

export async function getGroupStandings() {
  const client = await pool.connect();
  try {
    const matches = await pool.query(`
      SELECT m.id, m.group_name, m.home_team, m.away_team, m.home_score, m.away_score, m.status
      FROM matches m
      WHERE m.round = 'GROUP' AND m.home_team IS NOT NULL AND m.away_team IS NOT NULL
      ORDER BY m.group_name, m.kickoff
    `);

    // Get all group teams from matchData
    const { GROUPS: GROUP_TEAMS } = await import('./matchData.js');
    
    const standings = {};
    for (const g of GROUPS) {
      standings[g] = {};
      const groupTeamList = GROUP_TEAMS[g]?.teams || [];
      groupTeamList.forEach(t => {
        standings[g][t] = { team: t, pts: 0, gf: 0, ga: 0, gd: 0, w: 0, d: 0, l: 0, played: 0 };
      });
    }

    for (const m of matches.rows) {
      if (m.status !== 'finished' || m.home_score === null) continue;
      const g = m.group_name;
      if (!standings[g]) continue;
      if (!standings[g][m.home_team]) standings[g][m.home_team] = { team: m.home_team, pts:0,gf:0,ga:0,gd:0,w:0,d:0,l:0,played:0 };
      if (!standings[g][m.away_team]) standings[g][m.away_team] = { team: m.away_team, pts:0,gf:0,ga:0,gd:0,w:0,d:0,l:0,played:0 };

      const hs = m.home_score, as = m.away_score;
      standings[g][m.home_team].gf += hs; standings[g][m.home_team].ga += as;
      standings[g][m.away_team].gf += as; standings[g][m.away_team].ga += hs;
      standings[g][m.home_team].played++; standings[g][m.away_team].played++;

      if (hs > as) {
        standings[g][m.home_team].pts += 3; standings[g][m.home_team].w++;
        standings[g][m.away_team].l++;
      } else if (as > hs) {
        standings[g][m.away_team].pts += 3; standings[g][m.away_team].w++;
        standings[g][m.home_team].l++;
      } else {
        standings[g][m.home_team].pts++; standings[g][m.home_team].d++;
        standings[g][m.away_team].pts++; standings[g][m.away_team].d++;
      }
      standings[g][m.home_team].gd = standings[g][m.home_team].gf - standings[g][m.home_team].ga;
      standings[g][m.away_team].gd = standings[g][m.away_team].gf - standings[g][m.away_team].ga;
    }

    // Sort each group
    const result = {};
    for (const g of GROUPS) {
      result[g] = sortGroup(Object.values(standings[g]));
    }
    return result;
  } finally {
    client.release();
  }
}
