import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'

const ROUND_LABELS = { GROUP:'Gruppespil', R32:'Runde af 32', R16:'Runde af 16', QF:'Kvartfinale', SF:'Semifinale', '3RD':'3. plads', FINAL:'FINALE' }

function useCountdown(kickoff) {
  const [text, setText] = useState('')
  useEffect(() => {
    const lockTime = new Date(new Date(kickoff).getTime() - 15*60*1000)
    function update() {
      const diff = lockTime - new Date()
      if (diff <= 0) { setText('Låst'); return }
      const h = Math.floor(diff/3600000), m = Math.floor((diff%3600000)/60000), s = Math.floor((diff%60000)/1000)
      if (h > 48) setText(`${Math.floor(h/24)}d`)
      else if (h > 0) setText(`${h}t ${m}m`)
      else if (m > 0) setText(`${m}m ${s}s`)
      else setText(`${s}s`)
    }
    update()
    const t = setInterval(update, 1000)
    return () => clearInterval(t)
  }, [kickoff])
  return text
}

function fmt(iso) {
  return new Date(iso).toLocaleString('da-DK',{weekday:'short',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit',timeZone:'Europe/Copenhagen'})
}

// Inline guess form inside match card
function InlineGuess({ match, participant, pin, squads, existingPred, onSaved }) {
  const [pred, setPred] = useState(existingPred?.prediction||'')
  const [exactHome, setExactHome] = useState(existingPred?.exact_home ?? '')
  const [exactAway, setExactAway] = useState(existingPred?.exact_away ?? '')

  function selectPred(v) {
    setPred(v)
    // Auto-initialize score to 0 if not already set
    if (exactHome === '') setExactHome('0')
    if (exactAway === '') setExactAway('0')
  }
  const [scorerTeam, setScorerTeam] = useState(existingPred?.first_scorer_team||'')
  const [scorerPlayer, setScorerPlayer] = useState(existingPred?.first_scorer_player||'')
  const [mvpTeam, setMvpTeam] = useState(existingPred?.match_mvp_team||'')
  const [mvpPlayer, setMvpPlayer] = useState(existingPred?.match_mvp_player||'')
  const [msg, setMsg] = useState('')
  const [saving, setSaving] = useState(false)

  const teams = [match.home_team, match.away_team].filter(Boolean)
  const scorerPlayers = scorerTeam && scorerTeam!=='ingen' && squads[scorerTeam] ? squads[scorerTeam].map(p=>p.player) : []
  const mvpPlayers = mvpTeam && squads[mvpTeam] ? squads[mvpTeam].map(p=>p.player) : []

  async function save() {
    if (!pred) return setMsg('Vælg 1, X eller 2')
    setSaving(true)
    try {
      await api.put(`/participants/${participant.id}/match-predictions/${match.id}`, {
        pin, prediction: pred,
        first_scorer_team: scorerTeam||null, first_scorer_player: scorerPlayer||null,
        match_mvp_team: mvpTeam||null, match_mvp_player: mvpPlayer||null,
        exact_home: exactHome !== '' ? parseInt(exactHome) : null,
        exact_away: exactAway !== '' ? parseInt(exactAway) : null,
      })
      setMsg('✅ Gemt!')
      onSaved()
      setTimeout(()=>setMsg(''),3000)
    } catch(e) { setMsg(e.response?.data?.error||'Fejl') }
    setSaving(false)
  }

  const home = match.home_team||'?', away = match.away_team||'?'

  return (
    <div style={{marginTop:10,borderTop:'1px solid var(--border)',paddingTop:10}}>
      <div style={{fontSize:12,color:'var(--gold)',fontWeight:600,marginBottom:8}}>⚽ Afgiv dit gæt</div>

      {/* 1X2 */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:6,marginBottom:8}}>
        {[['1',home],['X','Uafgjort'],['2',away]].map(([v,label])=>(
          <button key={v} onClick={()=>selectPred(v)}
            style={{padding:'8px 4px',border:`1.5px solid ${pred===v?'var(--blue)':'var(--border2)'}`,
              background:pred===v?'rgba(59,130,246,.15)':'transparent',borderRadius:8,
              color:pred===v?'var(--blue)':'var(--text2)',cursor:'pointer',fontFamily:"'Barlow',sans-serif"}}>
            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:20,fontWeight:800}}>{v}</div>
            <div style={{fontSize:10,marginTop:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{label}</div>
          </button>
        ))}
      </div>

      {/* Exact score */}
      <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:8}}>
        <span style={{fontSize:12,color:'var(--text3)',flexShrink:0}}>🎯 Eksakt score:</span>
        <input type="number" min="0" max="20" value={exactHome}
          onChange={e=>setExactHome(e.target.value)}
          style={{width:48,textAlign:'center',padding:'6px',border:`1.5px solid ${exactHome!==''?'var(--blue)':'var(--border2)'}`,borderRadius:6,background:'var(--bg3)',color:'var(--text)',fontFamily:"'Barlow Condensed',sans-serif",fontSize:18,fontWeight:700}}
          placeholder="—"/>
        <span style={{color:'var(--text3)',fontWeight:700}}>-</span>
        <input type="number" min="0" max="20" value={exactAway}
          onChange={e=>setExactAway(e.target.value)}
          style={{width:48,textAlign:'center',padding:'6px',border:`1.5px solid ${exactAway!==''?'var(--blue)':'var(--border2)'}`,borderRadius:6,background:'var(--bg3)',color:'var(--text)',fontFamily:"'Barlow Condensed',sans-serif",fontSize:18,fontWeight:700}}
          placeholder="—"/>
        <span style={{fontSize:11,color:exactHome!==''&&exactAway!==''?'var(--gold)':'var(--text3)'}}>
          {exactHome!==''&&exactAway!==''?'+3 pt hvis rigtig':'udfyld for bonus'}
        </span>
      </div>

      {/* First scorer */}
      <div style={{display:'flex',gap:6,marginBottom:6,flexWrap:'wrap'}}>
        <select style={{flex:'1 1 120px',padding:'6px 8px',border:'1px solid var(--border2)',borderRadius:6,background:'var(--bg3)',color:'var(--text)',fontSize:13,fontFamily:"'Barlow',sans-serif"}}
          value={scorerTeam} onChange={e=>{setScorerTeam(e.target.value);setScorerPlayer('')}}>
          <option value="">⚽ Første scorer — hold</option>
          {teams.map(t=><option key={t} value={t}>{t}</option>)}
          <option value="ingen">Ingen mål (0-0)</option>
        </select>
        {scorerTeam && scorerTeam!=='ingen' && (
          <select style={{flex:'1 1 120px',padding:'6px 8px',border:'1px solid var(--border2)',borderRadius:6,background:'var(--bg3)',color:'var(--text)',fontSize:13,fontFamily:"'Barlow',sans-serif"}}
            value={scorerPlayer} onChange={e=>setScorerPlayer(e.target.value)}>
            <option value="">— Spiller —</option>
            {scorerPlayers.map(p=><option key={p} value={p}>{p}</option>)}
          </select>
        )}
      </div>

      {/* MVP */}
      <div style={{display:'flex',gap:6,marginBottom:8,flexWrap:'wrap'}}>
        <select style={{flex:'1 1 120px',padding:'6px 8px',border:'1px solid var(--border2)',borderRadius:6,background:'var(--bg3)',color:'var(--text)',fontSize:13,fontFamily:"'Barlow',sans-serif"}}
          value={mvpTeam} onChange={e=>{setMvpTeam(e.target.value);setMvpPlayer('')}}>
          <option value="">🌟 MVP — hold</option>
          {teams.map(t=><option key={t} value={t}>{t}</option>)}
        </select>
        {mvpTeam && (
          <select style={{flex:'1 1 120px',padding:'6px 8px',border:'1px solid var(--border2)',borderRadius:6,background:'var(--bg3)',color:'var(--text)',fontSize:13,fontFamily:"'Barlow',sans-serif"}}
            value={mvpPlayer} onChange={e=>setMvpPlayer(e.target.value)}>
            <option value="">— Spiller —</option>
            {mvpPlayers.map(p=><option key={p} value={p}>{p}</option>)}
          </select>
        )}
      </div>

      <div style={{display:'flex',alignItems:'center',gap:10}}>
        <button className="btn btn-gold btn-sm" onClick={save} disabled={saving}>{saving?'Gemmer...':'💾 Gem gæt'}</button>
        {msg && <span style={{fontSize:13,color:msg.includes('✅')?'var(--green)':'var(--red)'}}>{msg}</span>}
      </div>
    </div>
  )
}

// Participant scores panel shown after match is locked
function MatchParticipants({ matchId }) {
  const [data, setData] = useState(null)
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    api.get(`/matches/${matchId}/participants`).then(r=>setData(r.data)).catch(()=>{})
  }, [matchId])

  if (!data || !data.locked) return null
  if (data.participants.length === 0) return <p style={{fontSize:13,color:'var(--text3)',padding:'8px 0'}}>Ingen gæt på denne kamp.</p>

  return (
    <div style={{marginTop:10,borderTop:'1px solid var(--border)',paddingTop:10}}>
      <div style={{fontSize:12,fontWeight:600,color:'var(--text3)',letterSpacing:1,textTransform:'uppercase',marginBottom:6}}>Deltagernes gæt</div>
      {data.participants.map((p,i) => (
        <div key={p.participant_id}>
          <div
            style={{display:'flex',alignItems:'center',gap:10,padding:'6px 0',borderBottom:'1px solid var(--border)',cursor:'pointer'}}
            onClick={()=>setExpanded(expanded===p.participant_id?null:p.participant_id)}
          >
            <div style={{flex:1,display:'flex',alignItems:'center',gap:8}}>
              <span style={{fontSize:13,fontWeight:500}}>{p.name}</span>
              <span className={`badge ${p.prediction==='1'?'badge-blue':p.prediction==='X'?'badge-gray':'badge-green'}`}>{p.prediction||'—'}</span>
              {p.exact_home!==null&&p.exact_home!==undefined&&<span className="badge badge-gold" style={{fontSize:10}}>{p.exact_home}-{p.exact_away}</span>}
            </div>
            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:20,fontWeight:800,color:p.pts>0?'var(--gold)':'var(--text3)'}}>{p.pts} pt</div>
            <span style={{fontSize:12,color:'var(--text3)'}}>▾</span>
          </div>
          {expanded===p.participant_id && (
            <div style={{padding:'6px 0 6px 12px',background:'var(--bg3)',borderRadius:6,marginBottom:4}}>
              {p.breakdown.map((b,j)=>(
                <div key={j} style={{display:'flex',justifyContent:'space-between',fontSize:12,padding:'2px 0',color:b.hit?'var(--text)':'var(--text3)'}}>
                  <span>{b.hit?'✅':'❌'} {b.cat}</span>
                  <span style={{color:b.hit?'var(--gold)':'var(--text3)',fontWeight:b.hit?600:400,marginLeft:8}}>{b.pts>0?`+${b.pts}`:''}</span>
                </div>
              ))}
              {p.first_scorer_player&&<div style={{fontSize:12,color:'var(--text3)',marginTop:2}}>⚽ Scorer: {p.first_scorer_player} ({p.first_scorer_team})</div>}
              {p.match_mvp_player&&<div style={{fontSize:12,color:'var(--text3)'}}>🌟 MVP: {p.match_mvp_player}</div>}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function MatchCard({ match, participant, pin, squads, myPred, onPredSaved }) {
  const [open, setOpen] = useState(false)
  const [showGuess, setShowGuess] = useState(false)
  const [guessCounts, setGuessCounts] = useState(null)
  const countdown = useCountdown(match.kickoff)
  const finished = match.status==='finished', live = match.status==='live'
  const lockTime = new Date(new Date(match.kickoff).getTime()-15*60*1000)
  const locked = new Date() > lockTime
  const home = match.home_team||match.home_slot||'?', away = match.away_team||match.away_slot||'?'
  const canGuess = !locked && match.home_team && match.away_team && participant

  function handleOpen() {
    if (!open && match.home_team) {
      api.get(`/participants/guess-counts/match/${match.id}`).then(r=>setGuessCounts(r.data)).catch(()=>{})
    }
    setOpen(o=>!o)
  }

  return (
    <div className={`match-card${finished?' finished':live?' live':''}`} style={{marginBottom:8}}>
      <div style={{display:'flex',alignItems:'center',gap:10,cursor:'pointer'}} onClick={handleOpen}>
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
            {match.group_name&&<span className="badge badge-gray" style={{flexShrink:0}}>Gr.{match.group_name}</span>}
            {!match.group_name&&<span className="badge badge-blue" style={{flexShrink:0}}>{ROUND_LABELS[match.round]||match.round}</span>}
            <span style={{fontWeight:600,fontSize:14}}>{home}</span>
            {(finished||live)
              ? <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:20,fontWeight:800,color:'var(--gold)'}}>{match.home_score}-{match.away_score}</span>
              : <span style={{color:'var(--text3)',fontSize:13}}>vs</span>
            }
            <span style={{fontWeight:600,fontSize:14}}>{away}</span>
            {live&&<span className="badge badge-red">LIVE</span>}
            {finished&&<span className="badge badge-green">Slut</span>}
          </div>
          <div style={{fontSize:12,color:'var(--text3)',marginTop:2}}>📍 {match.stadium_name} · {fmt(match.kickoff)}</div>
        </div>
        <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:2,flexShrink:0}}>
          {myPred&&!locked&&<span className="badge badge-green" style={{fontSize:10}}>Gættet ✓</span>}
          {!finished&&!live&&match.home_team&&(
            <div style={{fontSize:locked?11:12,fontWeight:600,color:locked?'var(--text3)':countdown.includes('s')&&!countdown.includes('m')?'var(--red)':'var(--text2)'}}>
              {locked?'🔒':'⏳'} {locked?'Låst':countdown}
            </div>
          )}
        </div>
      </div>

      {open && (
        <div style={{marginTop:10,borderTop:'1px solid var(--border)',paddingTop:10}}>

          {/* Guess distribution */}
          {guessCounts&&guessCounts.total>0&&(
            <div style={{marginBottom:10}}>
              <div style={{fontSize:12,color:'var(--text3)',marginBottom:5,fontWeight:600,letterSpacing:.5,textTransform:'uppercase'}}>Hvad gætter folk? ({guessCounts.total} gæt)</div>
              <div style={{display:'flex',gap:6}}>
                {[['1',home,'var(--blue)'],['X','Uafgjort','var(--text2)'],['2',away,'var(--green)']].map(([v,label,color])=>{
                  const count=guessCounts[v]||0, pct=Math.round((count/guessCounts.total)*100)
                  return (
                    <div key={v} style={{flex:1,background:'var(--bg3)',borderRadius:8,padding:'8px 6px',textAlign:'center'}}>
                      <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:20,fontWeight:800,color}}>{v}</div>
                      <div style={{fontSize:10,color:'var(--text3)',marginBottom:3,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{label}</div>
                      <div style={{background:'var(--border)',borderRadius:3,height:3,overflow:'hidden',marginBottom:3}}>
                        <div style={{width:`${pct}%`,height:'100%',background:color,transition:'width .3s'}}/>
                      </div>
                      <div style={{fontSize:12,fontWeight:600,color:'var(--text2)'}}>{pct}%</div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Events */}
          {(finished||live)&&match.events?.length>0&&(
            <div style={{marginBottom:10}}>
              <div style={{fontSize:12,color:'var(--text3)',marginBottom:4,fontWeight:600,letterSpacing:.5,textTransform:'uppercase'}}>Begivenheder</div>
              {match.events.map((e,i)=>(
                <div key={i} style={{display:'flex',gap:8,fontSize:13,color:'var(--text2)',padding:'2px 0'}}>
                  <span style={{color:'var(--text3)',minWidth:28}}>{e.minute}'</span>
                  <span>{e.event_type==='goal'&&'⚽'}{e.event_type==='own_goal'&&'🙈'}{e.event_type==='yellow'&&'🟡'}{e.event_type==='red'&&'🔴'}{e.event_type==='yellow_red'&&'🟡🔴'}</span>
                  <span>{e.player} <span style={{color:'var(--text3)'}}>({e.team})</span>{e.assist_player&&<span style={{color:'var(--text3)'}}> · 🎯 {e.assist_player}</span>}</span>
                </div>
              ))}
            </div>
          )}

          {/* Participant points after lock */}
          {locked && <MatchParticipants matchId={match.id} />}

          {/* My locked guess */}
          {locked&&myPred&&(
            <div style={{marginTop:8,background:'var(--bg3)',borderRadius:8,padding:'8px 12px',fontSize:13}}>
              <div style={{color:'var(--text3)',marginBottom:2,fontSize:11,fontWeight:600}}>DIT GÆT</div>
              <span>Resultat: <strong style={{color:'var(--gold)',fontFamily:"'Barlow Condensed',sans-serif",fontSize:18}}>{myPred.prediction}</strong></span>
              {myPred.exact_home!==null&&myPred.exact_home!==undefined&&<span style={{marginLeft:10}}>Score: <strong>{myPred.exact_home}-{myPred.exact_away}</strong></span>}
              {myPred.first_scorer_player&&<span style={{marginLeft:10}}>⚽ <strong>{myPred.first_scorer_player}</strong></span>}
              {myPred.match_mvp_player&&<span style={{marginLeft:10}}>🌟 <strong>{myPred.match_mvp_player}</strong></span>}
            </div>
          )}

          {/* Inline guess */}
          {canGuess&&!showGuess&&!myPred&&(
            <button className="btn btn-gold btn-sm" style={{marginTop:8}} onClick={()=>setShowGuess(true)}>
              ⚽ Afgiv gæt på denne kamp
            </button>
          )}
          {canGuess&&!showGuess&&myPred&&(
            <button className="btn btn-sm" style={{marginTop:8}} onClick={()=>setShowGuess(true)}>
              ✏️ Rediger gæt
            </button>
          )}
          {canGuess&&showGuess&&(
            <InlineGuess match={match} participant={participant} pin={pin} squads={squads}
              existingPred={myPred} onSaved={()=>{setShowGuess(false);onPredSaved(match.id)}} />
          )}
          {!participant&&!locked&&match.home_team&&(
            <div style={{marginTop:8,fontSize:13,color:'var(--text3)'}}>
              <a href="/gaet" style={{color:'var(--blue)'}}>Log ind</a> for at afgive dit gæt på denne kamp.
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function Matches() {
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('upcoming')
  const [squads, setSquads] = useState({})
  const [myPreds, setMyPreds] = useState({})

  // Participant from localStorage
  const [participant, setParticipant] = useState(null)
  const [pin, setPin] = useState('')

  useEffect(() => {
    const saved = localStorage.getItem('vm2026_participant')
    if (saved) { try { const p=JSON.parse(saved); setParticipant(p.participant); setPin(p.pin) } catch{} }
    api.get('/matches').then(r=>{setMatches(r.data);setLoading(false)}).catch(()=>setLoading(false))
    api.get('/squads').then(r=>setSquads(r.data)).catch(()=>{})
  }, [])

  useEffect(() => {
    if (!participant) return
    api.get(`/participants/${participant.id}/match-predictions`).then(r=>{
      const map={}; r.data.forEach(p=>{map[p.match_id]=p}); setMyPreds(map)
    }).catch(()=>{})
  }, [participant])

  function handlePredSaved(matchId) {
    if (!participant) return
    api.get(`/participants/${participant.id}/match-predictions`).then(r=>{
      const map={}; r.data.forEach(p=>{map[p.match_id]=p}); setMyPreds(map)
    }).catch(()=>{})
  }

  if (loading) return <div className="spinner">Henter kampprogram...</div>

  const now = new Date()
  let display = matches
  if (filter==='upcoming') display = matches.filter(m=>new Date(m.kickoff)>now&&m.status!=='finished').slice(0,30)
  else if (filter==='finished') display = matches.filter(m=>m.status==='finished').reverse()
  else if (filter==='live') display = matches.filter(m=>m.status==='live')
  else if (filter==='group') display = matches.filter(m=>m.round==='GROUP')
  else if (filter==='knockout') display = matches.filter(m=>m.round!=='GROUP')

  const finished=matches.filter(m=>m.status==='finished').length
  const upcoming=matches.filter(m=>new Date(m.kickoff)>now&&m.status!=='finished').length

  return (
    <div>
      <div style={{padding:'1.25rem 0 1rem'}}>
        <div className="page-title">📅 Kampprogrammet</div>
        <div className="page-sub">Alle 104 kampe · VM 2026</div>
      </div>

      {participant&&(
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8,padding:'8px 12px',background:'var(--bg2)',borderRadius:8,fontSize:13}}>
          <span style={{color:'var(--green)'}}>✓ Logget ind som <strong>{participant.name}</strong></span>
          <button className="btn btn-sm" style={{marginLeft:'auto',padding:'3px 8px'}} onClick={()=>{localStorage.removeItem('vm2026_participant');setParticipant(null);setPin('')}}>Log ud</button>
        </div>
      )}
      {!participant&&(
        <div style={{marginBottom:8,padding:'8px 12px',background:'var(--bg2)',borderRadius:8,fontSize:13,color:'var(--text3)'}}>
          <a href="/gaet" style={{color:'var(--blue)'}}>Log ind</a> for at afgive kampgæt direkte herfra.
        </div>
      )}

      <div style={{display:'flex',gap:6,marginBottom:8,alignItems:'center',flexWrap:'wrap'}}>
        <span className="badge badge-green">{finished} spillet</span>
        <span className="badge badge-gray">{upcoming} kommende</span>
        {matches.filter(m=>m.status==='live').length>0&&<span className="badge badge-red">🔴 Live</span>}
      </div>
      <div style={{display:'flex',gap:4,marginBottom:12,flexWrap:'wrap'}}>
        {[['upcoming','Kommende'],['live','Live'],['finished','Spillet'],['group','Gruppe'],['knockout','Knockout'],['all','Alle']].map(([v,l])=>(
          <button key={v} className={`btn btn-sm${filter===v?' btn-primary':''}`} onClick={()=>setFilter(v)}>{l}</button>
        ))}
      </div>

      {display.length===0&&<div className="empty">Ingen kampe i denne visning.</div>}
      {display.map(m=>(
        <MatchCard key={m.id} match={m} participant={participant} pin={pin}
          squads={squads} myPred={myPreds[m.id]} onPredSaved={handlePredSaved} />
      ))}
    </div>
  )
}
