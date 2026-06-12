import { useEffect, useState } from 'react'
import api from '../api'

export default function Consensus() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/participants/consensus/tournament')
      .then(r => { setData(r.data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="spinner">Henter...</div>
  if (!data || data.total === 0) return (
    <div className="card empty">Ingen turneringsgæt afgivet endnu.</div>
  )

  return (
    <div>
      <div style={{ fontSize:13, color:'var(--text2)', marginBottom:'1rem' }}>
        Baseret på <strong>{data.total}</strong> deltageres turneringsgæt.
      </div>
      {data.items.map(item => (
        <div key={item.cat} style={{ marginBottom:10, background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:10, padding:'12px 14px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8 }}>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:12, color:'var(--text3)', fontWeight:600, letterSpacing:.5, textTransform:'uppercase', marginBottom:3 }}>{item.cat}</div>
              <div style={{ fontWeight:700, fontSize:16 }}>{item.top}</div>
              {item.others?.length > 0 && (
                <div style={{ fontSize:12, color:'var(--text3)', marginTop:2 }}>
                  Også: {item.others.map(o => `${o.v} (${o.c})`).join(', ')}
                </div>
              )}
            </div>
            <div style={{ textAlign:'right', flexShrink:0 }}>
              <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:28, fontWeight:800, color: item.pct >= 70 ? 'var(--green)' : item.pct >= 50 ? 'var(--gold)' : 'var(--text2)' }}>
                {item.pct}%
              </div>
              <div style={{ fontSize:11, color:'var(--text3)' }}>{item.count} af {item.total}</div>
            </div>
          </div>
          <div style={{ marginTop:8, background:'var(--border)', borderRadius:4, height:4, overflow:'hidden' }}>
            <div style={{ width:`${item.pct}%`, height:'100%', background: item.pct >= 70 ? 'var(--green)' : item.pct >= 50 ? 'var(--gold)' : 'var(--blue)', transition:'width .5s' }}/>
          </div>
        </div>
      ))}
    </div>
  )
}
