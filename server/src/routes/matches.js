import { Router } from 'express';
import { pool } from '../db/index.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

// ── STATIC ROUTES FIRST ───────────────────────────────────────────────────

// GET all matches
router.get('/', async (req, res) => {
  try {
    const matches = await pool.query(`
      SELECT m.*, COALESCE(json_agg(me ORDER BY me.minute ASC) FILTER (WHERE me.id IS NOT NULL), '[]') as events
      FROM matches m LEFT JOIN match_events me ON me.match_id = m.id
      GROUP BY m.id ORDER BY m.kickoff ASC, m.id ASC
    `);
    res.json(matches.rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Serverfejl' }); }
});

// GET group standings
router.get('/stats/standings', async (req, res) => {
  try {
    const { getGroupStandings } = await import('../db/standings.js');
    res.json(await getGroupStandings());
  } catch(err) { console.error(err); res.status(500).json({ error: 'Serverfejl' }); }
});

// GET tournament stats (topscorer etc.)
router.get('/stats/tournament', async (req, res) => {
  try {
    const events = await pool.query(`
      SELECT me.*, m.home_team, m.away_team
      FROM match_events me JOIN matches m ON m.id=me.match_id
      WHERE m.status='finished' ORDER BY me.match_id, me.minute
    `);
    const goalMap={}, assistMap={}, yellowMap={}, redMap={}, teamGoals={}, teamConceded={};
    for (const e of events.rows) {
      const key=`${e.player}|||${e.team}`;
      if (e.event_type==='goal') {
        goalMap[key]=goalMap[key]||{player:e.player,team:e.team,count:0}; goalMap[key].count++;
        teamGoals[e.team]=(teamGoals[e.team]||0)+1;
        const opp=e.team===e.home_team?e.away_team:e.home_team;
        teamConceded[opp]=(teamConceded[opp]||0)+1;
        if (e.assist_player) {
          const ak=`${e.assist_player}|||${e.team}`;
          assistMap[ak]=assistMap[ak]||{player:e.assist_player,team:e.team,count:0}; assistMap[ak].count++;
        }
      }
      if (e.event_type==='own_goal') {
        const opp=e.team===e.home_team?e.away_team:e.home_team;
        teamGoals[opp]=(teamGoals[opp]||0)+1; teamConceded[e.team]=(teamConceded[e.team]||0)+1;
      }
      if (e.event_type==='yellow') { yellowMap[key]=yellowMap[key]||{player:e.player,team:e.team,count:0}; yellowMap[key].count++; }
      if (e.event_type==='red'||e.event_type==='yellow_red') { redMap[key]=redMap[key]||{player:e.player,team:e.team,count:0}; redMap[key].count++; }
    }
    const sort=obj=>Object.values(obj).sort((a,b)=>b.count-a.count);
    const sortTeam=obj=>Object.entries(obj).map(([team,count])=>({team,count})).sort((a,b)=>b.count-a.count);
    res.json({ topscorers:sort(goalMap).slice(0,20), assists:sort(assistMap).slice(0,20), yellow_cards:sort(yellowMap).slice(0,20), red_cards:sort(redMap).slice(0,20), team_goals:sortTeam(teamGoals).slice(0,20), team_conceded:sortTeam(teamConceded).slice(0,20) });
  } catch(err) { console.error(err); res.status(500).json({error:'Serverfejl'}); }
});

// GET card points leaderboard
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
      let pts=entry.yellow_reds>0?entry.yellow_reds*5+entry.yellows*2+entry.reds*5:entry.yellows*2+entry.reds*5;
      const pk=`${entry.player}|||${entry.team}`;
      playerTotals[pk]=playerTotals[pk]||{player:entry.player,team:entry.team,pts:0}; playerTotals[pk].pts+=pts;
      teamTotals[entry.team]=teamTotals[entry.team]||{team:entry.team,pts:0}; teamTotals[entry.team].pts+=pts;
    }
    res.json({ players:Object.values(playerTotals).sort((a,b)=>b.pts-a.pts).slice(0,20), teams:Object.values(teamTotals).sort((a,b)=>b.pts-a.pts) });
  } catch(err) { console.error(err); res.status(500).json({error:'Serverfejl'}); }
});

// GET next upcoming matches
router.get('/stats/next', async (req, res) => {
  try {
    const next = await pool.query(`
      SELECT m.*, COALESCE(json_agg(me ORDER BY me.minute) FILTER (WHERE me.id IS NOT NULL), '[]') as events
      FROM matches m LEFT JOIN match_events me ON me.match_id=m.id
      WHERE m.status != 'finished' AND m.home_team IS NOT NULL AND m.away_team IS NOT NULL
      GROUP BY m.id ORDER BY m.kickoff ASC LIMIT 3
    `);
    const results = await Promise.all(next.rows.map(async m => {
      const counts = await pool.query('SELECT prediction, COUNT(*) as count FROM match_predictions WHERE match_id=$1 GROUP BY prediction', [m.id]);
      const gc = { '1':0,'X':0,'2':0,total:0 };
      counts.rows.forEach(r => { gc[r.prediction]=parseInt(r.count); gc.total+=parseInt(r.count); });
      return { ...m, guess_counts: gc };
    }));
    res.json(results);
  } catch(err) { console.error(err); res.status(500).json({error:'Serverfejl'}); }
});

// ── DYNAMIC /:id ROUTES ───────────────────────────────────────────────────

// GET single match
router.get('/:id', async (req, res) => {
  try {
    const match = await pool.query(`
      SELECT m.*, COALESCE(json_agg(me ORDER BY me.minute ASC) FILTER (WHERE me.id IS NOT NULL), '[]') as events
      FROM matches m LEFT JOIN match_events me ON me.match_id = m.id
      WHERE m.id = $1 GROUP BY m.id
    `, [req.params.id]);
    if (!match.rows.length) return res.status(404).json({ error: 'Kamp ikke fundet' });
    res.json(match.rows[0]);
  } catch (err) { res.status(500).json({ error: 'Serverfejl' }); }
});

// PATCH match result (admin)
router.patch('/:id/result', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { home_team, away_team, home_score_et, away_score_et, home_score_pens, away_score_pens, status, match_mvp_player, match_mvp_team, events=[] } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const cur = await client.query('SELECT * FROM matches WHERE id=$1', [id]);
    if (!cur.rows.length) throw new Error('Kamp ikke fundet');
    const match = cur.rows[0];
    const hTeam = home_team||match.home_team, aTeam = away_team||match.away_team;
    let home=0, away=0;
    for (const ev of events) {
      if (ev.event_type==='goal') { if(ev.team===hTeam) home++; else if(ev.team===aTeam) away++; }
      if (ev.event_type==='own_goal') { if(ev.team===hTeam) away++; else if(ev.team===aTeam) home++; }
    }
    let winner=null;
    const finalStatus=status||'finished';
    if (finalStatus==='finished') {
      if (home_score_pens!=null) winner=parseInt(home_score_pens)>parseInt(away_score_pens)?hTeam:aTeam;
      else if (home_score_et!=null) winner=parseInt(home_score_et)>parseInt(away_score_et)?hTeam:aTeam;
      else { if(home>away) winner=hTeam; else if(away>home) winner=aTeam; }
    }
    await client.query(`UPDATE matches SET home_team=$1,away_team=$2,home_score=$3,away_score=$4,home_score_et=$5,away_score_et=$6,home_score_pens=$7,away_score_pens=$8,winner=$9,status=$10,match_mvp_player=$11,match_mvp_team=$12,updated_at=NOW() WHERE id=$13`,
      [hTeam,aTeam,home,away,home_score_et??null,away_score_et??null,home_score_pens??null,away_score_pens??null,winner,finalStatus,match_mvp_player||null,match_mvp_team||null,id]);
    await client.query('DELETE FROM match_events WHERE match_id=$1', [id]);
    for (const ev of events) {
      if (!ev.player||!ev.event_type) continue;
      const assistTeam=ev.event_type==='goal'&&ev.assist_player?ev.team:null;
      await client.query('INSERT INTO match_events (match_id,team,player,event_type,minute,assist_player,assist_team) VALUES ($1,$2,$3,$4,$5,$6,$7)',
        [id,ev.team,ev.player,ev.event_type,ev.minute||null,ev.assist_player||null,assistTeam]);
    }
    if (winner) {
      const winSlot=`W-${id}`, loseSlot=`L-${id}`, loser=winner===hTeam?aTeam:hTeam;
      await client.query('UPDATE matches SET home_team=$1,updated_at=NOW() WHERE home_slot=$2 AND home_team IS NULL',[winner,winSlot]);
      await client.query('UPDATE matches SET away_team=$1,updated_at=NOW() WHERE away_slot=$2 AND away_team IS NULL',[winner,winSlot]);
      if(loser){
        await client.query('UPDATE matches SET home_team=$1,updated_at=NOW() WHERE home_slot=$2 AND home_team IS NULL',[loser,loseSlot]);
        await client.query('UPDATE matches SET away_team=$1,updated_at=NOW() WHERE away_slot=$2 AND away_team IS NULL',[loser,loseSlot]);
      }
    }
    await client.query('COMMIT');
    try { const { calcGroupStandings } = await import('../db/standings.js'); await calcGroupStandings(); } catch(e) { console.error('Standings:', e.message); }
    const updated = await pool.query('SELECT m.*, COALESCE(json_agg(me ORDER BY me.minute ASC) FILTER (WHERE me.id IS NOT NULL), \'[]\') as events FROM matches m LEFT JOIN match_events me ON me.match_id=m.id WHERE m.id=$1 GROUP BY m.id', [id]);
    res.json(updated.rows[0]);
  } catch (err) { await client.query('ROLLBACK'); console.error(err); res.status(500).json({error:err.message||'Serverfejl'}); }
  finally { client.release(); }
});

// GET participants' predictions for a match (public after lock)
router.get('/:id/participants', async (req, res) => {
  try {
    const match = await pool.query('SELECT m.*, COALESCE(json_agg(me ORDER BY me.minute) FILTER (WHERE me.id IS NOT NULL), \'[]\') as events FROM matches m LEFT JOIN match_events me ON me.match_id=m.id WHERE m.id=$1 GROUP BY m.id', [req.params.id]);
    if (!match.rows.length) return res.status(404).json({error:'Ikke fundet'});
    const m = match.rows[0];
    const lockTime = new Date(new Date(m.kickoff).getTime()-15*60*1000);
    if (new Date()<lockTime) return res.json({locked:false,participants:[]});
    const preds = await pool.query('SELECT mp.*, p.name FROM match_predictions mp JOIN participants p ON p.id=mp.participant_id WHERE mp.match_id=$1 ORDER BY p.name', [req.params.id]);
    const evs=m.events||[], firstGoal=evs.find(e=>e.event_type==='goal'||e.event_type==='own_goal');
    const actual=m.home_score!==null?(m.home_score>m.away_score?'1':m.away_score>m.home_score?'2':'X'):null;
    const results = preds.rows.map(pred => {
      const breakdown=[]; let pts=0;
      if(actual&&pred.prediction===actual){pts+=3;breakdown.push({cat:'Kampresultat',pts:3,hit:true});}
      else if(pred.prediction) breakdown.push({cat:`Kampresultat (gættet ${pred.prediction}, blev ${actual||'?'})`,pts:0,hit:false});
      const ehNorm=pred.exact_home!==null?parseInt(pred.exact_home):(pred.exact_away!==null?0:null);
      const eaNorm=pred.exact_away!==null?parseInt(pred.exact_away):(pred.exact_home!==null?0:null);
      if(ehNorm!==null&&eaNorm!==null&&m.home_score!==null){
        if(ehNorm===m.home_score&&eaNorm===m.away_score){pts+=3;breakdown.push({cat:`Eksakt score ${m.home_score}-${m.away_score}`,pts:3,hit:true});}
        else breakdown.push({cat:`Eksakt score (gættet ${ehNorm}-${eaNorm})`,pts:0,hit:false});
      }
      if(pred.first_scorer_team==='ingen'){if(!firstGoal){pts+=3;breakdown.push({cat:'Ingen mål (0-0)',pts:3,hit:true});}else breakdown.push({cat:'Ingen mål (der var mål)',pts:0,hit:false});}
      else if(pred.first_scorer_player){
        const hit=firstGoal&&firstGoal.player?.toLowerCase()===pred.first_scorer_player?.toLowerCase()&&firstGoal.team?.toLowerCase()===pred.first_scorer_team?.toLowerCase();
        if(hit){pts+=3;breakdown.push({cat:`Første målscorer: ${pred.first_scorer_player}`,pts:3,hit:true});}
        else breakdown.push({cat:`Scorer: gættet ${pred.first_scorer_player}, var ${firstGoal?.player||'ingen'}`,pts:0,hit:false});
      }
      if(pred.match_mvp_player){
        const hit=m.match_mvp_player&&m.match_mvp_player.toLowerCase()===pred.match_mvp_player.toLowerCase();
        if(hit){pts+=3;breakdown.push({cat:`MVP: ${pred.match_mvp_player}`,pts:3,hit:true});}
        else breakdown.push({cat:`MVP: gættet ${pred.match_mvp_player}, var ${m.match_mvp_player||'ikke sat'}`,pts:0,hit:false});
      }
      return {name:pred.name,participant_id:pred.participant_id,prediction:pred.prediction,exact_home:pred.exact_home,exact_away:pred.exact_away,first_scorer_player:pred.first_scorer_player,first_scorer_team:pred.first_scorer_team,match_mvp_player:pred.match_mvp_player,pts,breakdown};
    });
    results.sort((a,b)=>b.pts-a.pts);
    res.json({locked:true,match:m,participants:results});
  } catch(err) { console.error(err); res.status(500).json({error:'Serverfejl'}); }
});

export default router;

// GET live match data from API-Football to pre-fill admin form
router.get('/:id/livefetch', requireAdmin, async (req, res) => {
  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) return res.status(503).json({ error: 'RAPIDAPI_KEY ikke sat i Railway environment variables' });

  try {
    const match = await pool.query('SELECT * FROM matches WHERE id=$1', [req.params.id]);
    if (!match.rows.length) return res.status(404).json({ error: 'Kamp ikke fundet' });
    const m = match.rows[0];

    // Format date from kickoff
    const date = new Date(m.kickoff).toISOString().split('T')[0];
    const home = m.home_team, away = m.away_team;
    if (!home || !away) return res.status(400).json({ error: 'Hold-navne mangler — sæt dem manuelt først' });

    // Search for fixture on API-Football (direct api-sports.io endpoint)
    const searchUrl = `https://v3.football.api-sports.io/fixtures?date=${date}&league=1&season=2026`;
    const searchResp = await fetch(searchUrl, {
      headers: {
        'x-apisports-key': apiKey,
      }
    });
    const searchData = await searchResp.json();

    if (!searchData.response?.length) {
      return res.status(404).json({ error: `Ingen kampe fundet på API-Football for ${date}. VM league ID=1. Prøv igen når kampen er startet.` });
    }

    // Find matching fixture by team names (fuzzy)
    const homeLow = home.toLowerCase().replace(/[^a-z]/g, '');
    const awayLow = away.toLowerCase().replace(/[^a-z]/g, '');

    let fixture = searchData.response.find(f => {
      const fHome = f.teams.home.name.toLowerCase().replace(/[^a-z]/g, '');
      const fAway = f.teams.away.name.toLowerCase().replace(/[^a-z]/g, '');
      return (fHome.includes(homeLow) || homeLow.includes(fHome)) &&
             (fAway.includes(awayLow) || awayLow.includes(fAway));
    });

    // Also try reversed (in case home/away is swapped)
    if (!fixture) {
      fixture = searchData.response.find(f => {
        const fHome = f.teams.home.name.toLowerCase().replace(/[^a-z]/g, '');
        const fAway = f.teams.away.name.toLowerCase().replace(/[^a-z]/g, '');
        return (fHome.includes(awayLow) || awayLow.includes(fHome)) &&
               (fAway.includes(homeLow) || homeLow.includes(fAway));
      });
    }

    if (!fixture) {
      const available = searchData.response.map(f => `${f.teams.home.name} vs ${f.teams.away.name}`).join(', ');
      return res.status(404).json({
        error: `Kamp ikke fundet. Tilgængelige kampe ${date}: ${available}`,
        available: searchData.response.map(f => ({ home: f.teams.home.name, away: f.teams.away.name, id: f.fixture.id }))
      });
    }

    const fixtureId = fixture.fixture.id;

    // Fetch detailed events
    const eventsUrl = `https://v3.football.api-sports.io/fixtures?id=${fixtureId}`;
    const eventsResp = await fetch(eventsUrl, {
      headers: { 'x-apisports-key': apiKey }
    });
    const eventsData = await eventsResp.json();
    const fix = eventsData.response?.[0];
    if (!fix) return res.status(404).json({ error: 'Ingen detaljer fundet' });

    const status = fix.fixture.status.short; // FT, HT, 1H, 2H, NS etc
    const homeScore = fix.goals.home ?? 0;
    const awayScore = fix.goals.away ?? 0;

    // Map events
    const events = (fix.events || []).map(e => {
      let event_type = null;
      if (e.type === 'Goal') {
        event_type = e.detail === 'Own Goal' ? 'own_goal' : 'goal';
      } else if (e.type === 'Card') {
        if (e.detail === 'Yellow Card') event_type = 'yellow';
        else if (e.detail === 'Red Card') event_type = 'red';
        else if (e.detail === 'Yellow Red Card') event_type = 'yellow_red';
      }
      if (!event_type) return null;

      const isHome = e.team.id === fix.teams.home.id;
      const ourTeam = isHome ? home : away;
      const playerName = e.player?.name || '';
      const assistName = e.assist?.name || '';

      return {
        event_type,
        minute: e.time.elapsed,
        api_team: e.team.name,
        our_team: ourTeam,
        api_player: playerName,
        api_assist: assistName || null,
        player: playerName,      // will be matched to our squad
        assist_player: assistName || null,
      };
    }).filter(Boolean);

    // Fetch squads to do name matching
    const squads = await pool.query('SELECT player, team FROM squads WHERE team IN ($1,$2)', [home, away]);
    const squadMap = {};
    squads.rows.forEach(s => {
      if (!squadMap[s.team]) squadMap[s.team] = [];
      squadMap[s.team].push(s.player);
    });

    // Try to match API player names to our squad names
    function matchPlayer(apiName, teamPlayers) {
      if (!apiName || !teamPlayers?.length) return { matched: null, confidence: 0 };
      const apiLow = apiName.toLowerCase().replace(/[^a-z ]/g, '');

      // Exact match
      const exact = teamPlayers.find(p => p.toLowerCase() === apiLow);
      if (exact) return { matched: exact, confidence: 1 };

      // Last name match
      const apiLast = apiLow.split(' ').pop();
      const lastMatch = teamPlayers.find(p => p.toLowerCase().split(' ').pop() === apiLast);
      if (lastMatch) return { matched: lastMatch, confidence: 0.8 };

      // Partial match (one name word matches)
      const apiWords = apiLow.split(' ').filter(w => w.length > 2);
      const partial = teamPlayers.find(p => {
        const pWords = p.toLowerCase().split(' ');
        return apiWords.some(w => pWords.some(pw => pw.includes(w) || w.includes(pw)));
      });
      if (partial) return { matched: partial, confidence: 0.5 };

      return { matched: null, confidence: 0 };
    }

    // Enrich events with squad matching
    const enrichedEvents = events.map(ev => {
      const teamPlayers = squadMap[ev.our_team] || [];
      const playerMatch = matchPlayer(ev.api_player, teamPlayers);
      const assistMatch = ev.api_assist ? matchPlayer(ev.api_assist, teamPlayers) : { matched: null, confidence: 0 };

      return {
        ...ev,
        player: playerMatch.matched || ev.api_player,
        player_confidence: playerMatch.confidence,
        player_unmatched: playerMatch.confidence < 0.5,
        assist_player: assistMatch.matched || ev.api_assist || null,
        assist_confidence: assistMatch.confidence,
        assist_unmatched: ev.api_assist && assistMatch.confidence < 0.5,
        team_players: teamPlayers,
      };
    });

    res.json({
      fixture_id: fixtureId,
      status,
      home_score: homeScore,
      away_score: awayScore,
      finished: ['FT','AET','PEN'].includes(status),
      api_home: fix.teams.home.name,
      api_away: fix.teams.away.name,
      events: enrichedEvents,
    });

  } catch (err) {
    console.error('livefetch error:', err);
    res.status(500).json({ error: err.message || 'Fejl ved API-opkald' });
  }
});
