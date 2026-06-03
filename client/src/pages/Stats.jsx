import { useEffect, useState } from 'react'
import api from '../api'

const GROUPS = ['A','B','C','D','E','F','G','H','I','J','K','L']

function StatList({ items, labelKey, subKey, countKey, countLabel }) {
  if (!items || items.length === 0) return <p style={{color:'var(--text3)',fontSize:14,padding:'8px 0'}}>Ingen data endnu.</p>
  const medals = ['🥇','🥈','🥉']
  return (
    <div>
      {items.slice(0,10).map((item,i) => (
        <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 0',borderBottom:'1px solid var(--border)'}}>
          <div style={{width:28,textAlign:'center',fontSize:i<3?18:14,color:'var(--text3)',fontWeight:700}}>{i<3?medals[i]:i+1}</div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontWeight:600,fontSize:14}}>{item[labelKey]}</div>
            {subKey&&item[subKey]&&<div style={{fontSize:12,color:'var(--text3)'}}>{item[subKey]}</div>}
          </div>
          <div style={{textAlign:'right'}}>
            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:22,fontWeight:800,color:'var(--gold)'}}>{item[countKey]}</div>
            <div style={{fontSize:11,color:'var(--text3)'}}>{countLabel}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

function GroupTable({ group, rows }) {
  const TEAMS_PER_GROUP = 4
  return (
    <div className="card" style={{marginBottom:8,padding:0,overflow:'hidden'}}>
      <div style={{background:'var(--bg3)',padding:'8px 12px',fontFamily:"'Barlow Condensed',sans-serif",fontSize:15,fontWeight:700,letterSpacing:1}}>
        GRUPPE {group}
      </div>
      <div style={{overflowX:'auto'}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
          <thead>
            <tr style={{borderBottom:'1px solid var(--border)'}}>
              <th style={{padding:'6px 12px',textAlign:'left',color:'var(--text3)',fontWeight:600,minWidth:130}}>#</th>
              {['K','V','U','T','MF','MI','MF','Pt'].map(h=>(
                <th key={h} style={{padding:'6px 8px',textAlign:'center',color:'var(--text3)',fontWeight:600,minWidth:32}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r,i) => (
              <tr key={r.team} style={{borderBottom:'1px solid var(--border)',background:i<2?'rgba(34,197,94,.04)':i===2?'rgba(245,197,24,.03)':'transparent'}}>
                <td style={{padding:'8px 12px',display:'flex',alignItems:'center',gap:8}}>
                  <span style={{width:20,height:20,borderRadius:'50%',background:i<2?'var(--green)':i===2?'var(--gold)':'var(--bg3)',display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,color:i<2?'#000':i===2?'#000':'var(--text3)',flexShrink:0}}>{i+1}</span>
                  <span style={{fontWeight:i===0?700:500}}>{r.team}</span>
                </td>
                <td style={{padding:'6px 8px',textAlign:'center',color:'var(--text2)'}}>{r.played}</td>
                <td style={{padding:'6px 8px',textAlign:'center',color:'var(--green)'}}>{r.w}</td>
                <td style={{padding:'6px 8px',textAlign:'center',color:'var(--text3)'}}>{r.d}</td>
                <td style={{padding:'6px 8px',textAlign:'center',color:'var(--red)'}}>{r.l}</td>
                <td style={{padding:'6px 8px',textAlign:'center'}}>{r.gf}</td>
                <td style={{padding:'6px 8px',textAlign:'center'}}>{r.ga}</td>
                <td style={{padding:'6px 8px',textAlign:'center',color:r.gd>0?'var(--green)':r.gd<0?'var(--red)':'var(--text2)'}}>{r.gd>0?`+${r.gd}`:r.gd}</td>
                <td style={{padding:'6px 12px',textAlign:'center',fontFamily:"'Barlow Condensed',sans-serif",fontSize:18,fontWeight:800,color:'var(--gold)'}}>{r.pts}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{padding:'4px 12px 6px',fontSize:11,color:'var(--text3)',display:'flex',gap:12}}>
        <span>🟢 Avancerer</span><span>🟡 Mulig 3'er</span>
        <span style={{marginLeft:'auto'}}>K=Kampe V=Vundet U=Uafg T=Tab MF=Mål for MI=Mål imod Pt=Point</span>
      </div>
    </div>
  )
}

export default function Stats() {
  const [stats, setStats] = useState(null)
  const [cards, setCards] = useState(null)
  const [standings, setStandings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('standings')

  useEffect(() => {
    Promise.all([
      api.get('/matches/stats/tournament'),
      api.get('/matches/stats/cards'),
      api.get('/matches/stats/standings'),
    ]).then(([s,c,st]) => {
      setStats(s.data); setCards(c.data); setStandings(st.data); setLoading(false)
    }).catch(() => setLoading(false))
    const t = setInterval(() => {
      api.get('/matches/stats/tournament').then(r=>setStats(r.data)).catch(()=>{})
      api.get('/matches/stats/cards').then(r=>setCards(r.data)).catch(()=>{})
      api.get('/matches/stats/standings').then(r=>setStandings(r.data)).catch(()=>{})
    }, 120000)
    return () => clearInterval(t)
  }, [])

  if (loading) return <div className="spinner">Henter statistik...</div>

  const tabs = [
    { id:'standings', label:'🏆 Gruppetabeller' },
    { id:'goals',     label:'⚽ Topscorer' },
    { id:'assists',   label:'🎯 Assists' },
    { id:'yellow',    label:'🟡 Gule kort' },
    { id:'red',       label:'🔴 Røde kort' },
    { id:'cardpts',   label:'🃏 Kortpoint' },
    { id:'attack',    label:'⚡ Flest mål' },
    { id:'defense',   label:'🛡️ Færrest ind' },
  ]

  return (
    <div>
      <div style={{padding:'1.25rem 0 1rem'}}>
        <div className="page-title">📊 Turneringsstatistik</div>
        <div className="page-sub">Live opdateret fra kampresultater</div>
      </div>

      <div className="tabs">{tabs.map(t=>(
        <button key={t.id} className={`tab-btn${tab===t.id?' active':''}`} onClick={()=>setTab(t.id)}>{t.label}</button>
      ))}</div>

      {tab==='standings' && (
        <div>
          {!standings || Object.values(standings).every(g=>g.every(t=>t.played===0))
            ? <div className="card empty">Gruppetabeller vises her når de første kampe er spillet.</div>
            : GROUPS.map(g => standings[g]?.length > 0
                ? <GroupTable key={g} group={g} rows={standings[g]} />
                : null
              )
          }
        </div>
      )}

      <div className={tab==='standings'?'hidden':''} style={{display:tab==='standings'?'none':'block'}}>
        <div className="card">
          {tab==='goals'&&<><div className="section-title" style={{marginTop:0}}>Topscorer</div><StatList items={stats?.topscorers} labelKey="player" subKey="team" countKey="count" countLabel="mål"/></>}
          {tab==='assists'&&<><div className="section-title" style={{marginTop:0}}>Flest assists</div><StatList items={stats?.assists} labelKey="player" subKey="team" countKey="count" countLabel="assists"/></>}
          {tab==='yellow'&&<><div className="section-title" style={{marginTop:0}}>Flest gule kort</div><StatList items={stats?.yellow_cards} labelKey="player" subKey="team" countKey="count" countLabel="gule"/></>}
          {tab==='red'&&<><div className="section-title" style={{marginTop:0}}>Flest røde kort</div><StatList items={stats?.red_cards} labelKey="player" subKey="team" countKey="count" countLabel="røde"/></>}
          {tab==='cardpts'&&<>
            <div className="section-title" style={{marginTop:0}}>Flest kortpoint — spiller (gul=2, rød=5)</div>
            <StatList items={cards?.players} labelKey="player" subKey="team" countKey="pts" countLabel="kortpt."/>
            <div className="section-title">Hold</div>
            <StatList items={cards?.teams} labelKey="team" countKey="pts" countLabel="kortpt."/>
          </>}
          {tab==='attack'&&<><div className="section-title" style={{marginTop:0}}>Flest mål scoret — hold</div><StatList items={stats?.team_goals} labelKey="team" countKey="count" countLabel="mål"/></>}
          {tab==='defense'&&<><div className="section-title" style={{marginTop:0}}>Færrest mål lukket ind — hold</div><StatList items={[...(stats?.team_conceded||[])].sort((a,b)=>a.count-b.count)} labelKey="team" countKey="count" countLabel="mål ind"/></>}
        </div>
      </div>
    </div>
  )
}
