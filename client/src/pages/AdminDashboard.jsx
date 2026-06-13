import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import { playerLabel, sortPlayers } from '../posLabel.js'

const ROUND_LABELS = { GROUP:'Gruppe', R32:'R32', R16:'R16', QF:'QF', SF:'SF', '3RD':'3.pl', FINAL:'FINALE' }
const ALL_TEAMS = ['Algeria','Argentina','Australia','Austria','Belgium','Bosnia & Herzegovina','Brazil','Canada','Cape Verde','Colombia','Croatia','Curaçao','Czechia','DR Congo','Ecuador','Egypt','England','France','Germany','Ghana','Haiti','Iran','Iraq','Ivory Coast','Japan','Jordan','Mexico','Morocco','Netherlands','New Zealand','Norway','Panama','Paraguay','Portugal','Qatar','Saudi Arabia','Scotland','Senegal','South Africa','South Korea','Spain','Sweden','Switzerland','Tunisia','Türkiye','Uruguay','USA','Uzbekistan']

function fmt(iso) {
  return new Date(iso).toLocaleString('da-DK',{weekday:'short',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit',timeZone:'Europe/Copenhagen'})
}

function EventRow({ ev, index, homeTeam, awayTeam, squads, onChange, onRemove }) {
  const teams = [homeTeam, awayTeam].filter(Boolean)
  const players = ev.team && squads[ev.team] ? sortPlayers(squads[ev.team]) : []
  const isGoal = ev.event_type === 'goal'
  const assistPlayers = ev.team && squads[ev.team] ? sortPlayers(squads[ev.team]) : []
  const unmatched = ev._unmatched
  const assistUnmatched = ev._assist_unmatched

  return (
    <div style={{marginBottom:6,background: unmatched ? 'rgba(245,158,11,.08)' : 'var(--bg3)',borderRadius:8,padding:'8px',border: unmatched ? '1px solid rgba(245,158,11,.3)' : '1px solid transparent'}}>
      <div style={{display:'grid',gridTemplateColumns:'55px 110px 1fr 1fr 36px',gap:4,marginBottom: isGoal ? 6 : 0}}>
        <input className="form-input" type="number" min="1" max="125" placeholder="Min" value={ev.minute||''} onChange={e=>onChange(index,'minute',e.target.value)} style={{padding:'6px 8px',fontSize:13}} />
        <select className="form-select" value={ev.event_type} onChange={e=>onChange(index,'event_type',e.target.value)} style={{padding:'6px 8px',fontSize:13}}>
          <option value="goal">⚽ Mål</option>
          <option value="own_goal">🙈 Selvmål</option>
          <option value="yellow">🟡 Gult</option>
          <option value="red">🔴 Rødt</option>
          <option value="yellow_red">🟡→🔴 Gul+Rød</option>
        </select>
        <select className="form-select" value={ev.team||''} onChange={e=>onChange(index,'team',e.target.value)} style={{padding:'6px 8px',fontSize:13}}>
          <option value="">Hold</option>
          {teams.map(t=><option key={t} value={t}>{t}</option>)}
        </select>
        <div style={{position:'relative'}}>
          {unmatched && <div style={{fontSize:10,color:'var(--gold)',marginBottom:2}}>⚠️ API: "{ev._api_player}"</div>}
          <select className="form-select" value={ev.player||''} onChange={e=>onChange(index,'player',e.target.value)} style={{padding:'6px 8px',fontSize:13,borderColor: unmatched ? 'var(--gold)' : undefined}}>
            <option value="">{unmatched ? `⚠️ Vælg spiller (API: ${ev._api_player})` : 'Spiller'}</option>
            {players.map(p=><option key={p.player} value={p.player}>{playerLabel(p)}</option>)}
          </select>
        </div>
        <button className="btn btn-sm btn-danger" onClick={()=>onRemove(index)} style={{padding:'4px 8px',minHeight:32}}>✕</button>
      </div>
      {isGoal && (
        <div style={{display:'grid',gridTemplateColumns:'auto 1fr',gap:6,alignItems:'center'}}>
          <div style={{fontSize:12,color:'var(--text3)',paddingLeft:4,whiteSpace:'nowrap'}}>🎯 Assist ({ev.team||'—'}):</div>
          <div>
            {assistUnmatched && <div style={{fontSize:10,color:'var(--gold)',marginBottom:2}}>⚠️ API: "{ev._api_assist}"</div>}
            <select className="form-select" value={ev.assist_player||''} onChange={e=>onChange(index,'assist_player',e.target.value)} style={{padding:'6px 8px',fontSize:13,width:'100%',borderColor: assistUnmatched ? 'var(--gold)' : undefined}}>
              <option value="">{assistUnmatched ? `⚠️ Vælg assist (API: ${ev._api_assist})` : 'Ingen assist'}</option>
              {assistPlayers.filter(p=>p.player!==ev.player).map(p=><option key={p.player} value={p.player}>{playerLabel(p)}</option>)}
            </select>
          </div>
        </div>
      )}
    </div>
  )
}

function calcPreviewScore(events, homeTeam, awayTeam) {
  let h=0,a=0
  for (const ev of events) {
    if (ev.event_type==='goal') { if(ev.team===homeTeam) h++; else if(ev.team===awayTeam) a++; }
    if (ev.event_type==='own_goal') { if(ev.team===homeTeam) a++; else if(ev.team===awayTeam) h++; }
  }
  return {h,a}
}

function MatchEditor({ match, squads, onSave }) {
  const [open, setOpen] = useState(false)
  const [events, setEvents] = useState(match.events||[])
  const [status, setStatus] = useState(match.status||'scheduled')
  const [homeTeam, setHomeTeam] = useState(match.home_team||'')
  const [awayTeam, setAwayTeam] = useState(match.away_team||'')
  const [etHome, setEtHome] = useState(match.home_score_et??'')
  const [etAway, setEtAway] = useState(match.away_score_et??'')
  const [pensHome, setPensHome] = useState(match.home_score_pens??'')
  const [pensAway, setPensAway] = useState(match.away_score_pens??'')
  const [mvpTeam, setMvpTeam] = useState(match.match_mvp_team||'')
  const [mvpPlayer, setMvpPlayer] = useState(match.match_mvp_player||'')
  const [msg, setMsg] = useState('')
  const [saving, setSaving] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [fetchWarnings, setFetchWarnings] = useState([])

  const home = homeTeam || match.home_team || match.home_slot || '?'
  const away = awayTeam || match.away_team || match.away_slot || '?'
  const preview = calcPreviewScore(events, home, away)
  const isKnockout = match.round !== 'GROUP'
  const mvpPlayers = mvpTeam && squads[mvpTeam] ? sortPlayers(squads[mvpTeam]) : []

  async function liveFetch() {
    if (home==='?' || away==='?') return setMsg('Sæt holdnavne først')
    setFetching(true); setMsg(''); setFetchWarnings([])
    try {
      const r = await api.get(`/matches/${match.id}/livefetch`)
      const d = r.data
      const mapped = d.events.map(ev => ({
        event_type: ev.event_type,
        minute: ev.minute,
        team: ev.our_team,
        player: ev.player,
        assist_player: ev.assist_player || null,
        _api_player: ev.api_player,
        _unmatched: ev.player_unmatched,
        _assist_unmatched: ev.assist_unmatched,
        _api_assist: ev.api_assist,
        _team_players: ev.team_players,
      }))
      setEvents(mapped)
      if (d.finished) setStatus('finished')
      else if (['1H','2H','HT'].includes(d.status)) setStatus('live')
      const warnings = mapped.filter(ev => ev._unmatched || ev._assist_unmatched)
        .map(ev => ev._unmatched
          ? `Min ${ev.minute}: "${ev._api_player}" → hold ${ev.team} — vælg korrekt spiller`
          : `Min ${ev.minute}: Assist "${ev._api_assist}" → hold ${ev.team} — vælg korrekt spiller`)
      setFetchWarnings(warnings)
      setMsg(`✅ Hentet! ${d.api_home} ${d.home_score}-${d.away_score} ${d.api_away}${warnings.length ? ` · ${warnings.length} navne kræver bekræftelse` : ''}`)
    } catch(e) {
      setMsg('❌ ' + (e.response?.data?.error || e.message || 'Fejl'))
    }
    setFetching(false)
  }

  function addEvent() {
    setEvents(e=>[...e,{team:home!=='?'?home:'',player:'',event_type:'goal',minute:''}])
  }
  function updateEvent(i, field, val) {
    setEvents(e => e.map((ev, j) => {
      if (j !== i) return ev
      const updated = { ...ev, [field]: val }
      if (field === 'team') updated.player = ''
      return updated
    }))
  }
  function removeEvent(i) { setEvents(e=>e.filter((_,j)=>j!==i)) }

  async function save() {
    setSaving(true)
    try {
      await api.patch(`/matches/${match.id}/result`, {
        home_team: home!=='?'?home:undefined,
        away_team: away!=='?'?away:undefined,
        home_score_et: etHome!==''?parseInt(etHome):undefined,
        away_score_et: etAway!==''?parseInt(etAway):undefined,
        home_score_pens: pensHome!==''?parseInt(pensHome):undefined,
        away_score_pens: pensAway!==''?parseInt(pensAway):undefined,
        match_mvp_player: mvpPlayer||null,
        match_mvp_team: mvpTeam||null,
        status, events: events.filter(e=>e.player&&e.event_type)
      })
      setMsg('✅ Gemt!'); onSave(); setFetchWarnings([])
      setTimeout(()=>{setMsg('');setOpen(false)},2000)
    } catch(e) { setMsg(e.response?.data?.error||'Fejl') }
    setSaving(false)
  }

  return (
    <div className={`match-card${match.status==='finished'?' finished':match.status==='live'?' live':''}`} style={{marginBottom:8}}>
      <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
            <span className={`badge ${match.round==='GROUP'?'badge-gray':'badge-blue'}`}>
              {match.round==='GROUP'?`Gr.${match.group_name}`:ROUND_LABELS[match.round]}
            </span>
            <span style={{fontWeight:600,fontSize:14}}>{home} vs {away}</span>
            {match.status==='finished' && <span className="badge badge-green">{match.home_score}-{match.away_score}</span>}
            {match.status==='live' && <span className="badge badge-red">LIVE</span>}
          </div>
          <div style={{fontSize:12,color:'var(--text3)',marginTop:2}}>{fmt(match.kickoff)} · {match.stadium_name}</div>
        </div>
        <button className="btn btn-sm" onClick={()=>setOpen(o=>!o)} style={{flexShrink:0}}>{open?'Luk':'Rediger'}</button>
      </div>

      {open && (
        <div style={{marginTop:12,borderTop:'1px solid var(--border)',paddingTop:12}}>
          {msg && <div className={`alert ${msg.includes('✅')?'alert-success':'alert-error'}`} style={{marginBottom:8}}>{msg}</div>}

          {/* Live fetch button */}
          {home!=='?' && away!=='?' && (
            <div style={{marginBottom:12}}>
              <button className="btn btn-primary btn-full" onClick={liveFetch} disabled={fetching} style={{marginBottom:6}}>
                {fetching ? '📡 Henter fra API-Football...' : '📡 Hent kampdata automatisk'}
              </button>
              <div style={{fontSize:11,color:'var(--text3)',textAlign:'center'}}>
                Henter mål, kort og assists — du kan rette navne efterfølgende
              </div>
            </div>
          )}

          {/* Warnings for unmatched names */}
          {fetchWarnings.length > 0 && (
            <div style={{background:'rgba(245,158,11,.1)',border:'1px solid rgba(245,158,11,.3)',borderRadius:8,padding:'8px 12px',marginBottom:10}}>
              <div style={{fontSize:12,fontWeight:700,color:'var(--gold)',marginBottom:4}}>⚠️ {fetchWarnings.length} navne matcher ikke vores truppeliste — ret dem nedenfor:</div>
              {fetchWarnings.map((w,i)=><div key={i} style={{fontSize:12,color:'var(--text2)',padding:'1px 0'}}>• {w}</div>)}
            </div>
          )}

          {/* Team names for knockout */}
          {isKnockout && (
            <div className="grid-2" style={{marginBottom:10}}>
              <div>
                <div className="form-label">Hold 1 (hjem)</div>
                <input className="form-input" value={homeTeam} onChange={e=>setHomeTeam(e.target.value)} placeholder={match.home_slot||'Hold 1'} />
              </div>
              <div>
                <div className="form-label">Hold 2 (ude)</div>
                <input className="form-input" value={awayTeam} onChange={e=>setAwayTeam(e.target.value)} placeholder={match.away_slot||'Hold 2'} />
              </div>
            </div>
          )}

          {/* Score preview */}
          <div style={{background:'var(--bg3)',borderRadius:8,padding:'8px 12px',marginBottom:10,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <span style={{fontSize:13,color:'var(--text2)'}}>Beregnet score fra begivenheder:</span>
            <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:22,fontWeight:800,color:'var(--gold)'}}>
              {preview.h} - {preview.a}
            </span>
          </div>

          {/* Status */}
          <div className="form-group">
            <div className="form-label">Kampstatus</div>
            <select className="form-select" value={status} onChange={e=>setStatus(e.target.value)}>
              <option value="scheduled">Ikke spillet endnu</option>
              <option value="live">LIVE (i gang)</option>
              <option value="finished">Færdig</option>
            </select>
          </div>

          {/* Extra time / pens (knockout) */}
          {isKnockout && (
            <div style={{marginBottom:10}}>
              <div className="form-label">Forlænget tid (hvis relevant)</div>
              <div className="grid-2" style={{gap:6,marginBottom:6}}>
                <input className="form-input" type="number" min="0" value={etHome} onChange={e=>setEtHome(e.target.value)} placeholder={`${home} — ET mål`} />
                <input className="form-input" type="number" min="0" value={etAway} onChange={e=>setEtAway(e.target.value)} placeholder={`${away} — ET mål`} />
              </div>
              <div className="form-label">Straffespark (hvis relevant)</div>
              <div className="grid-2" style={{gap:6}}>
                <input className="form-input" type="number" min="0" value={pensHome} onChange={e=>setPensHome(e.target.value)} placeholder={`${home} — straffe`} />
                <input className="form-input" type="number" min="0" value={pensAway} onChange={e=>setPensAway(e.target.value)} placeholder={`${away} — straffe`} />
              </div>
            </div>
          )}

          {/* Kampens spiller */}
          <div className="form-group">
            <div className="form-label">🌟 Kampens spiller (MVP)</div>
            <div className="grid-2" style={{gap:6}}>
              <select className="form-select" value={mvpTeam} onChange={e=>{setMvpTeam(e.target.value);setMvpPlayer('')}}>
                <option value="">— Hold —</option>
                {[home,away].filter(t=>t!=='?').map(t=><option key={t} value={t}>{t}</option>)}
              </select>
              <select className="form-select" value={mvpPlayer} onChange={e=>setMvpPlayer(e.target.value)} disabled={!mvpTeam}>
                <option value="">— Spiller —</option>
                {mvpPlayers.map(p=><option key={p.player} value={p.player}>{playerLabel(p)}</option>)}
              </select>
            </div>
          </div>

          {/* Events */}
          <div style={{marginBottom:8}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
              <div className="form-label" style={{margin:0}}>Begivenheder (mål, kort, assists)</div>
              <button className="btn btn-sm btn-primary" onClick={addEvent}>+ Tilføj</button>
            </div>
            <div style={{fontSize:11,color:'var(--text3)',marginBottom:6}}>
              Score beregnes automatisk fra mål-begivenheder. Selvmål tæller for modstanderen.
            </div>
            {events.map((ev,i) => (
              <EventRow key={i} ev={ev} index={i} homeTeam={home} awayTeam={away} squads={squads} onChange={updateEvent} onRemove={removeEvent} />
            ))}            {events.length === 0 && <div style={{fontSize:13,color:'var(--text3)',padding:'8px 0'}}>Ingen begivenheder endnu.</div>}
          </div>

          <button className="btn btn-gold btn-full" onClick={save} disabled={saving}>
            {saving?'Gemmer...':'💾 Gem kamp'}
          </button>
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

  async function add() {
    if (!team||!player) return setMsg('Vælg hold og spiller')
    try {
      await api.post('/squads',{team,player,position,number:number||null})
      setMsg('✅ Tilføjet'); setPlayer(''); setNumber(''); onUpdate()
      setTimeout(()=>setMsg(''),3000)
    } catch(e) { setMsg(e.response?.data?.error||'Fejl') }
  }
  async function remove(id) { await api.delete(`/squads/${id}`); onUpdate() }

  const teamPlayers = team && squads[team] ? squads[team] : []

  return (
    <div>
      {msg && <div className={`alert ${msg.includes('✅')?'alert-success':'alert-error'}`}>{msg}</div>}
      <div style={{display:'grid',gridTemplateColumns:'2fr 2fr 80px 60px auto',gap:6,marginBottom:8,alignItems:'end',flexWrap:'wrap'}}>
        <div><div className="form-label">Hold</div>
          <select className="form-select" value={team} onChange={e=>setTeam(e.target.value)}>
            <option value="">— Vælg —</option>
            {ALL_TEAMS.map(t=><option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div><div className="form-label">Spillernavn</div>
          <input className="form-input" value={player} onChange={e=>setPlayer(e.target.value)} placeholder="Fx Messi" />
        </div>
        <div><div className="form-label">Pos.</div>
          <select className="form-select" value={position} onChange={e=>setPosition(e.target.value)}>
            {['GK','DEF','MID','FWD'].map(p=><option key={p}>{p}</option>)}
          </select>
        </div>
        <div><div className="form-label">#</div>
          <input className="form-input" type="number" value={number} onChange={e=>setNumber(e.target.value)} placeholder="10" />
        </div>
        <div style={{paddingTop:20}}><button className="btn btn-primary" onClick={add}>+ Tilføj</button></div>
      </div>
      {team && teamPlayers.length > 0 && (
        <div>
          <div className="section-title">{team} · {teamPlayers.length} spillere</div>
          <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
            {teamPlayers.map(p=>(
              <span key={p.id} style={{display:'inline-flex',alignItems:'center',gap:4,padding:'3px 8px',background:'var(--bg3)',borderRadius:6,fontSize:13}}>
                {p.position&&<span style={{color:'var(--text3)',fontSize:11}}>{p.position}</span>}
                {p.number&&<span style={{color:'var(--text3)',fontSize:11}}>#{p.number}</span>}
                {p.player}
                <button onClick={()=>remove(p.id)} style={{background:'none',border:'none',color:'var(--text3)',cursor:'pointer',padding:'0 2px',fontSize:13}}>✕</button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function TournamentResults({ results, squads, onUpdate }) {
  const [vals, setVals] = useState({})
  const [msg, setMsg] = useState('')

  useEffect(() => {
    const obj = {}
    Object.entries(results).forEach(([k,v]) => { obj[k] = v?.player || v?.team || '' })
    setVals(obj)
  }, [results])

  async function saveField(key, val) {
    try {
      await api.put(`/squads/results/${key}`, key.endsWith('_player')||key.endsWith('_player_best') ? {player:val} : {team:val})
      setMsg(`✅ Gemt`); onUpdate()
      setTimeout(()=>setMsg(''),3000)
    } catch { setMsg('Fejl') }
  }

  const fields = [
    {key:'topscorer_1_player',label:'🏅 Topscorer 1.'},{key:'topscorer_2_player',label:'🏅 Topscorer 2.'},{key:'topscorer_3_player',label:'🏅 Topscorer 3.'},
    {key:'assist_1_player',label:'🎯 Assist 1.'},{key:'assist_2_player',label:'🎯 Assist 2.'},{key:'assist_3_player',label:'🎯 Assist 3.'},
    {key:'country_1',label:'🌍 VM vinder'},{key:'country_2',label:'🌍 2. plads'},{key:'country_3',label:'🌍 3. plads'},
    ...['a','b','c','d','e','f','g','h','i','j','k','l'].map(g=>({key:`group_winner_${g}`,label:`Gr.${g.toUpperCase()} vinder`})),
    ...['a','b','c','d','e','f','g','h','i','j','k','l'].map(g=>({key:`group_runner_${g}`,label:`Gr.${g.toUpperCase()} nr.2`})),
    {key:'most_yellow_player',label:'🟡 Flest gule (spiller)'},{key:'most_yellow_team_overall',label:'🟡 Flest gule (hold)'},
    {key:'most_red_player',label:'🔴 Flest røde (spiller)'},{key:'most_red_team_overall',label:'🔴 Flest røde (hold)'},
    {key:'most_card_pts_player',label:'🃏 Flest kortpoint (spiller)'},{key:'most_card_pts_team',label:'🃏 Flest kortpoint (hold)'},
    {key:'most_mvp_player',label:'⭐ Flest MVP'},{key:'tournament_player',label:'🌟 Turneringsspiller'},
    {key:'least_goals_conceded',label:'🛡️ Færrest mål ind'},{key:'most_goals_scored',label:'⚡ Flest mål scoret'},
  ]

  return (
    <div>
      {msg && <div className={`alert ${msg.includes('✅')?'alert-success':'alert-error'}`}>{msg}</div>}
      <div className="grid-2" style={{gap:8}}>
        {fields.map(f=>(
          <div key={f.key}>
            <div className="form-label" style={{fontSize:12}}>{f.label}</div>
            <div style={{display:'flex',gap:4}}>
              <input className="form-input" value={vals[f.key]||''} onChange={e=>setVals(v=>({...v,[f.key]:e.target.value}))} placeholder="Navn/hold" style={{fontSize:13}} />
              <button className="btn btn-sm btn-primary" onClick={()=>saveField(f.key,vals[f.key]||'')} style={{flexShrink:0,padding:'0 10px'}}>✓</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function CardStats() {
  const [data, setData] = useState(null)
  useEffect(() => { api.get('/matches/stats/cards').then(r=>setData(r.data)).catch(()=>{}) }, [])
  if (!data) return <div className="spinner">Henter...</div>
  return (
    <div>
      <div className="section-title">Spiller — kortpoint (gul=2, rød=5)</div>
      {data.players.length===0 ? <p style={{color:'var(--text2)',fontSize:14}}>Ingen kort registreret endnu.</p>
        : data.players.slice(0,15).map((p,i)=>(
          <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:'1px solid var(--border)',fontSize:14}}>
            <span>{i+1}. {p.player} <span style={{color:'var(--text3)'}}>({p.team})</span></span>
            <span style={{color:'var(--gold)',fontWeight:700,fontFamily:"'Barlow Condensed',sans-serif",fontSize:18}}>{p.pts} pt</span>
          </div>
        ))
      }
      <div className="section-title" style={{marginTop:'1rem'}}>Hold — kortpoint samlet</div>
      {data.teams.slice(0,10).map((t,i)=>(
        <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:'1px solid var(--border)',fontSize:14}}>
          <span>{i+1}. {t.team}</span>
          <span style={{color:'var(--gold)',fontWeight:700,fontFamily:"'Barlow Condensed',sans-serif",fontSize:18}}>{t.pts} pt</span>
        </div>
      ))}
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
    api.get('/matches').then(r=>setMatches(r.data)).catch(()=>{})
    api.get('/squads').then(r=>setSquads(r.data)).catch(()=>{})
    api.get('/squads/results').then(r=>setResults(r.data)).catch(()=>{})
  }

  const now = new Date()
  let display = matches
  if (matchFilter==='upcoming') display = matches.filter(m=>new Date(m.kickoff)>=now&&m.status!=='finished')
  else if (matchFilter==='finished') display = matches.filter(m=>m.status==='finished').reverse()
  else if (matchFilter==='live') display = matches.filter(m=>m.status==='live')
  else if (matchFilter==='group') display = matches.filter(m=>m.round==='GROUP')
  else if (matchFilter==='knockout') display = matches.filter(m=>m.round!=='GROUP')

  return (
    <div>
      <div style={{padding:'1.25rem 0 1rem'}}>
        <div className="page-title">⚙️ Admin</div>
        <div className="page-sub">VM 2026 · Kun for admins</div>
      </div>

      <div className="tabs">
        <button className={`tab-btn${tab==='matches'?' active':''}`} onClick={()=>setTab('matches')}>⚽ Kampe</button>
        <button className={`tab-btn${tab==='squads'?' active':''}`} onClick={()=>setTab('squads')}>👥 Trupper</button>
        <button className={`tab-btn${tab==='tournament'?' active':''}`} onClick={()=>setTab('tournament')}>🏆 Turneringsresultater</button>
        <button className={`tab-btn${tab==='cards'?' active':''}`} onClick={()=>setTab('cards')}>🃏 Kortstatistik</button>
      </div>

      {tab==='matches' && (
        <div>
          <div style={{display:'flex',gap:4,marginBottom:12,flexWrap:'wrap'}}>
            {[['upcoming','Kommende'],['live','Live'],['finished','Spillet'],['group','Gruppe'],['knockout','Knockout'],['all','Alle']].map(([v,l])=>(
              <button key={v} className={`btn btn-sm${matchFilter===v?' btn-primary':''}`} onClick={()=>setMatchFilter(v)}>{l}</button>
            ))}
          </div>
          <div className="alert alert-info" style={{fontSize:13,marginBottom:12}}>
            Tilføj begivenheder (mål, kort, assists) — scoren beregnes automatisk. Knockout-progression opdateres automatisk.
          </div>
          {display.map(m=><MatchEditor key={m.id} match={m} squads={squads} onSave={loadAll} />)}
          {display.length===0 && <div className="empty">Ingen kampe i denne visning.</div>}
        </div>
      )}

      {tab==='squads' && (
        <div>
          <div className="alert alert-info" style={{fontSize:13,marginBottom:12}}>
            Alle officielle trupper er allerede seedet. Tilføj/fjern spillere ved behov.
          </div>
          <div className="card"><SquadManager squads={squads} onUpdate={loadAll} /></div>
        </div>
      )}

      {tab==='tournament' && (
        <div>
          <div className="alert alert-info" style={{fontSize:13,marginBottom:12}}>
            Opdater løbende — point genberegnes automatisk for alle deltagere.
          </div>
          <div className="card"><TournamentResults results={results} squads={squads} onUpdate={loadAll} /></div>
        </div>
      )}

      {tab==='cards' && (
        <div>
          <div className="alert alert-info" style={{fontSize:13,marginBottom:12}}>
            Live kortstatistik baseret på registrerede begivenheder. Gul=2pt, Rød=5pt, Gul+Rød=5pt.
          </div>
          <div className="card"><CardStats /></div>
        </div>
      )}
    </div>
  )
}
