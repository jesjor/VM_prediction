import { useEffect, useState } from 'react'
import api from '../api'

export default function NavBadge() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const saved = localStorage.getItem('vm2026_participant')
    if (!saved) return
    let participantId
    try { participantId = JSON.parse(saved).participant?.id } catch { return }
    if (!participantId) return

    async function check() {
      try {
        const [matchRes, predRes] = await Promise.all([
          api.get('/matches'),
          api.get(`/participants/${participantId}/match-predictions`)
        ])
        const now = new Date()
        const predMap = {}
        predRes.data.forEach(p => { predMap[p.match_id] = true })
        const missing = matchRes.data.filter(m => {
          const lockTime = new Date(new Date(m.kickoff).getTime() - 15*60*1000)
          return m.status !== 'finished' && m.home_team && m.away_team &&
                 now < lockTime && !predMap[m.id]
        })
        setCount(missing.length)
      } catch {}
    }
    check()
    const t = setInterval(check, 120000)
    return () => clearInterval(t)
  }, [])

  if (count === 0) return null
  return (
    <span style={{
      position:'absolute', top:1, right:1,
      width:16, height:16, borderRadius:'50%',
      background:'var(--red)', color:'#fff',
      fontSize:10, fontWeight:700,
      display:'flex', alignItems:'center', justifyContent:'center',
    }}>{count > 9 ? '9+' : count}</span>
  )
}
