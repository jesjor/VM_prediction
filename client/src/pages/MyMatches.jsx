import { useEffect, useState } from 'react'
import api from '../api'

function fmt(iso) {
  return new Date(iso).toLocaleString('da-DK', {
    weekday: 'short', day: 'numeric', month: 'short',
    hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Copenhagen'
  })
}

const norm = s => (s || '').trim().toLowerCase()

function calcMatchPts(pred, match) {
  if (!match || match.status !== 'finished') return { pts: 0, breakdown: [] }
  let pts = 0
  const breakdown = []

  let actual = null
  if (match.home_score !== null && match.away_score !== null) {
    actual = match.home_score > match.away_score ? '1' : match.away_score > match.home_score ? '2' : 'X'
  }
  if (actual && pred.prediction === actual) {
    pts += 3; breakdown.push({ cat: 'Kampresultat', pts: 3, hit: true })
  } else if (pred.prediction) {
    breakdown.push({ cat: `Kampresultat (gættet ${pred.prediction}, blev ${actual||'?'})`, pts: 0, hit: false })
  }

  // Eksakt score
  if (pred.exact_home !== null && pred.exact_home !== undefined &&
      pred.exact_away !== null && pred.exact_away !== undefined &&
      match.home_score !== null) {
    if (parseInt(pred.exact_home) === match.home_score && parseInt(pred.exact_away) === match.away_score) {
      pts += 3; breakdown.push({ cat: `Eksakt score ${match.home_score}-${match.away_score} ✓`, pts: 3, hit: true })
    } else {
      breakdown.push({ cat: `Eksakt score (gættet ${pred.exact_home}-${pred.exact_away}, blev ${match.home_score}-${match.away_score})`, pts: 0, hit: false })
    }
  }

  const evs = match.events || []
  const firstGoal = evs.find(e => e.event_type === 'goal' || e.event_type === 'own_goal')
  if (pred.first_scorer_team === 'ingen') {
    if (!firstGoal) { pts += 3; breakdown.push({ cat: 'Ingen målscorer ✓', pts: 3, hit: true }) }
    else breakdown.push({ cat: 'Ingen målscorer (der var mål)', pts: 0, hit: false })
  } else if (pred.first_scorer_player) {
    if (firstGoal && norm(firstGoal.player) === norm(pred.first_scorer_player) && norm(firstGoal.team) === norm(pred.first_scorer_team)) {
      pts += 3; breakdown.push({ cat: `Første målscorer: ${pred.first_scorer_player} ✓`, pts: 3, hit: true })
    } else {
      const actual1st = firstGoal ? `${firstGoal.player} (${firstGoal.team})` : 'ingen mål'
      breakdown.push({ cat: `Første målscorer: gættet ${pred.first_scorer_player}, var ${actual1st}`, pts: 0, hit: false })
    }
  }

  if (pred.match_mvp_player) {
    if (match.match_mvp_player && norm(match.match_mvp_player) === norm(pred.match_mvp_player)) {
      pts += 3; breakdown.push({ cat: `MVP: ${pred.match_mvp_player} ✓`, pts: 3, hit: true })
    } else {
      breakdown.push({ cat: `MVP: gættet ${pred.match_mvp_player}, var ${match.match_mvp_player || 'ikke sat'}`, pts: 0, hit: false })
    }
  }

  return { pts, breakdown }
}

function MatchPredCard({ match, pred }) {
  const [open, setOpen] = useState(false)
  const { pts, breakdown } = calcMatchPts(pred, match)
  const finished = match.status === 'finished'
  const locked = new Date() > new Date(new Date(match.kickoff).getTime() - 15 * 60 * 1000)

  return (
    <div
      className={`match-card${finished ? ' finished' : ''}`}
      style={{ cursor: 'pointer', marginBottom: 8 }}
      onClick={() => setOpen(o => !o)}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 14 }}>
            {match.home_team || '?'} vs {match.away_team || '?'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>
            {fmt(match.kickoff)} · {match.stadium_city}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
          {finished && (
            <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 20, fontWeight: 800, color: 'var(--gold)' }}>
              {match.home_score}-{match.away_score}
            </span>
          )}
          {pred ? (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: finished ? 22 : 16, fontWeight: 800, color: finished ? (pts > 0 ? 'var(--green)' : 'var(--text3)') : 'var(--text2)' }}>
                {finished ? `${pts} pt` : pred.prediction || '—'}
              </div>
              {!finished && pred.prediction && <div style={{ fontSize: 11, color: 'var(--text3)' }}>gættet</div>}
            </div>
          ) : (
            !locked && <span className="badge badge-warn" style={{ fontSize: 11 }}>Ikke gættet</span>
          )}
        </div>
      </div>

      {open && (
        <div style={{ marginTop: 10, borderTop: '1px solid var(--border)', paddingTop: 10 }}>
          {pred ? (
            <>
              <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 6 }}>
                Dit gæt: <strong style={{ color: 'var(--text)' }}>{pred.prediction || '—'}</strong>
                {pred.first_scorer_player && <> · Scorer: <strong>{pred.first_scorer_player}</strong></>}
                {pred.first_scorer_team === 'ingen' && <> · Ingen målscorer</>}
                {pred.match_mvp_player && <> · MVP: <strong>{pred.match_mvp_player}</strong></>}
              </div>
              {breakdown.map((b, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '3px 0', color: b.hit ? 'var(--text)' : 'var(--text3)' }}>
                  <span>{b.hit ? '✅' : '❌'} {b.cat}</span>
                  <span style={{ color: b.hit ? 'var(--gold)' : 'var(--text3)', fontWeight: b.hit ? 700 : 400 }}>
                    {b.pts > 0 ? `+${b.pts}` : '0'}
                  </span>
                </div>
              ))}
            </>
          ) : (
            <div style={{ fontSize: 13, color: 'var(--text3)' }}>
              {locked ? 'Gæt var låst inden du afgav det.' : 'Du har ikke gættet på denne kamp endnu.'}
            </div>
          )}

          {/* Match events */}
          {finished && match.events?.length > 0 && (
            <div style={{ marginTop: 8, borderTop: '1px solid var(--border)', paddingTop: 8 }}>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4, fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Kampbegivenheder</div>
              {match.events.map((e, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, fontSize: 13, color: 'var(--text2)', padding: '2px 0' }}>
                  <span style={{ color: 'var(--text3)', minWidth: 28 }}>{e.minute}'</span>
                  <span>
                    {e.event_type === 'goal' && '⚽'}
                    {e.event_type === 'own_goal' && '🙈'}
                    {e.event_type === 'yellow' && '🟡'}
                    {e.event_type === 'red' && '🔴'}
                    {e.event_type === 'yellow_red' && '🟡🔴'}
                  </span>
                  <span>{e.player} <span style={{ color: 'var(--text3)' }}>({e.team})</span></span>
                  {e.assist_player && <span style={{ color: 'var(--text3)' }}>· 🎯 {e.assist_player}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function MyMatches({ participantId }) {
  const [matches, setMatches] = useState([])
  const [preds, setPreds] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    Promise.all([
      api.get('/matches'),
      api.get(`/participants/${participantId}/match-predictions`)
    ]).then(([m, p]) => {
      setMatches(m.data)
      setPreds(p.data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [participantId])

  if (loading) return <div className="spinner">Henter kampe...</div>

  const predMap = {}
  preds.forEach(p => { predMap[p.match_id] = p })

  // Only show matches with known teams (or finished)
  let display = matches.filter(m => m.home_team && m.away_team)
  if (filter === 'finished') display = display.filter(m => m.status === 'finished')
  else if (filter === 'predicted') display = display.filter(m => predMap[m.id])
  else if (filter === 'missing') display = display.filter(m => {
    const lock = new Date(new Date(m.kickoff).getTime() - 15 * 60 * 1000)
    return !predMap[m.id] && new Date() < lock
  })

  const totalMatchPts = matches.reduce((sum, m) => {
    const pred = predMap[m.id]
    if (!pred || m.status !== 'finished') return sum
    return sum + calcMatchPts(pred, m).pts
  }, 0)

  const finishedWithPred = matches.filter(m => m.status === 'finished' && predMap[m.id]).length
  const totalPossible = finishedWithPred * 12

  return (
    <div>
      {/* Summary */}
      <div className="card" style={{ marginBottom: 12, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ textAlign: 'center', flex: 1 }}>
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 32, fontWeight: 800, color: 'var(--gold)' }}>{totalMatchPts}</div>
          <div style={{ fontSize: 12, color: 'var(--text3)' }}>kamppoint i alt</div>
        </div>
        <div style={{ textAlign: 'center', flex: 1 }}>
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 32, fontWeight: 800, color: 'var(--text2)' }}>{finishedWithPred}</div>
          <div style={{ fontSize: 12, color: 'var(--text3)' }}>kampe gættet</div>
        </div>
        <div style={{ textAlign: 'center', flex: 1 }}>
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 32, fontWeight: 800, color: 'var(--blue)' }}>
            {totalPossible > 0 ? Math.round((totalMatchPts / totalPossible) * 100) : 0}%
          </div>
          <div style={{ fontSize: 12, color: 'var(--text3)' }}>hit rate</div>
        </div>
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 12, flexWrap: 'wrap' }}>
        {[['all', 'Alle'], ['finished', 'Spillet'], ['predicted', 'Gættet'], ['missing', 'Mangler gæt']].map(([v, l]) => (
          <button key={v} className={`btn btn-sm${filter === v ? ' btn-primary' : ''}`} onClick={() => setFilter(v)}>{l}</button>
        ))}
      </div>

      {display.length === 0
        ? <div className="empty">Ingen kampe i denne visning.</div>
        : display.map(m => <MatchPredCard key={m.id} match={m} pred={predMap[m.id]} />)
      }
    </div>
  )
}
