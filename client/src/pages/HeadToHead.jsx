import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../api'

const norm = s => (s || '').trim().toLowerCase()

function calcMatchPts(pred, match) {
  if (!match || match.status !== 'finished') return 0
  let pts = 0
  const actual = match.home_score > match.away_score ? '1' : match.away_score > match.home_score ? '2' : 'X'
  if (pred?.prediction === actual) pts += 3
  if (pred?.exact_home !== null && pred?.exact_home !== undefined &&
      parseInt(pred.exact_home) === match.home_score && parseInt(pred.exact_away) === match.away_score) pts += 3
  const evs = match.events || []
  const firstGoal = evs.find(e => e.event_type === 'goal' || e.event_type === 'own_goal')
  if (pred?.first_scorer_team === 'ingen' && !firstGoal) pts += 3
  else if (pred?.first_scorer_player && firstGoal &&
    norm(firstGoal.player) === norm(pred.first_scorer_player) &&
    norm(firstGoal.team) === norm(pred.first_scorer_team)) pts += 3
  if (pred?.match_mvp_player && match.match_mvp_player &&
    norm(match.match_mvp_player) === norm(pred.match_mvp_player)) pts += 3
  return pts
}

function fmt(iso) {
  return new Date(iso).toLocaleString('da-DK', { day: 'numeric', month: 'short', timeZone: 'Europe/Copenhagen' })
}

const COLORS = ['#3b82f6','#8b5cf6','#10b981','#f97316','#ec4899','#06b6d4']
const getColor = name => COLORS[name?.charCodeAt(0) % COLORS.length]
const initials = name => name?.trim().split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()

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

  // Per-match comparison
  const finishedMatches = matches.filter(m => m.status === 'finished' && m.home_team && m.away_team)
  const p1PredMap = {}, p2PredMap = {}
  if (ready) {
    p1Data.matches.forEach(p => { p1PredMap[p.match_id] = p })
    p2Data.matches.forEach(p => { p2PredMap[p.match_id] = p })
  }

  const matchComparison = finishedMatches.map(m => ({
    match: m,
    p1pts: calcMatchPts(p1PredMap[m.id], m),
    p2pts: calcMatchPts(p2PredMap[m.id], m),
    p1pred: p1PredMap[m.id],
    p2pred: p2PredMap[m.id],
  }))

  const p1matchTotal = matchComparison.reduce((s, r) => s + r.p1pts, 0)
  const p2matchTotal = matchComparison.reduce((s, r) => s + r.p2pts, 0)
  const p1wins = matchComparison.filter(r => r.p1pts > r.p2pts).length
  const p2wins = matchComparison.filter(r => r.p2pts > r.p1pts).length
  const draws = matchComparison.filter(r => r.p1pts === r.p2pts && (r.p1pts > 0 || r.p1pred || r.p2pred)).length

  // Tournament comparison
  const TOURN_CATS = ready ? [
    { label: 'Topscorer Top 1', v1: p1Data.tournament?.topscorer_1_player, v2: p2Data.tournament?.topscorer_1_player },
    { label: 'Topscorer Top 2', v1: p1Data.tournament?.topscorer_2_player, v2: p2Data.tournament?.topscorer_2_player },
    { label: 'Topscorer Top 3', v1: p1Data.tournament?.topscorer_3_player, v2: p2Data.tournament?.topscorer_3_player },
    { label: 'Assist Top 1',    v1: p1Data.tournament?.assist_1_player,    v2: p2Data.tournament?.assist_1_player },
    { label: 'VM Vinder',       v1: p1Data.tournament?.country_1,          v2: p2Data.tournament?.country_1 },
    { label: 'Turneringsspiller', v1: p1Data.tournament?.tournament_player, v2: p2Data.tournament?.tournament_player },
  ] : []

  return (
    <div>
      <div style={{ padding: '1.25rem 0 1rem' }}>
        <div className="page-title">⚔️ Head-to-Head</div>
        <div className="page-sub">Sammenlign to deltageres gæt direkte</div>
      </div>

      <div className="card">
        <div className="grid-2" style={{ gap: 12 }}>
          <div>
            <div className="form-label">Deltager 1</div>
            <select className="form-select" value={p1Id} onChange={e => setP1Id(e.target.value)}>
              <option value="">— Vælg —</option>
              {participants.filter(p => p.id.toString() !== p2Id).map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <div className="form-label">Deltager 2</div>
            <select className="form-select" value={p2Id} onChange={e => setP2Id(e.target.value)}>
              <option value="">— Vælg —</option>
              {participants.filter(p => p.id.toString() !== p1Id).map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading && <div className="spinner">Henter data...</div>}

      {ready && (
        <>
          {/* Score banner */}
          <div className="card" style={{ textAlign: 'center', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: getColor(p1Data.participant.name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Barlow Condensed',sans-serif", fontSize: 18, fontWeight: 700, margin: '0 auto 4px' }}>
                  {initials(p1Data.participant.name)}
                </div>
                <div style={{ fontWeight: 600 }}>{p1Data.participant.name}</div>
                <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 32, fontWeight: 800, color: p1matchTotal > p2matchTotal ? 'var(--green)' : 'var(--text2)' }}>
                  {p1matchTotal}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text3)' }}>kamppoint</div>
              </div>

              <div style={{ textAlign: 'center', padding: '0 8px' }}>
                <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 4 }}>Kamp for kamp</div>
                <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 22, fontWeight: 800, color: 'var(--text)' }}>
                  {p1wins} — {draws} — {p2wins}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text3)' }}>V - U - T</div>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: getColor(p2Data.participant.name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Barlow Condensed',sans-serif", fontSize: 18, fontWeight: 700, margin: '0 auto 4px' }}>
                  {initials(p2Data.participant.name)}
                </div>
                <div style={{ fontWeight: 600 }}>{p2Data.participant.name}</div>
                <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 32, fontWeight: 800, color: p2matchTotal > p1matchTotal ? 'var(--green)' : 'var(--text2)' }}>
                  {p2matchTotal}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text3)' }}>kamppoint</div>
              </div>
            </div>
          </div>

          {/* Tournament predictions comparison */}
          {TOURN_CATS.some(c => c.v1 || c.v2) && (
            <div className="card" style={{ marginBottom: 12 }}>
              <div className="section-title" style={{ marginTop: 0 }}>Turneringsgæt sammenligning</div>
              {TOURN_CATS.filter(c => c.v1 || c.v2).map(cat => {
                const same = cat.v1 && cat.v2 && norm(cat.v1) === norm(cat.v2)
                return (
                  <div key={cat.label} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                    <div style={{ flex: 1, textAlign: 'right', color: 'var(--text2)' }}>{cat.v1 || '—'}</div>
                    <div style={{ width: 90, textAlign: 'center', color: 'var(--text3)', fontSize: 11, fontWeight: 600 }}>
                      {same ? <span style={{ color: 'var(--gold)' }}>⚡ Enige!</span> : cat.label}
                    </div>
                    <div style={{ flex: 1, color: 'var(--text2)' }}>{cat.v2 || '—'}</div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Match by match */}
          {matchComparison.length > 0 && (
            <div className="card">
              <div className="section-title" style={{ marginTop: 0 }}>Kamp for kamp</div>
              {matchComparison.map(({ match, p1pts, p2pts, p1pred, p2pred }) => (
                <div key={match.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                  <div style={{ flex: 1, textAlign: 'right' }}>
                    <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 18, fontWeight: 800, color: p1pts > p2pts ? 'var(--green)' : p1pts < p2pts ? 'var(--red)' : 'var(--text3)' }}>{p1pts} pt</div>
                    <div style={{ color: 'var(--text3)', fontSize: 12 }}>{p1pred?.prediction || '—'}</div>
                  </div>
                  <div style={{ textAlign: 'center', minWidth: 110 }}>
                    <div style={{ fontWeight: 600, fontSize: 12 }}>{match.home_team} {match.home_score}-{match.away_score} {match.away_team}</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)' }}>{fmt(match.kickoff)}</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 18, fontWeight: 800, color: p2pts > p1pts ? 'var(--green)' : p2pts < p1pts ? 'var(--red)' : 'var(--text3)' }}>{p2pts} pt</div>
                    <div style={{ color: 'var(--text3)', fontSize: 12 }}>{p2pred?.prediction || '—'}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
