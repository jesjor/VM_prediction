import { useEffect, useState } from 'react'
import api from '../api'

const ROUND_LABELS = { R32: 'Runde af 32', R16: 'Runde af 16', QF: 'Kvartfinale', SF: 'Semifinale', '3RD': '3. plads', FINAL: 'FINALE' }

function fmt(iso) {
  return new Date(iso).toLocaleString('da-DK', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Copenhagen' })
}

function MatchBox({ match, highlight }) {
  if (!match) return null
  const home = match.home_team || match.home_slot || '?'
  const away = match.away_team || match.away_slot || '?'
  const finished = match.status === 'finished'
  const unknown = home === '?' || home.startsWith('W-') || home.startsWith('R-') || home.startsWith('B3-')

  return (
    <div style={{
      background: highlight ? 'rgba(245,197,24,.08)' : 'var(--bg2)',
      border: `1px solid ${highlight ? 'rgba(245,197,24,.4)' : 'var(--border)'}`,
      borderRadius: 8, padding: '8px 10px', minWidth: 180, maxWidth: 220,
    }}>
      {[home, away].map((team, i) => {
        const isWinner = finished && match.winner === team
        return (
          <div key={i} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '4px 0', borderBottom: i === 0 ? '1px solid var(--border)' : 'none',
            opacity: unknown ? 0.5 : 1,
          }}>
            <span style={{ fontSize: 13, fontWeight: isWinner ? 700 : 400, color: isWinner ? 'var(--text)' : 'var(--text2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
              {isWinner && '✓ '}{team}
            </span>
            {finished && (
              <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 18, fontWeight: 800, color: isWinner ? 'var(--gold)' : 'var(--text3)', marginLeft: 8, flexShrink: 0 }}>
                {i === 0 ? match.home_score : match.away_score}
              </span>
            )}
          </div>
        )
      })}
      <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 4 }}>{fmt(match.kickoff)}</div>
    </div>
  )
}

function RoundColumn({ title, matches, highlightFinal }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 200 }}>
      <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13, fontWeight: 700, letterSpacing: 1, color: 'var(--text3)', textTransform: 'uppercase', textAlign: 'center', marginBottom: 4 }}>
        {title}
      </div>
      {matches.map(m => <MatchBox key={m.id} match={m} highlight={highlightFinal && m.round === 'FINAL'} />)}
    </div>
  )
}

export default function Bracket() {
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/matches').then(r => { setMatches(r.data); setLoading(false) }).catch(() => setLoading(false))
    const t = setInterval(() => api.get('/matches').then(r => setMatches(r.data)).catch(() => {}), 60000)
    return () => clearInterval(t)
  }, [])

  if (loading) return <div className="spinner">Henter bracket...</div>

  const byRound = round => matches.filter(m => m.round === round).sort((a, b) => a.id - b.id)

  const r32 = byRound('R32')
  const r16 = byRound('R16')
  const qf = byRound('QF')
  const sf = byRound('SF')
  const third = byRound('3RD')
  const final_ = byRound('FINAL')

  const hasAnyResults = matches.some(m => m.round !== 'GROUP' && m.status === 'finished')

  return (
    <div>
      <div style={{ padding: '1.25rem 0 1rem' }}>
        <div className="page-title">🏆 Knockout Bracket</div>
        <div className="page-sub">Opdateres automatisk efter hvert resultat</div>
      </div>

      {!hasAnyResults && (
        <div className="card empty">
          Bracketten udfyldes automatisk når gruppespillet er færdigt og knockout-kampe begynder.
        </div>
      )}

      {/* Final prominent display */}
      {final_.length > 0 && (
        <div className="card" style={{ marginBottom: 12, borderColor: 'rgba(245,197,24,.4)', background: 'rgba(245,197,24,.04)', textAlign: 'center' }}>
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14, fontWeight: 700, color: 'var(--gold)', letterSpacing: 1, marginBottom: 8 }}>🏆 FINALE — MetLife Stadium, New Jersey · 19. juli</div>
          <div style={{ display: 'inline-block' }}><MatchBox match={final_[0]} highlight /></div>
        </div>
      )}

      {/* Scrollable bracket */}
      <div style={{ overflowX: 'auto', paddingBottom: 12 }}>
        <div style={{ display: 'flex', gap: 16, minWidth: 'max-content', padding: '4px 2px' }}>
          {r32.length > 0 && <RoundColumn title="Runde af 32" matches={r32} />}
          {r16.length > 0 && <RoundColumn title="Runde af 16" matches={r16} />}
          {qf.length > 0 && <RoundColumn title="Kvartfinale" matches={qf} />}
          {sf.length > 0 && <RoundColumn title="Semifinale" matches={sf} />}
          {final_.length > 0 && <RoundColumn title="Finale" matches={final_} highlightFinal />}
        </div>
      </div>

      {/* 3rd place */}
      {third.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <div className="section-title">3. plads kamp</div>
          <MatchBox match={third[0]} />
        </div>
      )}

      <div className="alert alert-info" style={{ marginTop: 12, fontSize: 13 }}>
        Hold fyldes automatisk ind i takt med at gruppespillet og knockout-kampene afsluttes. Admin kan altid rette manuelt.
      </div>
    </div>
  )
}
