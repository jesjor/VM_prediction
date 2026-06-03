import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'

const ROUND_LABELS = { GROUP:'Gruppe', R32:'R32', R16:'R16', QF:'QF', SF:'SF', '3RD':'3.pl', FINAL:'FINALE' }

function formatTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleString('da-DK',{weekday:'short',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit',timeZone:'Europe/Copenhagen'})
}

function MatchEditor({ match, onSave }) {
  const [open, setOpen] = useState(false)
  const [homeScore, setHomeScore] = useState(match.home_score ?? '')
  const [awayScore, setAwayScore] = useState(match.away_score ?? '')
  const [status, setStatus] = useState(match.status || 'scheduled')
  const [events, setEvents] = useState(match.events || [])
  const [homeTeam, setHomeTeam] = useState(match.home_team || '')
  const [awayTeam, setAwayTeam] = useState(match.away_team || '')
  const [msg, setMsg] = useState('')

  function addEvent() {
    setEvents(e => [...e, { team: homeTeam||'', player: '', event_type: 'goal', minute: '' }])
  }
  function updateEvent(i, field, val) {
    setEvents(e => e.map((ev, j) => j === i ? {...ev, [field]: val} : ev))
  }
  function removeEvent(i) {
    setEvents(e => e.filter((_,j) => j !== i))
  }

  async function save() {
    // Determine winner
    const hs = parseInt(homeScore)
    const as = parseInt(awayScore)
    let winner = null
    if (!isNaN(hs) && !isNaN(as) && status === 'finished') {
      winner = hs > as ? (homeTeam||match.home_team) : as > hs ? (awayTeam||match.away_team) : null
    }
    try {
      await api.patch(`/matches/${match.id}/result`, {
        home_team: homeTeam || match.home_team,
        away_team: awayTeam || match.away_team,
        home_score: isNaN(hs) ? null : hs,
        away_score: isNaN(as) ? null : as,
        winner, status,
        events: events.filter(e => e.player && e.event_type)
      })
      setMsg('✅ Gemt')
      onSave()
      setTimeout(()=>setMsg(''),3000)
    } catch(e) {
      setMsg(e.response?.data?.error||'Fejl')
    }
  }

  const home = match.home_team || match.home_slot || '?'
  const away = match.away_team || match.away_slot || '?'

  return (
    <div className="match-card" style={{cursor:'default'}}>
      <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'6px'}}>
        <div style={{flex:1}}>
          <span className="badge badge-gray" style={{marginRight:'6px'}}>{match.round==='GROUP'?`Gr.${match.group_name}`:ROUND_LABELS[match.round]}</span>
          <strong>{home}</strong> vs <strong>{away}</strong>
        </div>
        {match.status==='finished' && <span className="badge badge-green">{match.home_score}-{match.away_score}</span>}
        {match.status==='live' && <span className="badge badge-red">LIVE</span>}
        <button className="btn btn-sm" onClick={()=>setOpen(o=>!o)}>{open?'Luk':'Rediger'}</button>
      </div>
      <div className="match-meta">📍 {match.stadium_name} · {formatTime(match.kickoff)}</div>

      {open && (
        <div style={{marginTop:'12px',borderTop:'1px solid var(--border)',paddingTop:'12px'}}>
          {msg && <div className={`alert ${msg.includes('✅')?'alert-success':'alert-error'}`} style={{marginBottom:'8px'}}>{msg}</div>}

          {/* Team names for knockout (override slots) */}
          {match.round !== 'GROUP' && (!match.home_team || !match.away_team) && (
            <div className="grid-2" style={{marginBottom:'8px'}}>
              <div>
                <div className="form-label">Hold 1 (hjem)</div>
                <input className="form-input" value={homeTeam} onChange={e=>setHomeTeam(e.target.value)} placeholder={match.home_slot} />
              </div>
              <div>
                <div className="form-label">Hold 2 (ude)</div>
                <input className="form-input" value={awayTeam} onChange={e=>setAwayTeam(e.target.value)} placeholder={match.away_slot} />
              </div>
            </div>
          )}

          <div className="grid-3" style={{marginBottom:'10px'}}>
            <div>
              <div className="form-label">Mål — {home}</div>
              <input className="form-input" type="number" min="0" value={homeScore} onChange={e=>setHomeScore(e.target.value)} />
            </div>
            <div>
              <div className="form-label">Mål — {away}</div>
              <input className="form-input" type="number" min="0" value={awayScore} onChange={e=>setAwayScore(e.target.value)} />
            </div>
            <div>
              <div className="form-label">Status</div>
              <select className="form-select" value={status} onChange={e=>setStatus(e.target.value)}>
                <option value="scheduled">Ikke spillet</option>
                <option value="live">LIVE</option>
                <option value="finished">Færdig</option>
              </select>
            </div>
          </div>

          <div style={{marginBottom:'8px'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'6px'}}>
              <div className="form-label" style={{margin:0}}>Begivenheder (mål, kort, assists)</div>
              <button className="btn btn-sm" onClick={addEvent}>+ Tilføj</button>
            </div>
            {events.map((ev, i) => (
              <div key={i} style={{display:'grid',gridTemplateColumns:'1fr 2fr 2fr 60px 32px',gap:'4px',marginBottom:'4px'}}>
                <input className="form-input" type="number" min="1" max="120" placeholder="Min" value={ev.minute} onChange={e=>updateEvent(i,'minute',e.target.value)} />
                <select className="form-select" value={ev.event_type} onChange={e=>updateEvent(i,'event_type',e.target.value)}>
                  <option value="goal">⚽ Mål</option>
                  <option value="own_goal">🙈 Selvmål</option>
                  <option value="assist">🎯 Assist</option>
                  <option value="yellow">🟡 Gult</option>
                  <option value="red">🔴 Rødt</option>
                  <option value="yellow_red">🟡🔴 Gult+Rødt</option>
                </select>
                <select className="form-select" value={ev.team} onChange={e=>updateEvent(i,'team',e.target.value)}>
                  <option value="">Hold</option>
                  {[homeTeam||match.home_team,awayTeam||match.away_team].filter(Boolean).map(t=><option key={t} value={t}>{t}</option>)}
                </select>
                <input className="form-input" placeholder="Spiller" value={ev.player} onChange={e=>updateEvent(i,'player',e.target.value)} />
                <button className="btn btn-sm btn-danger" onClick={()=>removeEvent(i)}>✕</button>
              </div>
            ))}
          </div>

          <button className="btn btn-primary" onClick={save}>Gem resultat</button>
        </div>
      )}
    </div>
  )
}

function SquadManager({ squads, onUpdate }) {
  const [team, setTeam] = useState('')
  const [player, setPlayer] = useState('')
  const [position, setPosition] = useState('FWD')
  const [number, setNumber] = useState('')
  const [msg, setMsg] = useState('')
  const allTeams = ['Mexico','South Africa','South Korea','Czechia','Canada','Bosnia & Herzegovina','Qatar','Switzerland','Brazil','Morocco','Haiti','Scotland','USA','Paraguay','Australia','Türkiye','Germany','Curaçao','Ivory Coast','Ecuador','Netherlands','Japan','Sweden','Tunisia','Belgium','Egypt','Iran','New Zealand','Spain','Cape Verde','Saudi Arabia','Uruguay','France','Senegal','Iraq','Norway','Argentina','Algeria','Austria','Jordan','Portugal','DR Congo','Uzbekistan','Colombia','England','Croatia','Ghana','Panama']

  async function add() {
    if (!team || !player) return setMsg('Vælg hold og spiller')
    try {
      await api.post('/squads', { team, player, position, number: number||null })
      setMsg('✅ Tilføjet'); setPlayer(''); setNumber('')
      onUpdate()
      setTimeout(()=>setMsg(''),3000)
    } catch(e) { setMsg(e.response?.data?.error||'Fejl') }
  }

  async function remove(id) {
    await api.delete(`/squads/${id}`)
    onUpdate()
  }

  const teamPlayers = team && squads[team] ? squads[team] : []

  return (
    <div>
      {msg && <div className={`alert ${msg.includes('✅')?'alert-success':'alert-error'}`}>{msg}</div>}
      <div style={{display:'grid',gridTemplateColumns:'2fr 2fr 1fr 60px auto',gap:'6px',marginBottom:'8px',alignItems:'end'}}>
        <div>
          <div className="form-label">Hold</div>
          <select className="form-select" value={team} onChange={e=>setTeam(e.target.value)}>
            <option value="">— Vælg —</option>
            {allTeams.map(t=><option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <div className="form-label">Spillernavn</div>
          <input className="form-input" value={player} onChange={e=>setPlayer(e.target.value)} placeholder="Fx Messi" />
        </div>
        <div>
          <div className="form-label">Pos.</div>
          <select className="form-select" value={position} onChange={e=>setPosition(e.target.value)}>
            {['GK','DEF','MID','FWD'].map(p=><option key={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <div className="form-label">#</div>
          <input className="form-input" type="number" value={number} onChange={e=>setNumber(e.target.value)} placeholder="10" />
        </div>
        <button className="btn btn-primary" onClick={add} style={{marginTop:'auto'}}>+ Tilføj</button>
      </div>

      {team && teamPlayers.length > 0 && (
        <div>
          <div className="section-title">{team} · {teamPlayers.length} spillere</div>
          <div style={{display:'flex',flexWrap:'wrap',gap:'4px'}}>
            {teamPlayers.map(p => (
              <span key={p.id} style={{display:'inline-flex',alignItems:'center',gap:'4px',padding:'3px 8px',background:'var(--bg3)',borderRadius:'4px',fontSize:'13px'}}>
                {p.position && <span style={{color:'var(--text3)',fontSize:'11px'}}>{p.position}</span>}
                {p.number && <span style={{color:'var(--text3)',fontSize:'11px'}}>#{p.number}</span>}
                {p.player}
                <button onClick={()=>remove(p.id)} style={{background:'none',border:'none',color:'var(--text3)',cursor:'pointer',padding:'0 2px',fontSize:'12px'}}>✕</button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function TournamentResults({ results, onUpdate }) {
  const [msg, setMsg] = useState('')
  const fields = [
    { key: 'topscorer_1_player', label: '🏅 Topscorer 1.' }, { key: 'topscorer_2_player', label: '🏅 Topscorer 2.' }, { key: 'topscorer_3_player', label: '🏅 Topscorer 3.' },
    { key: 'assist_1_player', label: '🎯 Assist 1.' }, { key: 'assist_2_player', label: '🎯 Assist 2.' }, { key: 'assist_3_player', label: '🎯 Assist 3.' },
    { key: 'country_1', label: '🌍 1. plads land' }, { key: 'country_2', label: '🌍 2. plads' }, { key: 'country_3', label: '🌍 3. plads' },
    ...['a','b','c','d','e','f','g','h','i','j','k','l'].map(g => ({ key: `group_winner_${g}`, label: `Gruppe ${g.toUpperCase()} vinder` })),
    { key: 'most_yellow_player', label: '🟡 Flest gule (spiller)' },
    { key: 'most_red_player', label: '🔴 Flest røde (spiller)' },
    { key: 'most_mvp_player', label: '⭐ Flest MVP (spiller)' },
    { key: 'tournament_player', label: '🌟 Turneringsspiller' },
    { key: 'least_goals_conceded', label: '🛡️ Færrest mål lukket ind' },
    { key: 'most_goals_scored', label: '⚡ Flest mål scoret' },
  ]
  const [vals, setVals] = useState(() => {
    const obj = {}
    fields.forEach(f => { obj[f.key] = results[f.key]?.player || results[f.key]?.team || '' })
    return obj
  })

  async function saveField(key, val) {
    try {
      await api.put(`/squads/results/${key}`, key.endsWith('_player') ? { player: val } : { team: val })
      setMsg(`✅ ${key} gemt`)
      onUpdate()
      setTimeout(()=>setMsg(''),3000)
    } catch { setMsg('Fejl') }
  }

  return (
    <div>
      {msg && <div className={`alert ${msg.includes('✅')?'alert-success':'alert-error'}`}>{msg}</div>}
      <div className="grid-2">
        {fields.map(f => (
          <div key={f.key}>
            <div className="form-label">{f.label}</div>
            <div style={{display:'flex',gap:'4px'}}>
              <input className="form-input" value={vals[f.key]} onChange={e=>setVals(v=>({...v,[f.key]:e.target.value}))} placeholder="Navn/hold" />
              <button className="btn btn-sm btn-primary" onClick={()=>saveField(f.key,vals[f.key])}>✓</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const [tab, setTab] = useState('matches')
  const [matches, setMatches] = useState([])
  const [squads, setSquads] = useState({})
  const [results, setResults] = useState({})
  const [matchFilter, setMatchFilter] = useState('upcoming')
  const navigate = useNavigate()

  useEffect(() => {
    if (!localStorage.getItem('admin_token')) { navigate('/admin/login'); return }
    loadAll()
  }, [])

  function loadAll() {
    api.get('/matches').then(r => setMatches(r.data)).catch(()=>{})
    api.get('/squads').then(r => setSquads(r.data)).catch(()=>{})
    api.get('/squads/results').then(r => setResults(r.data)).catch(()=>{})
  }

  const now = new Date()
  let displayMatches = matches
  if (matchFilter === 'upcoming') displayMatches = matches.filter(m => new Date(m.kickoff) >= now && m.status !== 'finished')
  else if (matchFilter === 'finished') displayMatches = matches.filter(m => m.status === 'finished').slice(-20).reverse()
  else if (matchFilter === 'group') displayMatches = matches.filter(m => m.round === 'GROUP')
  else if (matchFilter === 'knockout') displayMatches = matches.filter(m => m.round !== 'GROUP')

  return (
    <div>
      <div className="page-header">
        <div className="page-title">⚙️ Admin Dashboard</div>
        <div className="page-sub">VM 2026 · Kun for admins</div>
      </div>

      <div className="tabs">
        <button className={`tab-btn${tab==='matches'?' active':''}`} onClick={()=>setTab('matches')}>⚽ Kampresultater</button>
        <button className={`tab-btn${tab==='squads'?' active':''}`} onClick={()=>setTab('squads')}>👥 Trupper</button>
        <button className={`tab-btn${tab==='tournament'?' active':''}`} onClick={()=>setTab('tournament')}>🏆 Turnerings-stats</button>
      </div>

      {tab === 'matches' && (
        <div>
          <div style={{display:'flex',gap:'4px',marginBottom:'1rem',flexWrap:'wrap'}}>
            {[['upcoming','Kommende'],['finished','Spillet'],['group','Gruppe'],['knockout','Knockout'],['all','Alle']].map(([v,l]) => (
              <button key={v} className={`btn btn-sm${matchFilter===v?' btn-primary':''}`} onClick={()=>setMatchFilter(v)}>{l}</button>
            ))}
          </div>
          <div className="alert alert-info" style={{marginBottom:'1rem'}}>
            Klik "Rediger" på en kamp → indtast score + begivenheder → "Gem resultat". Knockout-progression opdateres automatisk.
          </div>
          {displayMatches.map(m => <MatchEditor key={m.id} match={m} onSave={loadAll} />)}
        </div>
      )}

      {tab === 'squads' && (
        <div>
          <div className="alert alert-info" style={{marginBottom:'1rem'}}>
            Tilføj alle spillere for hvert hold. Disse bruges i dropdown-menuerne til gæt.
          </div>
          <div className="card">
            <SquadManager squads={squads} onUpdate={loadAll} />
          </div>
        </div>
      )}

      {tab === 'tournament' && (
        <div>
          <div className="alert alert-info" style={{marginBottom:'1rem'}}>
            Opdater turneringsresultater løbende. Point beregnes automatisk.
          </div>
          <div className="card">
            <TournamentResults results={results} onUpdate={loadAll} />
          </div>
        </div>
      )}
    </div>
  )
}
