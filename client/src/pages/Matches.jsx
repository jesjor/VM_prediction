import { useEffect, useState } from 'react'
import api from '../api'

const ROUND_LABELS = {
  GROUP: 'Gruppespil', R32: 'Runde af 32', R16: 'Runde af 16',
  QF: 'Kvartfinale', SF: 'Semifinale', '3RD': '3. plads', FINAL: 'FINALE'
}
const GROUP_ORDER = ['A','B','C','D','E','F','G','H','I','J','K','L']

function formatTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleString('da-DK', {
    weekday:'short', month:'short', day:'numeric',
    hour:'2-digit', minute:'2-digit', timeZone:'Europe/Copenhagen'
  }) + ' DK-tid'
}

function MatchCard({ match }) {
  const [open, setOpen] = useState(false)
  const home = match.home_team || match.home_slot || '?'
  const away = match.away_team || match.away_slot || '?'
  const finished = match.status === 'finished'
  const live = match.status === 'live'

  return (
    <div className={`match-card${finished?' finished':live?' live':''}`} onClick={()=>setOpen(o=>!o)}>
      <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
        <div className="match-teams" style={{flex:1}}>
          <span>{home}</span>
          {finished || live
            ? <span className="match-score">{match.home_score ?? '–'} - {match.away_score ?? '–'}</span>
            : <span style={{color:'var(--text3)',fontSize:'14px'}}>vs</span>
          }
          <span>{away}</span>
        </div>
        {match.group_name && <span className="badge badge-gray">Gruppe {match.group_name}</span>}
        {live && <span className="badge badge-red">LIVE</span>}
        {finished && <span className="badge badge-green">Slut</span>}
      </div>
      <div className="match-meta">
        📍 {match.stadium_name} · {match.stadium_city} · {formatTime(match.kickoff)}
        {match.stadium_capacity && <> · {match.stadium_capacity.toLocaleString()} pladser</>}
      </div>

      {open && match.events && match.events.length > 0 && (
        <div style={{marginTop:'10px',borderTop:'1px solid var(--border)',paddingTop:'10px'}}>
          {match.events.map((e,i) => (
            <div key={i} style={{fontSize:'13px',color:'var(--text2)',display:'flex',gap:'8px',marginBottom:'3px'}}>
              <span style={{color:'var(--text3)',minWidth:'30px'}}>{e.minute}'</span>
              <span>
                {e.event_type==='goal' && '⚽'}
                {e.event_type==='own_goal' && '🙈'}
                {e.event_type==='assist' && '🎯'}
                {e.event_type==='yellow' && '🟡'}
                {e.event_type==='red' && '🔴'}
                {e.event_type==='yellow_red' && '🟡🔴'}
              </span>
              <span>{e.player}</span>
              <span style={{color:'var(--text3)'}}>({e.team})</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Matches() {
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    api.get('/matches').then(r => {
      setMatches(r.data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="spinner">Henter kampprogram...</div>

  const grouped = {}
  for (const m of matches) {
    const key = m.round === 'GROUP' ? `GROUP_${m.group_name}` : m.round
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(m)
  }

  const now = new Date()
  const upcoming = matches.filter(m => new Date(m.kickoff) > now && m.status !== 'finished')
  const finished = matches.filter(m => m.status === 'finished')

  let displayMatches = matches
  if (filter === 'upcoming') displayMatches = upcoming.slice(0, 20)
  else if (filter === 'finished') displayMatches = finished.slice(-20).reverse()

  // Group display matches
  const displayGrouped = {}
  for (const m of displayMatches) {
    const key = m.round === 'GROUP' ? `GROUP_${m.group_name}` : m.round
    if (!displayGrouped[key]) displayGrouped[key] = []
    displayGrouped[key].push(m)
  }

  const sortedKeys = Object.keys(displayGrouped).sort((a, b) => {
    if (a.startsWith('GROUP_') && b.startsWith('GROUP_')) {
      return GROUP_ORDER.indexOf(a.slice(6)) - GROUP_ORDER.indexOf(b.slice(6))
    }
    const order = ['GROUP','R32','R16','QF','SF','3RD','FINAL']
    const ra = a.startsWith('GROUP_') ? 'GROUP' : a
    const rb = b.startsWith('GROUP_') ? 'GROUP' : b
    return order.indexOf(ra) - order.indexOf(rb)
  })

  return (
    <div>
      <div className="page-header">
        <div className="page-title">📅 Kampprogrammet</div>
        <div className="page-sub">Alle 104 kampe · VM 2026 · USA, Mexico & Canada</div>
      </div>

      <div style={{display:'flex',gap:'8px',marginBottom:'1rem',flexWrap:'wrap'}}>
        <div style={{fontSize:'13px',color:'var(--text2)',display:'flex',alignItems:'center',gap:'4px'}}>
          <span className="badge badge-green">{finished.length}</span> spillet
          <span className="badge badge-gray" style={{marginLeft:'4px'}}>{upcoming.length}</span> kommende
        </div>
        <div style={{marginLeft:'auto',display:'flex',gap:'4px'}}>
          {[['all','Alle'],['upcoming','Kommende'],['finished','Spillet']].map(([v,l]) => (
            <button key={v} className={`btn btn-sm${filter===v?' btn-primary':''}`} onClick={()=>setFilter(v)}>{l}</button>
          ))}
        </div>
      </div>

      {sortedKeys.map(key => {
        const grp = displayGrouped[key]
        const isGroup = key.startsWith('GROUP_')
        const round = isGroup ? 'GROUP' : key
        const label = isGroup ? `Gruppe ${key.slice(6)}` : ROUND_LABELS[round] || round
        return (
          <div key={key} style={{marginBottom:'1rem'}}>
            <div className="section-title">{label}</div>
            {grp.map(m => <MatchCard key={m.id} match={m} />)}
          </div>
        )
      })}
    </div>
  )
}
