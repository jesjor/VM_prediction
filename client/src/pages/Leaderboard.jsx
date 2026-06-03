import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'

const COLORS = ['#3b82f6','#8b5cf6','#10b981','#f97316','#ec4899','#06b6d4','#84cc16','#f59e0b']
const getColor = name => COLORS[name.charCodeAt(0) % COLORS.length]
const initials = name => name.trim().split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()
const RANK_ICONS = ['🥇','🥈','🥉']

export default function Leaderboard() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    api.get('/participants').then(r => { setData(r.data); setLoading(false) }).catch(() => setLoading(false))
    const t = setInterval(() => api.get('/participants').then(r => setData(r.data)).catch(()=>{}), 60000)
    return () => clearInterval(t)
  }, [])

  const navigate = useNavigate()

  if (loading) return <div className="spinner">⚽ Henter leaderboard...</div>

  return (
    <div>
      <div style={{padding:'1.25rem 0 1rem'}}>
        <div className="page-title">🏆 Leaderboard</div>
        <div className="page-sub">VM 2026 · Opdateres automatisk</div>
      </div>

      {data.length === 0
        ? <div className="card empty">Ingen deltagere endnu.<br/>Tilmeld dig under "Mine gæt"!</div>
        : <div className="card" style={{padding:'0 1rem'}}>
            {data.map((p, i) => (
              <div key={p.id}>
                <div className="lb-row" style={{cursor:'pointer'}} onClick={()=> expanded===p.id ? setExpanded(null) : setExpanded(p.id)}>
                  <div className={`lb-rank${i<3?` r${i+1}`:''}`}>{i<3 ? RANK_ICONS[i] : i+1}</div>
                  <div className="lb-avatar" style={{background:getColor(p.name)}}>{initials(p.name)}</div>
                  <div className="lb-name" style={{cursor:'pointer'}} onClick={e=>{e.stopPropagation();navigate(`/profil/${p.id}`)}}>{p.name} <span style={{fontSize:11,color:'var(--text3)'}}>→</span></div>
                  <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:2}}>
                    <div className="lb-pts-big">{p.total_pts}</div>
                    <div className="lb-pts-label">point</div>
                  </div>
                </div>
                {expanded === p.id && (
                  <div style={{padding:'.5rem 0 .75rem 44px'}}>
                    <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:6}}>
                      <span className="badge badge-blue">{p.match_pts} kamp</span>
                      <span className="badge badge-gold">{p.tournament_pts} turnering</span>
                      {p.dream_team_pts > 0 && <span className="badge badge-green">{p.dream_team_pts} VM hold</span>}
                    </div>
                    {p.breakdown?.slice(0,8).map((b,j) => (
                      <div key={j} style={{display:'flex',justifyContent:'space-between',fontSize:13,padding:'2px 0',color:'var(--text2)'}}>
                        <span>{b.cat}</span><span style={{color:'var(--gold)',fontWeight:600,marginLeft:8}}>+{b.pts}</span>
                      </div>
                    ))}
                    {p.breakdown?.length > 8 && <div style={{fontSize:12,color:'var(--text3)',marginTop:4}}>...og {p.breakdown.length-8} mere</div>}
                  </div>
                )}
              </div>
            ))}
          </div>
      }

      <div className="card" style={{marginTop:'1rem'}}>
        <div className="section-title">Hurtig pointoversigt</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'6px 16px'}}>
          {[['VM vinder','20 pt'],['2. plads VM','15 pt'],['3. plads VM','10 pt'],['Gruppevindr','5 pt'],['Nr. 2 i gruppe','3 pt'],['Kampresultat','3 pt'],['Første målscorer','3 pt'],['Kampens spiller','3 pt'],['VM hold (pr. spiller)','5 pt'],['Bedste spiller','20 pt'],['Turneringsspiller','5 pt'],['Topscorer 1. plads','5 pt']].map(([l,p])=>(
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
    </div>
  )
}
