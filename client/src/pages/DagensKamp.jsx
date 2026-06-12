import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'

const ROUND_LABELS = { GROUP:'Gruppespil', R32:'Runde af 32', R16:'Runde af 16', QF:'Kvartfinale', SF:'Semifinale', '3RD':'3. plads', FINAL:'FINALE' }

function useCountdown(kickoff) {
  const [text, setText] = useState('')
  const [urgent, setUrgent] = useState(false)
  useEffect(() => {
    const lockTime = new Date(new Date(kickoff).getTime() - 15*60*1000)
    const kick = new Date(kickoff)
    function update() {
      const now = new Date()
      const diffToKick = kick - now
      const diffToLock = lockTime - now
      if (diffToKick <= 0) { setText('I gang!'); setUrgent(true); return }
      const h = Math.floor(diffToKick/3600000)
      const m = Math.floor((diffToKick%3600000)/60000)
      const s = Math.floor((diffToKick%60000)/1000)
      if (h > 48) setText(`${Math.floor(h/24)} dage`)
      else if (h > 0) setText(`${h}t ${m}m`)
      else if (m > 0) setText(`${m}m ${s}s`)
      else setText(`${s}s`)
      setUrgent(diffToLock <= 0)
    }
    update()
    const t = setInterval(update, 1000)
    return () => clearInterval(t)
  }, [kickoff])
  return { text, urgent }
}

function MatchBanner({ match, isNext }) {
  const navigate = useNavigate()
  const { text: countdown, urgent } = useCountdown(match.kickoff)
  const gc = match.guess_counts || {}
  const locked = new Date() > new Date(new Date(match.kickoff).getTime() - 15*60*1000)
  const live = match.status === 'live'

  function fmtDate(iso) {
    return new Date(iso).toLocaleString('da-DK', { weekday:'long', day:'numeric', month:'long', hour:'2-digit', minute:'2-digit', timeZone:'Europe/Copenhagen' })
  }

  return (
    <div style={{
      background: isNext ? 'linear-gradient(135deg, rgba(59,130,246,.12) 0%, rgba(139,92,246,.08) 100%)' : 'var(--bg2)',
      border: `1px solid ${isNext ? 'rgba(59,130,246,.35)' : 'var(--border)'}`,
      borderRadius: 12, padding: '1rem', marginBottom: 8,
    }}>
      {isNext && (
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
          <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:12, fontWeight:700, letterSpacing:1, color:'var(--blue)', textTransform:'uppercase' }}>
            {live ? '🔴 LIVE' : '⚽ Næste kamp'}
          </span>
          <span className={`badge ${urgent ? 'badge-red' : 'badge-blue'}`}>{countdown}</span>
          {!locked && <span style={{fontSize:12,color:'var(--text3)'}}>· gæt lukker om {countdown}</span>}
          {locked && <span className="badge badge-red">🔒 Låst</span>}
        </div>
      )}

      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:8 }}>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
            <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize: isNext ? 24 : 18, fontWeight:800 }}>{match.home_team}</span>
            <span style={{ fontSize:14, color:'var(--text3)', fontWeight:500 }}>vs</span>
            <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize: isNext ? 24 : 18, fontWeight:800 }}>{match.away_team}</span>
          </div>
          <div style={{ fontSize:12, color:'var(--text3)', marginTop:3 }}>
            🕐 {fmtDate(match.kickoff)}
          </div>
          <div style={{ fontSize:12, color:'var(--text3)' }}>
            📍 {match.stadium_name} · {match.stadium_city}
            {match.stadium_capacity && <> · {match.stadium_capacity.toLocaleString()} pladser</>}
          </div>
        </div>
        {!isNext && (
          <div style={{ textAlign:'right', flexShrink:0 }}>
            <div style={{ fontSize:12, color:'var(--text3)' }}>{countdown}</div>
          </div>
        )}
      </div>

      {/* Guess distribution */}
      {gc.total > 0 && (
        <div style={{ marginBottom: isNext ? 10 : 0 }}>
          <div style={{ fontSize:11, color:'var(--text3)', marginBottom:5, fontWeight:600, letterSpacing:.5, textTransform:'uppercase' }}>
            {gc.total} gæt afgivet
          </div>
          <div style={{ display:'flex', gap:4 }}>
            {[['1', match.home_team, 'var(--blue)'], ['X','Uafgjort','var(--text3)'], ['2', match.away_team, 'var(--green)']].map(([v, label, color]) => {
              const count = gc[v]||0, pct = Math.round((count/gc.total)*100)
              return (
                <div key={v} style={{ flex:1, background:'var(--bg3)', borderRadius:6, padding:'6px 4px', textAlign:'center' }}>
                  <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:18, fontWeight:800, color }}>{v}</div>
                  <div style={{ background:'var(--border)', borderRadius:3, height:3, overflow:'hidden', margin:'3px 0' }}>
                    <div style={{ width:`${pct}%`, height:'100%', background:color, transition:'width .5s' }}/>
                  </div>
                  <div style={{ fontSize:11, fontWeight:600, color:'var(--text2)' }}>{pct}%</div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {isNext && !locked && (
        <button className="btn btn-primary btn-sm" style={{ marginTop:4 }} onClick={() => navigate('/kampe')}>
          ⚽ Afgiv gæt
        </button>
      )}
    </div>
  )
}

export default function DagensKamp() {
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/matches/stats/next').then(r => { setMatches(r.data); setLoading(false) }).catch(() => setLoading(false))
    const t = setInterval(() => api.get('/matches/stats/next').then(r => setMatches(r.data)).catch(()=>{}), 30000)
    return () => clearInterval(t)
  }, [])

  if (loading || matches.length === 0) return null

  return (
    <div style={{ marginBottom:'1rem' }}>
      <div className="section-title" style={{ marginTop:0 }}>Kommende kampe</div>
      {matches.map((m, i) => <MatchBanner key={m.id} match={m} isNext={i===0} />)}
    </div>
  )
}
