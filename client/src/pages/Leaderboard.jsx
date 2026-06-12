import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import DagensKamp from './DagensKamp.jsx'
import Consensus from './Consensus.jsx'

const COLORS = ['#3b82f6','#8b5cf6','#10b981','#f97316','#ec4899','#06b6d4','#84cc16','#f59e0b']
const getColor = name => COLORS[name.charCodeAt(0) % COLORS.length]
const initials = name => name.trim().split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()
const RANK_ICONS = ['🥇','🥈','🥉']

function fmt(iso) {
  return new Date(iso).toLocaleString('da-DK',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit',timeZone:'Europe/Copenhagen'})
}

function ActivityFeed() {
  const [feed, setFeed] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    api.get('/participants/feed/activity').then(r=>{setFeed(r.data);setLoading(false)}).catch(()=>setLoading(false))
  }, [])

  if (loading) return <div style={{padding:'1rem',color:'var(--text3)',fontSize:13,textAlign:'center'}}>Henter...</div>
  if (feed.length === 0) return <div className="empty">Ingen afsluttede kampe endnu — feed vises her når de første resultater er registreret.</div>

  return (
    <div>
      {feed.map(item => (
        <div key={item.matchId} style={{paddingBottom:10,marginBottom:10,borderBottom:'1px solid var(--border)'}}>
          <div style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer'}} onClick={()=>setExpanded(expanded===item.matchId?null:item.matchId)}>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontWeight:600,fontSize:14}}>
                {item.home} <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:18,color:'var(--gold)'}}>{item.score}</span> {item.away}
              </div>
              <div style={{fontSize:12,color:'var(--text3)',marginTop:1}}>{fmt(item.kickoff)}{item.group?` · Gruppe ${item.group}`:''}</div>
            </div>
            <div style={{textAlign:'right',flexShrink:0}}>
              {item.maxPts>0&&<div style={{fontSize:12,color:'var(--green)',fontWeight:600}}>Max {item.maxPts} pt</div>}
              <div style={{fontSize:11,color:'var(--text3)'}}>{item.participants.length} gæt ▾</div>
            </div>
          </div>
          {expanded===item.matchId&&(
            <div style={{marginTop:8,paddingTop:6,borderTop:'1px solid var(--border)'}}>
              {item.participants.length===0
                ? <div style={{fontSize:13,color:'var(--text3)'}}>Ingen gæt på denne kamp.</div>
                : item.participants.map((p,i)=>(
                    <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',fontSize:13,padding:'3px 4px',borderRadius:4,background:i===0&&p.pts===item.maxPts&&p.pts>0?'rgba(245,197,24,.06)':'transparent'}}>
                      <span style={{color:'var(--text2)'}}>{i===0&&p.pts===item.maxPts&&p.pts>0?'🏆 ':''}{p.name}</span>
                      <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:18,fontWeight:800,color:p.pts>0?'var(--gold)':'var(--text3)'}}>{p.pts} pt</span>
                    </div>
                  ))
              }
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export default function Leaderboard() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)
  const [tab, setTab] = useState('leaderboard')
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/participants').then(r=>{setData(r.data);setLoading(false)}).catch(()=>setLoading(false))
    const t = setInterval(()=>api.get('/participants').then(r=>setData(r.data)).catch(()=>{}),60000)
    return ()=>clearInterval(t)
  }, [])

  if (loading) return <div className="spinner">⚽ Henter leaderboard...</div>

  return (
    <div>
      <div style={{padding:'1.25rem 0 1rem'}}>
        <div className="page-title">🏆 Leaderboard</div>
        <div className="page-sub">VM 2026 · Opdateres automatisk</div>
      </div>

      <div className="tabs">
        <button className={`tab-btn${tab==='leaderboard'?' active':''}`} onClick={()=>setTab('leaderboard')}>🏆 Stillinger</button>
        <button className={`tab-btn${tab==='upcoming'?' active':''}`} onClick={()=>setTab('upcoming')}>⚽ Næste kampe</button>
        <button className={`tab-btn${tab==='feed'?' active':''}`} onClick={()=>setTab('feed')}>📰 Seneste kampe</button>
        <button className={`tab-btn${tab==='consensus'?' active':''}`} onClick={()=>setTab('consensus')}>🤝 Konsensus</button>
        <button className={`tab-btn${tab==='points'?' active':''}`} onClick={()=>setTab('points')}>ℹ️ Point</button>
      </div>

      {tab==='leaderboard' && (
        <>
          {data.length===0
            ? <div className="card empty">Ingen deltagere endnu. Tilmeld dig under "Mine gæt"!</div>
            : <div className="card" style={{padding:'0 1rem'}}>
                {data.map((p,i)=>(
                  <div key={p.id}>
                    <div className="lb-row" style={{cursor:'pointer'}} onClick={()=>setExpanded(expanded===p.id?null:p.id)}>
                      <div className={`lb-rank${i<3?` r${i+1}`:''}`}>{i<3?RANK_ICONS[i]:i+1}</div>
                      <div className="lb-avatar" style={{background:getColor(p.name)}}>{initials(p.name)}</div>
                      <div className="lb-name" onClick={e=>{e.stopPropagation();navigate(`/profil/${p.id}`)}} style={{cursor:'pointer'}}>
                        {p.name} <span style={{fontSize:11,color:'var(--text3)'}}>→</span>
                      </div>
                      <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:2}}>
                        <div className="lb-pts-big">{p.total_pts}</div>
                        <div className="lb-pts-label">point</div>
                      </div>
                    </div>
                    {expanded===p.id&&(
                      <div style={{padding:'.5rem 0 .75rem 44px'}}>
                        <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:6}}>
                          <span className="badge badge-blue">{p.match_pts} kamp</span>
                          <span className="badge badge-gold">{p.tournament_pts} turnering</span>
                          {p.dream_team_pts>0&&<span className="badge badge-green">{p.dream_team_pts} VM hold</span>}
                        </div>
                        {p.breakdown?.slice(0,8).map((b,j)=>(
                          <div key={j} style={{display:'flex',justifyContent:'space-between',fontSize:13,padding:'2px 0',color:'var(--text2)'}}>
                            <span>{b.cat}</span><span style={{color:'var(--gold)',fontWeight:600,marginLeft:8}}>+{b.pts}</span>
                          </div>
                        ))}
                        {p.breakdown?.length>8&&<div style={{fontSize:12,color:'var(--text3)',marginTop:4}}>...og {p.breakdown.length-8} mere</div>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
          }
        </>
      )}

      {tab==='upcoming' && <DagensKamp />}
      {tab==='consensus' && <div className="card" style={{padding:'1rem'}}><Consensus /></div>}
      {tab==='feed' && (
        <div className="card" style={{padding:'1rem'}}>
          <ActivityFeed />
        </div>
      )}

      {tab==='points' && (
        <div className="card">
          <div className="section-title" style={{marginTop:0}}>Hurtig pointoversigt</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'6px 16px'}}>
            {[['VM vinder','20 pt'],['2. plads VM','15 pt'],['3. plads VM','10 pt'],['Topscorer top 1','20 pt'],['Topscorer top 2','15 pt'],['Topscorer top 3','10 pt'],['Gruppevindr','5 pt'],['Nr. 2 i gruppe','3 pt'],['Kampresultat','3 pt'],['Eksakt score','3 pt'],['Første målscorer','3 pt'],['Kampens spiller','3 pt'],['VM hold (pr. spiller)','5 pt'],['Bedste spiller','25 pt'],['Turneringsspiller','25 pt'],['Kort/disciplin','20 pt'],['Færrest mål ind','20 pt'],['Flest mål scoret','20 pt']].map(([l,p])=>(
              <div key={l} style={{display:'flex',justifyContent:'space-between',gap:8,fontSize:13,padding:'3px 0',borderBottom:'1px solid var(--border)'}}>
                <span style={{color:'var(--text2)'}}>{l}</span>
                <span style={{color:'var(--gold)',fontWeight:700,fontFamily:"'Barlow Condensed',sans-serif",fontSize:16}}>{p}</span>
              </div>
            ))}
          </div>
          <div style={{marginTop:'8px',textAlign:'center'}}>
            <a href="/regler" style={{color:'var(--blue)',fontSize:13,textDecoration:'none'}}>Se alle regler →</a>
          </div>
        </div>
      )}
    </div>
  )
}
