import { useEffect, useState, useCallback } from 'react'
import api from '../api'
import MyMatches from './MyMatches.jsx'
import { playerLabel, sortPlayers } from '../posLabel.js'

const GROUPS = ['A','B','C','D','E','F','G','H','I','J','K','L']
const ALL_TEAMS = ['Algeria','Argentina','Australia','Austria','Belgium','Bosnia & Herzegovina','Brazil','Canada','Cape Verde','Colombia','Croatia','Curaçao','Czechia','DR Congo','Ecuador','Egypt','England','France','Germany','Ghana','Haiti','Iran','Iraq','Ivory Coast','Japan','Jordan','Mexico','Morocco','Netherlands','New Zealand','Norway','Panama','Paraguay','Portugal','Qatar','Saudi Arabia','Scotland','Senegal','South Africa','South Korea','Spain','Sweden','Switzerland','Tunisia','Türkiye','Uruguay','USA','Uzbekistan']
const GROUP_TEAMS = {A:['Mexico','South Africa','South Korea','Czechia'],B:['Canada','Bosnia & Herzegovina','Qatar','Switzerland'],C:['Brazil','Morocco','Haiti','Scotland'],D:['USA','Paraguay','Australia','Türkiye'],E:['Germany','Curaçao','Ivory Coast','Ecuador'],F:['Netherlands','Japan','Sweden','Tunisia'],G:['Belgium','Egypt','Iran','New Zealand'],H:['Spain','Cape Verde','Saudi Arabia','Uruguay'],I:['France','Senegal','Iraq','Norway'],J:['Argentina','Algeria','Austria','Jordan'],K:['Portugal','DR Congo','Uzbekistan','Colombia'],L:['England','Croatia','Ghana','Panama']}

function sel(id, val, opts, onChange, placeholder='— Vælg —') {
  return (
    <select className="form-select" id={id} value={val||''} onChange={e=>onChange(e.target.value)}>
      <option value="">{placeholder}</option>
      {opts.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  )
}

function TeamPlayerPicker({ label, teamKey, playerKey, data, onChange, squads, pts, note }) {
  const team = data[teamKey] || ''
  const players = team && squads[team] ? sortPlayers(squads[team]) : []
  return (
    <div className="form-group">
      <div className="form-label">{label}{pts && <span style={{color:'var(--gold)',marginLeft:4}}>· {pts}</span>}</div>
      {note && <div style={{fontSize:12,color:'var(--text3)',marginBottom:4}}>{note}</div>}
      <div className="grid-2" style={{gap:6}}>
        {sel('t-'+teamKey, team, ALL_TEAMS, v => onChange({...data,[teamKey]:v,[playerKey]:''}), '— Hold —')}
        <select className="form-select" value={data[playerKey]||''} onChange={e=>onChange({...data,[playerKey]:e.target.value})} disabled={!team}>
          <option value="">— Vælg spiller —</option>
          {players.map(p => <option key={p.player} value={p.player}>{playerLabel(p)}</option>)}
        </select>
      </div>
    </div>
  )
}

function Top3PlayerPicker({ label, prefix, data, onChange, squads, ptsArr=[20,15,10] }) {
  return (
    <div style={{marginBottom:'1rem'}}>
      <div className="section-title">{label}</div>
      <div className="alert alert-warn" style={{fontSize:13,padding:'7px 10px',marginBottom:8}}>
        💡 Samme spiller må vælges på alle 3 pladser — high risk, high reward!
      </div>
      {[1,2,3].map(i => {
        const tk = `${prefix}_${i}_team`, pk = `${prefix}_${i}_player`
        const team = data[tk]||''
        const players = team && squads[team] ? sortPlayers(squads[team]) : []
        return (
          <div key={i} style={{marginBottom:8}}>
            <div className="form-label">{i}. plads <span style={{color:i===1?'var(--gold)':i===2?'var(--text2)':'var(--text3)'}}>{ptsArr[i-1]} pt</span></div>
            <div className="grid-2" style={{gap:6}}>
              {sel(`t-${prefix}-${i}`, team, ALL_TEAMS, v => onChange({...data,[tk]:v,[pk]:''}), '— Hold —')}
              <select className="form-select" value={data[pk]||''} onChange={e=>onChange({...data,[pk]:e.target.value})} disabled={!team}>
                <option value="">— Vælg spiller —</option>
                {players.map(p => <option key={p.player} value={p.player}>{playerLabel(p)}</option>)}
              </select>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function GroupPickers({ data, onChange }) {
  return (
    <>
      <div className="section-title">🏆 Gruppevinder — 5 pt</div>
      <div className="grid-3">
        {GROUPS.map(g => (
          <div key={g}>
            <div className="form-label">Gruppe {g}</div>
            {sel(`gw-${g}`, data[`group_winner_${g.toLowerCase()}`]||'', GROUP_TEAMS[g]||[], v => onChange({...data,[`group_winner_${g.toLowerCase()}`]:v}), '—')}
          </div>
        ))}
      </div>
      <div className="section-title" style={{marginTop:'1rem'}}>🥈 Nr. 2 i gruppe — 3 pt</div>
      <div className="grid-3">
        {GROUPS.map(g => (
          <div key={g}>
            <div className="form-label">Gruppe {g}</div>
            {sel(`gr-${g}`, data[`group_runner_${g.toLowerCase()}`]||'', GROUP_TEAMS[g]||[], v => onChange({...data,[`group_runner_${g.toLowerCase()}`]:v}), '—')}
          </div>
        ))}
      </div>
    </>
  )
}

function MatchPredictCard({ match, participantId, pin, existing, squads }) {
  const [pred, setPred] = useState(existing?.prediction||'')
  const [exactHome, setExactHome] = useState(existing?.exact_home ?? '')
  const [exactAway, setExactAway] = useState(existing?.exact_away ?? '')

  function selectPred(v) {
    setPred(v)
    if (exactHome === '') setExactHome('0')
    if (exactAway === '') setExactAway('0')
  }
  const [scorerTeam, setScorerTeam] = useState(existing?.first_scorer_team||'')
  const [scorerPlayer, setScorerPlayer] = useState(existing?.first_scorer_player||'')
  const [mvpTeam, setMvpTeam] = useState(existing?.match_mvp_team||'')
  const [mvpPlayer, setMvpPlayer] = useState(existing?.match_mvp_player||'')
  const [msg, setMsg] = useState('')
  const [saving, setSaving] = useState(false)

  const lockTime = new Date(new Date(match.kickoff).getTime() - 15*60*1000)
  const locked = new Date() > lockTime

  const homeTeam = match.home_team || '?', awayTeam = match.away_team || '?'
  const scorerPlayers = scorerTeam && scorerTeam !== 'ingen' && squads[scorerTeam] ? sortPlayers(squads[scorerTeam]) : []
  const mvpPlayers = mvpTeam && squads[mvpTeam] ? sortPlayers(squads[mvpTeam]) : []
  const bothTeams = [homeTeam, awayTeam].filter(t => t !== '?')

  function fmt(iso) {
    return new Date(iso).toLocaleString('da-DK',{weekday:'short',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit',timeZone:'Europe/Copenhagen'})
  }

  async function save() {
    if (!pred) return setMsg('Vælg 1, X eller 2 først')
    setSaving(true)
    try {
      await api.put(`/participants/${participantId}/match-predictions/${match.id}`, {
        pin, prediction: pred,
        first_scorer_team: scorerTeam||null, first_scorer_player: scorerPlayer||null,
        match_mvp_team: mvpTeam||null, match_mvp_player: mvpPlayer||null,
        exact_home: exactHome!==''?parseInt(exactHome):null,
        exact_away: exactAway!==''?parseInt(exactAway):null,
      })
      setMsg('✅ Gemt!')
      setTimeout(()=>setMsg(''),3000)
    } catch(e) { setMsg(e.response?.data?.error||'Fejl') }
    setSaving(false)
  }

  return (
    <div className="match-card" style={{marginBottom:8}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontWeight:600,fontSize:15}}>{homeTeam} vs {awayTeam}</div>
          <div style={{fontSize:12,color:'var(--text3)',marginTop:2}}>{fmt(match.kickoff)} · {match.stadium_name}</div>
        </div>
        {locked
          ? <span className="badge badge-red">Låst</span>
          : existing?.prediction && <span className="badge badge-green">Gemt</span>
        }
      </div>

      {locked
        ? <div style={{background:'var(--bg3)',borderRadius:8,padding:'10px 12px'}}>
            <div style={{fontSize:13,fontWeight:600,color:existing?'var(--green)':'var(--text3)',marginBottom:existing?6:0}}>
              {existing ? '🔒 Gæt låst og gemt' : '🔒 Intet gæt — kampen er låst'}
            </div>
            {existing && (
              <div style={{display:'flex',gap:12,flexWrap:'wrap',fontSize:13}}>
                <span>Resultat: <strong style={{color:'var(--gold)',fontFamily:"'Barlow Condensed',sans-serif",fontSize:18}}>{existing.prediction}</strong></span>
                {existing.exact_home!==null&&existing.exact_home!==undefined && <span>Score: <strong>{existing.exact_home}-{existing.exact_away}</strong></span>}
                {existing.first_scorer_player && <span>⚽ <strong>{existing.first_scorer_player}</strong></span>}
                {existing.first_scorer_team==='ingen' && <span>⚽ <strong>Ingen mål</strong></span>}
                {existing.match_mvp_player && <span>🌟 <strong>{existing.match_mvp_player}</strong></span>}
              </div>
            )}
          </div>
        : <>
            <div className="result-picker">
              {[['1',homeTeam],['X','Uafgjort'],['2',awayTeam]].map(([v,label])=>(
                <button key={v} className={`result-btn${pred===v?' active':''}`} onClick={()=>selectPred(v)}>
                  <span className="result-label">{v}</span>
                  <span className="result-team">{label}</span>
                </button>
              ))}
            </div>

            <div className="form-group">
              <div className="form-label">🎯 Eksakt score · +3 pt bonus</div>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <input className="form-input" type="number" min="0" max="20" value={exactHome}
                  onChange={e=>setExactHome(e.target.value)}
                  placeholder="—"
                  style={{width:64,textAlign:'center',fontSize:18,fontWeight:700,border:`1.5px solid ${exactHome!==''?'var(--blue)':'var(--border2)'}`}} />
                <span style={{fontSize:18,color:'var(--text3)',fontWeight:700}}>-</span>
                <input className="form-input" type="number" min="0" max="20" value={exactAway}
                  onChange={e=>setExactAway(e.target.value)}
                  placeholder="—"
                  style={{width:64,textAlign:'center',fontSize:18,fontWeight:700,border:`1.5px solid ${exactAway!==''?'var(--blue)':'var(--border2)'}`}} />
                <span style={{fontSize:12,color:exactHome!==''&&exactAway!==''?'var(--gold)':'var(--text3)'}}>
                  {exactHome!==''&&exactAway!==''?'✓ sat':'udfyld for +3 pt'}
                </span>
              </div>
            </div>

            <div className="form-group">
              <div className="form-label">⚽ Første målscorer · +3 pt</div>
              <div className="grid-2" style={{gap:6,marginBottom:scorerTeam&&scorerTeam!=='ingen'?6:0}}>
                <select className="form-select" value={scorerTeam} onChange={e=>{setScorerTeam(e.target.value);setScorerPlayer('')}}>
                  <option value="">— Hold (valgfrit) —</option>
                  {bothTeams.map(t=><option key={t} value={t}>{t}</option>)}
                  <option value="ingen">Ingen mål (0-0)</option>
                </select>
                {scorerTeam && scorerTeam !== 'ingen' && (
                  <select className="form-select" value={scorerPlayer} onChange={e=>setScorerPlayer(e.target.value)}>
                    <option value="">— Spiller —</option>
                    {scorerPlayers.map(p=><option key={p.player} value={p.player}>{playerLabel(p)}</option>)}
                  </select>
                )}
              </div>
            </div>

            <div className="form-group">
              <div className="form-label">🌟 Kampens spiller (MVP) · +3 pt</div>
              <div className="grid-2" style={{gap:6}}>
                <select className="form-select" value={mvpTeam} onChange={e=>{setMvpTeam(e.target.value);setMvpPlayer('')}}>
                  <option value="">— Hold (valgfrit) —</option>
                  {bothTeams.map(t=><option key={t} value={t}>{t}</option>)}
                </select>
                {mvpTeam && (
                  <select className="form-select" value={mvpPlayer} onChange={e=>setMvpPlayer(e.target.value)}>
                    <option value="">— Spiller —</option>
                    {mvpPlayers.map(p=><option key={p.player} value={p.player}>{playerLabel(p)}</option>)}
                  </select>
                )}
              </div>
            </div>

            <div style={{display:'flex',gap:10,alignItems:'center'}}>
              <button className="btn btn-primary btn-sm" onClick={save} disabled={saving}>
                {saving?'Gemmer...':'Gem gæt'}
              </button>
              {msg && <span style={{fontSize:13,color:msg.includes('✅')?'var(--green)':'var(--red)'}}>{msg}</span>}
            </div>
          </>
      }
    </div>
  )
}

function DreamTeamPicker({ participantId, pin, squads }) {
  const [players, setPlayers] = useState([]) // [{team,player,position}]
  const [bestTeam, setBestTeam] = useState('')
  const [bestPlayer, setBestPlayer] = useState('')
  const [addTeam, setAddTeam] = useState('')
  const [addPlayer, setAddPlayer] = useState('')
  const [msg, setMsg] = useState('')
  const [saving, setSaving] = useState(false)
  const locked = new Date() > new Date('2026-06-11T18:45:00Z')

  useEffect(() => {
    api.get(`/squads/dream-team/${participantId}`).then(r => {
      if (r.data) { setPlayers(r.data.players||[]); setBestTeam(r.data.best_player_team||''); setBestPlayer(r.data.best_player||'') }
    }).catch(()=>{})
  }, [participantId])

  function addToTeam() {
    if (!addPlayer) return
    if (players.length >= 11) return setMsg('Maks 11 spillere')
    if (players.find(p=>p.player===addPlayer)) return setMsg('Allerede valgt')
    setPlayers(prev=>[...prev,{team:addTeam,player:addPlayer}])
    setAddPlayer(''); setMsg('')
  }

  async function save() {
    setSaving(true)
    try {
      await api.put(`/squads/dream-team/${participantId}`, { pin, players, best_player: bestPlayer, best_player_team: bestTeam })
      setMsg('✅ VM Hold gemt!')
    } catch(e) { setMsg(e.response?.data?.error||'Fejl') }
    setSaving(false)
    setTimeout(()=>setMsg(''),4000)
  }

  const addPlayers = addTeam && squads[addTeam] ? sortPlayers(squads[addTeam]) : []
  const bestPlayers = bestTeam && squads[bestTeam] ? sortPlayers(squads[bestTeam]) : []

  return (
    <div>
      {locked && <div className="alert alert-error">VM Hold-gæt er låst — VM er startet!</div>}
      <div className="alert alert-info" style={{fontSize:13}}>
        Vælg 11 spillere til det officielle VM All-Star hold. <strong>5 pt pr rigtig spiller.</strong>
      </div>

      <div className="card" style={{marginBottom:8}}>
        <div className="section-title">Dit VM Hold ({players.length}/11)</div>
        {players.length === 0
          ? <p style={{fontSize:13,color:'var(--text3)'}}>Ingen spillere valgt endnu.</p>
          : <div style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:8}}>
              {players.map((p,i) => (
                <span key={i} style={{display:'inline-flex',alignItems:'center',gap:4,padding:'4px 10px',background:'var(--bg3)',borderRadius:6,fontSize:13}}>
                  {p.player} <span style={{fontSize:11,color:'var(--text3)'}}>({p.team})</span>
                  {!locked && <button onClick={()=>setPlayers(prev=>prev.filter((_,j)=>j!==i))} style={{background:'none',border:'none',color:'var(--text3)',cursor:'pointer',padding:'0 2px',fontSize:14}}>✕</button>}
                </span>
              ))}
            </div>
        }
        {!locked && players.length < 11 && (
          <div>
            <div className="form-label">Tilføj spiller</div>
            <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
              <select className="form-select" value={addTeam} onChange={e=>{setAddTeam(e.target.value);setAddPlayer('')}} style={{flex:'1 1 140px',minWidth:120}}>
                <option value="">— Hold —</option>
                {ALL_TEAMS.map(t=><option key={t} value={t}>{t}</option>)}
              </select>
              <select className="form-select" value={addPlayer} onChange={e=>setAddPlayer(e.target.value)} disabled={!addTeam} style={{flex:'1 1 140px',minWidth:120}}>
                <option value="">— Spiller —</option>
                {addPlayers.map(p=><option key={p.player} value={p.player}>{playerLabel(p)}</option>)}
              </select>
              <button className="btn btn-primary btn-sm" onClick={addToTeam} disabled={!addPlayer} style={{flexShrink:0}}>+ Tilføj</button>
            </div>
          </div>
        )}
      </div>

      <div className="card" style={{marginBottom:8}}>
        <div className="section-title">🌟 Bedste spiller i turneringen — 20 pt</div>
        <div className="grid-2" style={{gap:6}}>
          <select className="form-select" value={bestTeam} onChange={e=>{setBestTeam(e.target.value);setBestPlayer('')}}>
            <option value="">— Hold —</option>
            {ALL_TEAMS.map(t=><option key={t} value={t}>{t}</option>)}
          </select>
          <select className="form-select" value={bestPlayer} onChange={e=>setBestPlayer(e.target.value)} disabled={!bestTeam}>
            <option value="">— Spiller —</option>
            {bestPlayers.map(p=><option key={p.player} value={p.player}>{playerLabel(p)}</option>)}
          </select>
        </div>
      </div>

      {msg && <div className={`alert ${msg.includes('✅')?'alert-success':'alert-error'}`}>{msg}</div>}
      {!locked && <button className="btn btn-gold btn-full" onClick={save} disabled={saving}>{saving?'Gemmer...':'💾 Gem VM Hold'}</button>}
    </div>
  )
}

export default function Predict() {
  const [step, setStep] = useState('login')
  const [participant, setParticipant] = useState(null)
  const [pin, setPin] = useState('')
  const [name, setName] = useState('')
  const [isNew, setIsNew] = useState(false)
  const [newPin, setNewPin] = useState('')
  const [msg, setMsg] = useState('')
  const [tab, setTab] = useState('tournament')
  const [squads, setSquads] = useState({})
  const [matches, setMatches] = useState([])
  const [matchPreds, setMatchPreds] = useState([])
  const [tournPred, setTournPred] = useState({})
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')

  const [ranking, setRanking] = useState(null)
  const [streak, setStreak] = useState(0)

  useEffect(() => {
    api.get('/squads').then(r=>setSquads(r.data)).catch(()=>{})
    api.get('/matches').then(r=>setMatches(r.data)).catch(()=>{})
    // Restore session
    const saved = localStorage.getItem('vm2026_participant')
    if (saved && step === 'login') {
      try {
        const { participant: p, pin: savedPin } = JSON.parse(saved)
        setParticipant(p); setPin(savedPin); setStep('predict')
        loadPredictions(p.id, savedPin)
      } catch {}
    }
  }, [])

  useEffect(() => {
    if (!participant) return
    api.get('/participants').then(r => {
      const sorted = r.data
      const idx = sorted.findIndex(p => p.id === participant.id)
      if (idx !== -1) {
        const me = sorted[idx], leader = sorted[0]
        setRanking({ rank: idx+1, total: sorted.length, pts: me.total_pts, gap: leader.total_pts - me.total_pts, leaderName: leader.name })
      }
    }).catch(()=>{})
    api.get(`/participants/${participant.id}/streak`).then(r => setStreak(r.data.streak)).catch(()=>{})
  }, [participant])

  async function login() {
    if (!name.trim()) return setMsg('Indtast dit navn')
    try {
      const r = await api.post('/participants/verify',{name:name.trim(),pin})
      setParticipant(r.data); setStep('predict')
      localStorage.setItem('vm2026_participant', JSON.stringify({participant:r.data, pin}))
      loadPredictions(r.data.id,pin)
    } catch { setMsg('Forkert navn eller PIN.') }
  }

  async function register() {
    if (!name.trim()||newPin.length!==4) return setMsg('Udfyld navn og 4-cifret PIN')
    try {
      const r = await api.post('/participants',{name:name.trim(),pin:newPin})
      setParticipant(r.data); setPin(newPin); setStep('predict')
      localStorage.setItem('vm2026_participant', JSON.stringify({participant:r.data, pin:newPin}))
    } catch(e) { setMsg(e.response?.data?.error||'Fejl') }
  }

  function loadPredictions(id,p) {
    api.get(`/participants/${id}/tournament-prediction`).then(r=>{ if(r.data) setTournPred(r.data) }).catch(()=>{})
    api.get(`/participants/${id}/match-predictions`).then(r=>setMatchPreds(r.data)).catch(()=>{})
  }

  async function saveTournament() {
    setSaving(true)
    try {
      await api.put(`/participants/${participant.id}/tournament-prediction`,{pin,...tournPred})
      setSaveMsg('✅ Turneringsgæt gemt!')
    } catch(e) { setSaveMsg(e.response?.data?.error||'Fejl') }
    setSaving(false)
    setTimeout(()=>setSaveMsg(''),4000)
  }

  // Show upcoming matches (all 104, lockout before kickoff)
  const upcomingMatches = matches.filter(m => {
    const lock = new Date(new Date(m.kickoff).getTime()-15*60*1000)
    return m.status!=='finished' && m.home_team && m.away_team
  }).slice(0,20)

  if (step==='login') return (
    <div>
      <div style={{padding:'1.25rem 0 1rem'}}>
        <div className="page-title">Mine gæt</div>
        <div className="page-sub">Log ind eller opret profil</div>
      </div>
      <div className="card" style={{maxWidth:420}}>
        <div className="tabs">
          <button className={`tab-btn${!isNew?' active':''}`} onClick={()=>{setIsNew(false);setMsg('')}}>Log ind</button>
          <button className={`tab-btn${isNew?' active':''}`} onClick={()=>{setIsNew(true);setMsg('')}}>Ny profil</button>
        </div>
        {msg && <div className="alert alert-error">{msg}</div>}
        <div className="form-group">
          <label className="form-label">Navn</label>
          <input className="form-input" value={name} onChange={e=>setName(e.target.value)} placeholder="Fx Jesper" onKeyDown={e=>e.key==='Enter'&&(isNew?register():login())} autoComplete="off" />
        </div>
        <div className="form-group">
          <label className="form-label">{isNew?'Vælg PIN (4 cifre)':'PIN (4 cifre)'}</label>
          <input className="form-input" type="password" inputMode="numeric" maxLength={4} value={isNew?newPin:pin} onChange={e=>isNew?setNewPin(e.target.value):setPin(e.target.value)} placeholder="••••" onKeyDown={e=>e.key==='Enter'&&(isNew?register():login())} />
        </div>
        {isNew && <div className="alert alert-warn" style={{fontSize:13}}>Husk dit PIN — det kan ikke nulstilles uden admin!</div>}
        <button className="btn btn-gold btn-full" onClick={isNew?register:login}>{isNew?'Opret profil':'Log ind'}</button>
      </div>
    </div>
  )

  const tournLocked = new Date() > new Date('2026-06-11T18:45:00Z')

  return (
    <div>
      <div style={{padding:'1.25rem 0 .75rem',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div>
          <div className="page-title" style={{fontSize:'clamp(20px,5vw,30px)'}}>Mine gæt</div>
          <div className="page-sub">{participant.name}</div>
        </div>
        <button className="btn btn-sm" onClick={()=>{setStep('login');setParticipant(null);setRanking(null)}}>Skift</button>
      </div>

      {ranking && (
        <div style={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:10,padding:'10px 14px',marginBottom:12,display:'flex',alignItems:'center',gap:12,flexWrap:'wrap'}}>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:28,fontWeight:800,color:ranking.rank===1?'var(--gold)':ranking.rank<=3?'var(--green)':'var(--text)'}}>
            #{ranking.rank}
          </div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:13,fontWeight:600}}>
              {ranking.rank===1?'🏆 Du fører — godt gættet!':`${ranking.gap} pt fra førstepladsen (${ranking.leaderName})`}
            </div>
            <div style={{fontSize:12,color:'var(--text3)'}}>{ranking.pts} pt · {ranking.rank} af {ranking.total} deltagere{streak>=2?` · 🔥 ${streak} kampe i træk`:''}</div>
          </div>
          <a href="/" style={{fontSize:13,color:'var(--blue)',textDecoration:'none',flexShrink:0}}>Se alle →</a>
        </div>
      )}

      <div className="tabs">
        <button className={`tab-btn${tab==='tournament'?' active':''}`} onClick={()=>setTab('tournament')}>🏆 Turnering</button>
        <button className={`tab-btn${tab==='matches'?' active':''}`} onClick={()=>setTab('matches')}>⚽ Afgiv gæt</button>
        <button className={`tab-btn${tab==='mykampe'?' active':''}`} onClick={()=>setTab('mykampe')}>📊 Mine kampe</button>
        <button className={`tab-btn${tab==='dreamteam'?' active':''}`} onClick={()=>setTab('dreamteam')}>🌟 VM Hold</button>
      </div>

      {tab==='tournament' && (
        <div>
          {tournLocked && <div className="alert alert-error">Turneringsgæt er låst — VM er startet!</div>}
          {saveMsg && <div className={`alert ${saveMsg.includes('✅')?'alert-success':'alert-error'}`}>{saveMsg}</div>}

          <div className="card">
            <Top3PlayerPicker label="🏅 Top 3 Topscorer" prefix="topscorer" data={tournPred} onChange={setTournPred} squads={squads} />
            <Top3PlayerPicker label="🎯 Top 3 Assists" prefix="assist" data={tournPred} onChange={setTournPred} squads={squads} />

            <div className="section-title">🌍 Slutstilling (VM vinder/2./3.)</div>
            <div className="alert alert-warn" style={{fontSize:13,padding:'7px 10px',marginBottom:8}}>
              💡 Top X logik: gætter du Top 2, og holdet vinder VM, giver det 15 pt. Samme hold må vælges alle 3 steder.
            </div>
            {[['country_1','🥇 Vinder af VM','20 pt'],['country_2','🥈 2. plads','15 pt'],['country_3','🥉 3. plads','10 pt']].map(([key,label,pts])=>(
              <div key={key} className="form-group">
                <div className="form-label">{label} <span style={{color:'var(--gold)'}}>{pts}</span></div>
                {sel(`c-${key}`, tournPred[key]||'', ALL_TEAMS, v=>setTournPred(d=>({...d,[key]:v})), '— Vælg land —')}
              </div>
            ))}
          </div>

          <div className="card">
            <GroupPickers data={tournPred} onChange={setTournPred} />
          </div>

          <div className="card">
            <div className="section-title">🃏 Øvrige kategorier</div>
            <TeamPlayerPicker label="🟡 Flest gule kort — spiller" teamKey="most_yellow_team" playerKey="most_yellow_player" data={tournPred} onChange={setTournPred} squads={squads} pts="20 pt" />
            <div className="form-group">
              <div className="form-label">🟡 Flest gule kort — hold <span style={{color:'var(--gold)',marginLeft:4}}>· 20 pt</span></div>
              {sel('most_yellow_team_overall', tournPred.most_yellow_team_overall||'', ALL_TEAMS, v=>setTournPred(d=>({...d,most_yellow_team_overall:v})),'— Vælg hold —')}
            </div>
            <TeamPlayerPicker label="🔴 Flest røde kort — spiller" teamKey="most_red_team" playerKey="most_red_player" data={tournPred} onChange={setTournPred} squads={squads} pts="20 pt" />
            <div className="form-group">
              <div className="form-label">🔴 Flest røde kort — hold <span style={{color:'var(--gold)',marginLeft:4}}>· 20 pt</span></div>
              {sel('most_red_team_overall', tournPred.most_red_team_overall||'', ALL_TEAMS, v=>setTournPred(d=>({...d,most_red_team_overall:v})),'— Vælg hold —')}
            </div>
            <TeamPlayerPicker label="🃏 Flest kortpoint samlet — spiller" teamKey="most_card_pts_player_team" playerKey="most_card_pts_player" data={tournPred} onChange={setTournPred} squads={squads} pts="20 pt" />
            <div className="form-group">
              <div className="form-label">🃏 Flest kortpoint samlet — hold <span style={{color:'var(--gold)',marginLeft:4}}>· 20 pt</span></div>
              {sel('most_card_pts_team', tournPred.most_card_pts_team||'', ALL_TEAMS, v=>setTournPred(d=>({...d,most_card_pts_team:v})),'— Vælg hold —')}
            </div>
            <TeamPlayerPicker label="⭐ Flest MVP-priser — spiller" teamKey="most_mvp_team" playerKey="most_mvp_player" data={tournPred} onChange={setTournPred} squads={squads} pts="3 pt" />
            <TeamPlayerPicker label="🌟 Turneringsspiller (bedste spiller)" teamKey="tournament_player_team" playerKey="tournament_player" data={tournPred} onChange={setTournPred} squads={squads} pts="25 pt" />
            <div className="form-group">
              <div className="form-label">🛡️ Færrest mål lukket ind — hold <span style={{color:'var(--gold)',marginLeft:4}}>· 20 pt</span></div>
              {sel('least_goals_conceded', tournPred.least_goals_conceded||'', ALL_TEAMS, v=>setTournPred(d=>({...d,least_goals_conceded:v})),'— Vælg hold —')}
            </div>
            <div className="form-group">
              <div className="form-label">⚡ Flest mål scoret — hold <span style={{color:'var(--gold)',marginLeft:4}}>· 20 pt</span></div>
              {sel('most_goals_scored', tournPred.most_goals_scored||'', ALL_TEAMS, v=>setTournPred(d=>({...d,most_goals_scored:v})),'— Vælg hold —')}
            </div>
          </div>

          {/* VAR straffespark bet */}
          <div className="card" style={{borderColor:'rgba(239,68,68,.3)',background:'rgba(239,68,68,.04)'}}>
            <div className="section-title" style={{marginTop:0,color:'var(--red)'}}>🚨 VAR Straffespark — Specielt gæt</div>
            <p style={{fontSize:13,color:'var(--text2)',marginBottom:10,lineHeight:1.6}}>
              Gæt på antal VAR-tildelte straffespark under hele VM 2026. Nærmest-vinder princip:
              1. plads = <strong style={{color:'var(--gold)'}}>30 pt</strong>, 2. plads = <strong>15 pt</strong>, resten = 0.
            </p>
            <p style={{fontSize:12,color:'var(--text3)',marginBottom:10}}>
              ⏰ Låses 15. juni 2026 kl. 23:00 dansk tid
            </p>
            <div className="form-group">
              <div className="form-label">Antal VAR straffespark i hele VM <span style={{color:'var(--gold)',marginLeft:4}}>· Nærmest vinder 30 pt</span></div>
              <input
                type="number" min="0" max="200"
                className="form-input"
                value={tournPred.var_penalties ?? ''}
                onChange={e => setTournPred(d => ({...d, var_penalties: e.target.value === '' ? null : parseInt(e.target.value)}))}
                placeholder="fx 12"
                style={{maxWidth:120, fontSize:18, fontWeight:700, textAlign:'center'}}
                disabled={tournLocked}
              />
            </div>
          </div>

          {!tournLocked && <button className="btn btn-gold btn-full" onClick={saveTournament} disabled={saving}>{saving?'Gemmer...':'💾 Gem turneringsgæt'}</button>}
        </div>
      )}

      {tab==='matches' && (
        <div>
          <div className="alert alert-info" style={{fontSize:13,marginBottom:12}}>Gæt låses 15 min før afspark. Viser de næste 20 kampe.</div>
          {upcomingMatches.length===0
            ? <div className="card empty">Ingen kommende kampe at gætte på.</div>
            : upcomingMatches.map(m => (
                <MatchPredictCard key={m.id} match={m} participantId={participant.id} pin={pin}
                  existing={matchPreds.find(mp=>mp.match_id===m.id)} squads={squads} />
              ))
          }
        </div>
      )}

      {tab==='mykampe' && (
        <MyMatches participantId={participant.id} />
      )}

      {tab==='dreamteam' && (
        <DreamTeamPicker participantId={participant.id} pin={pin} squads={squads} />
      )}
    </div>
  )
}
