import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'

const ROUND_LABELS = { GROUP:'Gruppespil', R32:'Runde af 32', R16:'Runde af 16', QF:'Kvartfinale', SF:'Semifinale', '3RD':'3. plads', FINAL:'FINALE' }
const GROUP_ORDER = ['A','B','C','D','E','F','G','H','I','J','K','L']

function useCountdown(kickoff) {
  const [text, setText] = useState('')
  useEffect(() => {
    const lockTime = new Date(new Date(kickoff).getTime() - 15*60*1000)
    function update() {
      const diff = lockTime - new Date()
      if (diff <= 0) { setText('Låst'); return }
      const h = Math.floor(diff/3600000)
      const m = Math.floor((diff%3600000)/60000)
      const s = Math.floor((diff%60000)/1000)
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

function MatchCard({ match, participant }) {
  const [open, setOpen] = useState(false)
  const [guessCounts, setGuessCounts] = useState(null)
  const countdown = useCountdown(match.kickoff)
  const navigate = useNavigate()
  const finished = match.status === 'finished'
  const live = match.status === 'live'
  const locked = new Date() > new Date(new Date(match.kickoff).getTime() - 15*60*1000)
  const home = match.home_team || match.home_slot || '?'
  const away = match.away_team || match.away_slot || '?'

  function handleOpen() {
    setOpen(o => !o)
    if (!guessCounts && match.home_team) {
      api.get(`/participants/guess-counts/match/${match.id}`).then(r => setGuessCounts(r.data)).catch(()=>{})
    }
  }

  return (
    <div className={`match-card${finished?' finished':live?' live':''}`} style={{marginBottom:8}}>
      <div style={{display:'flex',alignItems:'center',gap:10,cursor:'pointer'}} onClick={handleOpen}>
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
            {match.group_name && <span className="badge badge-gray" style={{flexShrink:0}}>Gr.{match.group_name}</span>}
            {!match.group_name && <span className="badge badge-blue" style={{flexShrink:0}}>{ROUND_LABELS[match.round]||match.round}</span>}
            <span style={{fontWeight:600,fontSize:14}}>{home}</span>
            {finished || live
              ? <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:20,fontWeight:800,color:'var(--gold)'}}>{match.home_score}-{match.away_score}</span>
              : <span style={{color:'var(--text3)',fontSize:13}}>vs</span>
            }
            <span style={{fontWeight:600,fontSize:14}}>{away}</span>
            {live && <span className="badge badge-red">LIVE</span>}
            {finished && <span className="badge badge-green">Slut</span>}
          </div>
          <div style={{fontSize:12,color:'var(--text3)',marginTop:3}}>
            📍 {match.stadium_name}, {match.stadium_city}
            {match.stadium_capacity && <> · {match.stadium_capacity.toLocaleString()} pladser</>}
          </div>
          <div style={{fontSize:12,color:'var(--text3)',marginTop:1}}>🕐 {fmt(match.kickoff)}</div>
        </div>
        {!finished && !live && match.home_team && (
          <div style={{textAlign:'center',flexShrink:0}}>
            <div style={{fontSize:locked?11:13,fontWeight:600,color:locked?'var(--text3)':countdown.includes('s')&&!countdown.includes('m')?'var(--red)':'var(--text2)'}}>
              {locked ? '🔒 Låst' : `⏳ ${countdown}`}
            </div>
            {!locked && <div style={{fontSize:10,color:'var(--text3)'}}>til lås</div>}
          </div>
        )}
      </div>

      {open && (
        <div style={{marginTop:10,borderTop:'1px solid var(--border)',paddingTop:10}}>
          {/* Guess distribution */}
          {match.home_team && (
            <div style={{marginBottom:10}}>
              <div style={{fontSize:12,color:'var(--text3)',marginBottom:5,fontWeight:600,letterSpacing:'0.5px',textTransform:'uppercase'}}>Hvad gætter folk?</div>
              {guessCounts && guessCounts.total > 0 ? (
                <div style={{display:'flex',gap:6}}>
                  {[['1',home,'var(--blue)'],['X','Uafgjort','var(--text3)'],['2',away,'var(--green)']].map(([v,label,color])=>{
                    const count = guessCounts[v]||0
                    const pct = guessCounts.total>0 ? Math.round((count/guessCounts.total)*100) : 0
                    return (
                      <div key={v} style={{flex:1,background:'var(--bg3)',borderRadius:8,padding:'8px 6px',textAlign:'center'}}>
                        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:22,fontWeight:800,color}}>{v}</div>
                        <div style={{fontSize:11,color:'var(--text3)',marginBottom:4}}>{label}</div>
                        <div style={{background:'var(--border)',borderRadius:4,height:4,overflow:'hidden'}}>
                          <div style={{width:`${pct}%`,height:'100%',background:color,transition:'width .3s'}}/>
                        </div>
                        <div style={{fontSize:12,fontWeight:600,marginTop:3,color:'var(--text2)'}}>{pct}%</div>
                        <div style={{fontSize:10,color:'var(--text3)'}}>{count} gæt</div>
                      </div>
                    )
                  })}
                </div>
              ) : guessCounts ? (
                <p style={{fontSize:13,color:'var(--text3)'}}>Ingen gæt endnu.</p>
              ) : (
                <p style={{fontSize:13,color:'var(--text3)'}}>Henter...</p>
              )}
            </div>
          )}

          {/* Events */}
          {finished && match.events?.length > 0 && (
            <div>
              <div style={{fontSize:12,color:'var(--text3)',marginBottom:5,fontWeight:600,letterSpacing:'0.5px',textTransform:'uppercase'}}>Begivenheder</div>
              {match.events.map((e,i)=>(
                <div key={i} style={{display:'flex',gap:8,fontSize:13,color:'var(--text2)',padding:'3px 0',borderBottom:'1px solid var(--border)'}}>
                  <span style={{color:'var(--text3)',minWidth:28,flexShrink:0}}>{e.minute}'</span>
                  <span style={{flexShrink:0}}>
                    {e.event_type==='goal'&&'⚽'}{e.event_type==='own_goal'&&'🙈'}
                    {e.event_type==='yellow'&&'🟡'}{e.event_type==='red'&&'🔴'}{e.event_type==='yellow_red'&&'🟡🔴'}
                  </span>
                  <span>{e.player} <span style={{color:'var(--text3)'}}>({e.team})</span>
                    {e.assist_player && <span style={{color:'var(--text3)'}}> · 🎯 {e.assist_player}</span>}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* CTA to predict */}
          {!locked && match.home_team && participant && (
            <button className="btn btn-primary btn-sm" style={{marginTop:10}} onClick={()=>navigate('/gaet')}>
              ⚽ Afgiv gæt på denne kamp
            </button>
          )}
          {!locked && match.home_team && !participant && (
            <button className="btn btn-gold btn-sm" style={{marginTop:10}} onClick={()=>navigate('/gaet')}>
              Log ind for at gætte
            </button>
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
  const participant = null // could read from localStorage if needed

  useEffect(() => {
    api.get('/matches').then(r=>{setMatches(r.data);setLoading(false)}).catch(()=>setLoading(false))
  }, [])

  if (loading) return <div className="spinner">Henter kampprogram...</div>

  const now = new Date()
  let display = matches
  if (filter==='upcoming') display = matches.filter(m=>new Date(m.kickoff)>now&&m.status!=='finished').slice(0,30)
  else if (filter==='finished') display = matches.filter(m=>m.status==='finished').reverse()
  else if (filter==='live') display = matches.filter(m=>m.status==='live')
  else if (filter==='group') display = matches.filter(m=>m.round==='GROUP')
  else if (filter==='knockout') display = matches.filter(m=>m.round!=='GROUP')

  const finished = matches.filter(m=>m.status==='finished').length
  const upcoming = matches.filter(m=>new Date(m.kickoff)>now&&m.status!=='finished').length

  return (
    <div>
      <div style={{padding:'1.25rem 0 1rem'}}>
        <div className="page-title">📅 Kampprogrammet</div>
        <div className="page-sub">Alle 104 kampe · VM 2026 · USA, Mexico & Canada</div>
      </div>

      <div style={{display:'flex',gap:8,marginBottom:12,alignItems:'center',flexWrap:'wrap'}}>
        <span className="badge badge-green">{finished} spillet</span>
        <span className="badge badge-gray">{upcoming} kommende</span>
        {matches.filter(m=>m.status==='live').length>0 && <span className="badge badge-red">🔴 {matches.filter(m=>m.status==='live').length} live</span>}
      </div>

      <div style={{display:'flex',gap:4,marginBottom:12,flexWrap:'wrap'}}>
        {[['upcoming','Kommende'],['live','Live'],['finished','Spillet'],['group','Gruppe'],['knockout','Knockout'],['all','Alle']].map(([v,l])=>(
          <button key={v} className={`btn btn-sm${filter===v?' btn-primary':''}`} onClick={()=>setFilter(v)}>{l}</button>
        ))}
      </div>

      {display.length===0 && <div className="empty">Ingen kampe i denne visning.</div>}
      {display.map(m=><MatchCard key={m.id} match={m} participant={participant} />)}
    </div>
  )
}
