import { useEffect, useState } from 'react'
import api from '../api'

const norm = s => (s || '').trim().toLowerCase()

function calcMatchBreakdown(pred, match) {
  if (!match || match.status !== 'finished') return { pts: 0, breakdown: [] }
  if (!pred) return { pts: 0, breakdown: [{ cat: 'Ingen gæt afgivet', pts: 0, hit: false }] }
  let pts = 0
  const breakdown = []
  const actual = match.home_score > match.away_score ? '1' : match.away_score > match.home_score ? '2' : 'X'

  if (pred?.prediction === actual) {
    pts += 3; breakdown.push({ cat: `Kampresultat (${pred.prediction})`, pts: 3, hit: true })
  } else if (pred?.prediction) {
    breakdown.push({ cat: `Kampresultat (gættet ${pred.prediction}, blev ${actual})`, pts: 0, hit: false })
  } else {
    breakdown.push({ cat: 'Kampresultat — ikke gættet', pts: 0, hit: false })
  }

  const ehNorm = pred?.exact_home !== null && pred?.exact_home !== undefined ? parseInt(pred.exact_home) : (pred?.exact_away !== null && pred?.exact_away !== undefined ? 0 : null)
  const eaNorm = pred?.exact_away !== null && pred?.exact_away !== undefined ? parseInt(pred.exact_away) : (pred?.exact_home !== null && pred?.exact_home !== undefined ? 0 : null)
  if (ehNorm !== null && eaNorm !== null) {
    if (ehNorm === match.home_score && eaNorm === match.away_score) {
      pts += 3; breakdown.push({ cat: `Eksakt score ${match.home_score}-${match.away_score} ✓`, pts: 3, hit: true })
    } else {
      breakdown.push({ cat: `Eksakt score (gættet ${ehNorm}-${eaNorm}, blev ${match.home_score}-${match.away_score})`, pts: 0, hit: false })
    }
  }

  const evs = match.events || []
  const firstGoal = evs.find(e => e.event_type === 'goal' || e.event_type === 'own_goal')
  if (pred?.first_scorer_team === 'ingen') {
    if (!firstGoal) { pts += 3; breakdown.push({ cat: 'Ingen mål (0-0) ✓', pts: 3, hit: true }) }
    else breakdown.push({ cat: `Ingen mål (der var mål: ${firstGoal.player})`, pts: 0, hit: false })
  } else if (pred?.first_scorer_player) {
    const hit = firstGoal && norm(firstGoal.player) === norm(pred.first_scorer_player) && norm(firstGoal.team) === norm(pred.first_scorer_team)
    if (hit) { pts += 3; breakdown.push({ cat: `Første scorer: ${pred.first_scorer_player} ✓`, pts: 3, hit: true }) }
    else breakdown.push({ cat: `Scorer: gættet ${pred.first_scorer_player}, var ${firstGoal?.player || 'ingen'}`, pts: 0, hit: false })
  }

  if (pred?.match_mvp_player) {
    const hit = match.match_mvp_player && norm(match.match_mvp_player) === norm(pred.match_mvp_player)
    if (hit) { pts += 3; breakdown.push({ cat: `MVP: ${pred.match_mvp_player} ✓`, pts: 3, hit: true }) }
    else breakdown.push({ cat: `MVP: gættet ${pred.match_mvp_player}, var ${match.match_mvp_player || 'ikke sat'}`, pts: 0, hit: false })
  }

  return { pts, breakdown }
}

function fmt(iso) {
  return new Date(iso).toLocaleString('da-DK', { day: 'numeric', month: 'short', timeZone: 'Europe/Copenhagen' })
}

const COLORS = ['#3b82f6','#8b5cf6','#10b981','#f97316','#ec4899','#06b6d4']
const getColor = name => COLORS[name?.charCodeAt(0) % COLORS.length]
const initials = name => name?.trim().split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()

function MatchRow({ match, p1pts, p2pts, p1pred, p2pred, p1name, p2name }) {
  const [open, setOpen] = useState(false)
  const p1Result = calcMatchBreakdown(p1pred, match)
  const p2Result = calcMatchBreakdown(p2pred, match)
  const p1wins = p1pts > p2pts, p2wins = p2pts > p1pts, draw = p1pts === p2pts

  return (
    <div style={{ borderBottom: '1px solid var(--border)' }}>
      {/* Summary row — klik for detaljer */}
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 0', cursor: 'pointer', userSelect: 'none' }}
        onClick={() => setOpen(o => !o)}
      >
        {/* P1 points */}
        <div style={{ flex: 1, textAlign: 'right' }}>
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 22, fontWeight: 800, color: p1wins ? 'var(--green)' : draw && p1pts > 0 ? 'var(--gold)' : 'var(--text3)' }}>
            {p1pts} pt
          </div>
          {p1pred && (
            <div style={{ fontSize: 11, color: 'var(--text3)' }}>
              {p1pred.prediction || '—'}
              {p1pred.exact_home !== null && p1pred.exact_home !== undefined && ` · ${p1pred.exact_home}-${p1pred.exact_away ?? 0}`}
            </div>
          )}
        </div>

        {/* Match info center */}
        <div style={{ textAlign: 'center', minWidth: 120, flex: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 12, color: 'var(--text)' }}>
            {match.home_team} <span style={{ color: 'var(--gold)', fontFamily: "'Barlow Condensed',sans-serif", fontSize: 16 }}>{match.home_score}-{match.away_score}</span> {match.away_team}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>{fmt(match.kickoff)}</div>
          {p1wins && <div style={{ fontSize: 10, color: 'var(--green)', fontWeight: 700, marginTop: 1 }}>← {p1name} vandt</div>}
          {p2wins && <div style={{ fontSize: 10, color: 'var(--green)', fontWeight: 700, marginTop: 1 }}>{p2name} vandt →</div>}
          {draw && p1pts > 0 && <div style={{ fontSize: 10, color: 'var(--gold)', fontWeight: 700, marginTop: 1 }}>Uafgjort</div>}
        </div>

        {/* P2 points */}
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 22, fontWeight: 800, color: p2wins ? 'var(--green)' : draw && p2pts > 0 ? 'var(--gold)' : 'var(--text3)' }}>
            {p2pts} pt
          </div>
          {p2pred && (
            <div style={{ fontSize: 11, color: 'var(--text3)' }}>
              {p2pred.prediction || '—'}
              {p2pred.exact_home !== null && p2pred.exact_home !== undefined && ` · ${p2pred.exact_home}-${p2pred.exact_away ?? 0}`}
            </div>
          )}
        </div>

        <div style={{ color: 'var(--text3)', fontSize: 12, flexShrink: 0 }}>{open ? '▲' : '▼'}</div>
      </div>

      {/* Expanded breakdown */}
      {open && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 12, padding: '8px 0 12px', fontSize: 13 }}>
          {/* P1 breakdown */}
          <div style={{ background: 'var(--bg3)', borderRadius: 8, padding: '8px 10px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: getColor(p1name), marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>{p1name}</div>
            {p1Result.breakdown.length === 0
              ? <div style={{ color: 'var(--text3)', fontSize: 12 }}>Ingen gæt afgivet</div>
              : p1Result.breakdown.map((b, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, padding: '3px 0', color: b.hit ? 'var(--text)' : 'var(--text3)', fontSize: 12 }}>
                    <span>{b.hit ? '✅' : '❌'} {b.cat}</span>
                    <span style={{ color: b.hit ? 'var(--gold)' : 'var(--text3)', fontWeight: b.hit ? 700 : 400, flexShrink: 0 }}>{b.pts > 0 ? `+${b.pts}` : ''}</span>
                  </div>
                ))
            }
          </div>

          {/* Kampens begivenheder */}
          <div style={{ minWidth: 130, background: 'var(--bg3)', borderRadius: 8, padding: '8px 10px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Kamp</div>
            {(match.events || []).filter(e => e.event_type === 'goal' || e.event_type === 'own_goal' || e.event_type === 'yellow' || e.event_type === 'red').map((e, i) => (
              <div key={i} style={{ fontSize: 11, color: 'var(--text2)', padding: '2px 0', display: 'flex', gap: 4 }}>
                <span style={{ color: 'var(--text3)', minWidth: 24 }}>{e.minute}'</span>
                <span>{e.event_type === 'goal' ? '⚽' : e.event_type === 'own_goal' ? '🙈' : e.event_type === 'yellow' ? '🟡' : '🔴'}</span>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.player}</span>
              </div>
            ))}
            {match.match_mvp_player && (
              <div style={{ fontSize: 11, color: 'var(--gold)', marginTop: 4 }}>🌟 MVP: {match.match_mvp_player}</div>
            )}
            {(!match.events || match.events.length === 0) && !match.match_mvp_player && (
              <div style={{ fontSize: 11, color: 'var(--text3)' }}>Ingen begivenheder</div>
            )}
          </div>

          {/* P2 breakdown */}
          <div style={{ background: 'var(--bg3)', borderRadius: 8, padding: '8px 10px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: getColor(p2name), marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>{p2name}</div>
            {p2Result.breakdown.length === 0
              ? <div style={{ color: 'var(--text3)', fontSize: 12 }}>Ingen gæt afgivet</div>
              : p2Result.breakdown.map((b, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, padding: '3px 0', color: b.hit ? 'var(--text)' : 'var(--text3)', fontSize: 12 }}>
                    <span>{b.hit ? '✅' : '❌'} {b.cat}</span>
                    <span style={{ color: b.hit ? 'var(--gold)' : 'var(--text3)', fontWeight: b.hit ? 700 : 400, flexShrink: 0 }}>{b.pts > 0 ? `+${b.pts}` : ''}</span>
                  </div>
                ))
            }
          </div>
        </div>
      )}
    </div>
  )
}

export default function HeadToHead() {
  const [participants, setParticipants] = useState([])
  const [p1Id, setP1Id] = useState('')
  const [p2Id, setP2Id] = useState('')
  const [p1Data, setP1Data] = useState(null)
  const [p2Data, setP2Data] = useState(null)
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.get('/participants').then(r => setParticipants(r.data)).catch(() => {})
    api.get('/matches').then(r => setMatches(r.data)).catch(() => {})
  }, [])

  useEffect(() => {
    if (!p1Id || !p2Id) return
    setLoading(true)
    Promise.all([
      api.get(`/participants/${p1Id}/profile`),
      api.get(`/participants/${p2Id}/profile`),
    ]).then(([a, b]) => { setP1Data(a.data); setP2Data(b.data); setLoading(false) }).catch(() => setLoading(false))
  }, [p1Id, p2Id])

  const ready = p1Data && p2Data
  const finishedMatches = matches.filter(m => m.status === 'finished' && m.home_team && m.away_team)
  const p1PredMap = {}, p2PredMap = {}
  if (ready) {
    p1Data.matches.forEach(p => { p1PredMap[p.match_id] = p })
    p2Data.matches.forEach(p => { p2PredMap[p.match_id] = p })
  }

  const matchComparison = finishedMatches.map(m => {
    const p1r = calcMatchBreakdown(p1PredMap[m.id], m)
    const p2r = calcMatchBreakdown(p2PredMap[m.id], m)
    return { match: m, p1pts: p1r.pts, p2pts: p2r.pts, p1pred: p1PredMap[m.id], p2pred: p2PredMap[m.id] }
  })

  const p1matchTotal = matchComparison.reduce((s, r) => s + r.p1pts, 0)
  const p2matchTotal = matchComparison.reduce((s, r) => s + r.p2pts, 0)
  const p1wins = matchComparison.filter(r => r.p1pts > r.p2pts).length
  const p2wins = matchComparison.filter(r => r.p2pts > r.p1pts).length
  const draws = matchComparison.filter(r => r.p1pts === r.p2pts && (r.p1pts > 0 || r.p1pred || r.p2pred)).length

  const TOURN_CATS = ready ? [
    { label: 'VM Vinder', v1: p1Data.tournament?.country_1, v2: p2Data.tournament?.country_1 },
    { label: 'Topscorer Top 1', v1: p1Data.tournament?.topscorer_1_player, v2: p2Data.tournament?.topscorer_1_player },
    { label: 'Topscorer Top 2', v1: p1Data.tournament?.topscorer_2_player, v2: p2Data.tournament?.topscorer_2_player },
    { label: 'Assist Top 1', v1: p1Data.tournament?.assist_1_player, v2: p2Data.tournament?.assist_1_player },
    { label: 'Turneringsspiller', v1: p1Data.tournament?.tournament_player, v2: p2Data.tournament?.tournament_player },
    { label: 'Bedste spiller', v1: p1Data.dreamTeam?.best_player, v2: p2Data.dreamTeam?.best_player },
  ] : []

  const p1name = p1Data?.participant?.name || 'Deltager 1'
  const p2name = p2Data?.participant?.name || 'Deltager 2'

  return (
    <div>
      <div style={{ padding: '1.25rem 0 1rem' }}>
        <div className="page-title">⚔️ Head-to-Head</div>
        <div className="page-sub">Sammenlign to deltageres gæt — klik på en kamp for detaljer</div>
      </div>

      {/* Picker */}
      <div className="card">
        <div className="grid-2" style={{ gap: 12 }}>
          <div>
            <div className="form-label">Deltager 1</div>
            <select className="form-select" value={p1Id} onChange={e => setP1Id(e.target.value)}>
              <option value="">— Vælg —</option>
              {participants.filter(p => p.id.toString() !== p2Id).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <div className="form-label">Deltager 2</div>
            <select className="form-select" value={p2Id} onChange={e => setP2Id(e.target.value)}>
              <option value="">— Vælg —</option>
              {participants.filter(p => p.id.toString() !== p1Id).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {loading && <div className="spinner">Henter data...</div>}

      {ready && (
        <>
          {/* Score banner */}
          <div className="card" style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: getColor(p1name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Barlow Condensed',sans-serif", fontSize: 18, fontWeight: 700, margin: '0 auto 4px' }}>
                  {initials(p1name)}
                </div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{p1name}</div>
                <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 32, fontWeight: 800, color: p1matchTotal > p2matchTotal ? 'var(--green)' : 'var(--text2)' }}>{p1matchTotal}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)' }}>kamppoint</div>
              </div>
              <div style={{ textAlign: 'center', padding: '0 8px' }}>
                <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 4 }}>Kamp for kamp</div>
                <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 24, fontWeight: 800 }}>{p1wins} — {draws} — {p2wins}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)' }}>V - U - T</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: getColor(p2name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Barlow Condensed',sans-serif", fontSize: 18, fontWeight: 700, margin: '0 auto 4px' }}>
                  {initials(p2name)}
                </div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{p2name}</div>
                <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 32, fontWeight: 800, color: p2matchTotal > p1matchTotal ? 'var(--green)' : 'var(--text2)' }}>{p2matchTotal}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)' }}>kamppoint</div>
              </div>
            </div>
          </div>

          {/* Tournament comparison */}
          {TOURN_CATS.some(c => c.v1 || c.v2) && (
            <div className="card" style={{ marginBottom: 12 }}>
              <div className="section-title" style={{ marginTop: 0 }}>Turneringsgæt</div>
              <div style={{ display: 'flex', fontSize: 11, fontWeight: 700, color: 'var(--text3)', padding: '0 0 6px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ flex: 1, textAlign: 'right', paddingRight: 8 }}>{p1name}</div>
                <div style={{ width: 90, textAlign: 'center' }}>Kategori</div>
                <div style={{ flex: 1, paddingLeft: 8 }}>{p2name}</div>
              </div>
              {TOURN_CATS.filter(c => c.v1 || c.v2).map(cat => {
                const same = cat.v1 && cat.v2 && norm(cat.v1) === norm(cat.v2)
                return (
                  <div key={cat.label} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                    <div style={{ flex: 1, textAlign: 'right', color: 'var(--text2)' }}>{cat.v1 || '—'}</div>
                    <div style={{ width: 90, textAlign: 'center', fontSize: 11, fontWeight: 600, color: same ? 'var(--gold)' : 'var(--text3)' }}>
                      {same ? '⚡ Enige!' : cat.label}
                    </div>
                    <div style={{ flex: 1, color: 'var(--text2)' }}>{cat.v2 || '—'}</div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Match by match — med klik-expand */}
          {matchComparison.length > 0 && (
            <div className="card">
              <div style={{ display: 'flex', fontSize: 12, fontWeight: 600, color: 'var(--text3)', padding: '0 0 8px', borderBottom: '1px solid var(--border)', marginBottom: 4 }}>
                <div style={{ flex: 1, textAlign: 'right', paddingRight: 8 }}>{p1name}</div>
                <div style={{ minWidth: 130, textAlign: 'center' }}>Kamp</div>
                <div style={{ flex: 1, paddingLeft: 8 }}>{p2name}</div>
                <div style={{ width: 20 }}></div>
              </div>
              {matchComparison.map(({ match, p1pts, p2pts, p1pred, p2pred }) => (
                <MatchRow
                  key={match.id}
                  match={match}
                  p1pts={p1pts} p2pts={p2pts}
                  p1pred={p1pred} p2pred={p2pred}
                  p1name={p1name} p2name={p2name}
                />
              ))}
            </div>
          )}

          {matchComparison.length === 0 && (
            <div className="card empty">Ingen afsluttede kampe endnu.</div>
          )}
        </>
      )}
    </div>
  )
}
