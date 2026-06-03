import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api'

const GROUPS = ['A','B','C','D','E','F','G','H','I','J','K','L']

function Row({ label, value, pts }) {
  if (!value) return null
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid var(--border)', fontSize: 14 }}>
      <span style={{ color: 'var(--text2)' }}>{label}</span>
      <div style={{ textAlign: 'right' }}>
        <span style={{ fontWeight: 600, color: 'var(--text)' }}>{value}</span>
        {pts && <span style={{ fontSize: 12, color: 'var(--text3)', marginLeft: 6 }}>{pts}</span>}
      </div>
    </div>
  )
}

function fmt(iso) {
  return new Date(iso).toLocaleString('da-DK', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Copenhagen' })
}

export default function Profile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('tournament')

  useEffect(() => {
    Promise.all([
      api.get(`/participants/${id}/profile`),
      api.get('/matches'),
    ]).then(([p, m]) => {
      setData(p.data)
      setMatches(m.data)
      setLoading(false)
    }).catch(() => { setLoading(false); navigate('/') })
  }, [id])

  if (loading) return <div className="spinner">Henter profil...</div>
  if (!data) return null

  const { participant, tournament: t, matches: preds, dreamTeam } = data
  const predMap = {}
  preds.forEach(p => { predMap[p.match_id] = p })

  const initials = name => name.trim().split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f97316', '#ec4899', '#06b6d4']
  const color = COLORS[participant.name.charCodeAt(0) % COLORS.length]

  return (
    <div>
      {/* Header */}
      <div style={{ padding: '1.25rem 0 1rem', display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 52, height: 52, borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Barlow Condensed',sans-serif", fontSize: 20, fontWeight: 700, flexShrink: 0 }}>
          {initials(participant.name)}
        </div>
        <div>
          <div className="page-title" style={{ fontSize: 'clamp(22px,5vw,32px)' }}>{participant.name}</div>
          <div className="page-sub">Alle gæt er offentlige</div>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab-btn${tab === 'tournament' ? ' active' : ''}`} onClick={() => setTab('tournament')}>🏆 Turneringsgæt</button>
        <button className={`tab-btn${tab === 'matches' ? ' active' : ''}`} onClick={() => setTab('matches')}>⚽ Kampgæt</button>
        <button className={`tab-btn${tab === 'dreamteam' ? ' active' : ''}`} onClick={() => setTab('dreamteam')}>🌟 VM Hold</button>
      </div>

      {tab === 'tournament' && (
        <div>
          {!t ? (
            <div className="card empty">Ingen turneringsgæt afgivet endnu.</div>
          ) : (
            <>
              <div className="card">
                <div className="section-title" style={{ marginTop: 0 }}>🏅 Top 3 Topscorer</div>
                <Row label="Top 1 (20 pt)" value={t.topscorer_1_player} pts={t.topscorer_1_team ? `(${t.topscorer_1_team})` : ''} />
                <Row label="Top 2 (15 pt)" value={t.topscorer_2_player} pts={t.topscorer_2_team ? `(${t.topscorer_2_team})` : ''} />
                <Row label="Top 3 (10 pt)" value={t.topscorer_3_player} pts={t.topscorer_3_team ? `(${t.topscorer_3_team})` : ''} />
                <div className="section-title">🎯 Top 3 Assists</div>
                <Row label="Top 1 (20 pt)" value={t.assist_1_player} pts={t.assist_1_team ? `(${t.assist_1_team})` : ''} />
                <Row label="Top 2 (15 pt)" value={t.assist_2_player} pts={t.assist_2_team ? `(${t.assist_2_team})` : ''} />
                <Row label="Top 3 (10 pt)" value={t.assist_3_player} pts={t.assist_3_team ? `(${t.assist_3_team})` : ''} />
                <div className="section-title">🌍 VM Slutstilling</div>
                <Row label="VM Vinder (20 pt)" value={t.country_1} />
                <Row label="Top 2 (15 pt)" value={t.country_2} />
                <Row label="Top 3 (10 pt)" value={t.country_3} />
              </div>

              <div className="card">
                <div className="section-title" style={{ marginTop: 0 }}>🏆 Gruppegæt</div>
                <div className="grid-2">
                  {GROUPS.map(g => {
                    const w = t[`group_winner_${g.toLowerCase()}`]
                    const r = t[`group_runner_${g.toLowerCase()}`]
                    if (!w && !r) return null
                    return (
                      <div key={g} style={{ padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                        <span style={{ color: 'var(--text3)', marginRight: 6 }}>Gr. {g}</span>
                        {w && <span style={{ fontWeight: 600 }}>1. {w}</span>}
                        {r && <span style={{ color: 'var(--text2)' }}> · 2. {r}</span>}
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="card">
                <div className="section-title" style={{ marginTop: 0 }}>🃏 Øvrige gæt</div>
                <Row label="🟡 Flest gule (spiller) — 20 pt" value={t.most_yellow_player} pts={t.most_yellow_team ? `(${t.most_yellow_team})` : ''} />
                <Row label="🟡 Flest gule (hold)" value={t.most_yellow_team_overall} />
                <Row label="🔴 Flest røde (spiller) — 20 pt" value={t.most_red_player} pts={t.most_red_team ? `(${t.most_red_team})` : ''} />
                <Row label="🔴 Flest røde (hold)" value={t.most_red_team_overall} />
                <Row label="🃏 Flest kortpoint (spiller) — 20 pt" value={t.most_card_pts_player} pts={t.most_card_pts_player_team ? `(${t.most_card_pts_player_team})` : ''} />
                <Row label="🃏 Flest kortpoint (hold)" value={t.most_card_pts_team} />
                <Row label="⭐ Flest MVP" value={t.most_mvp_player} pts={t.most_mvp_team ? `(${t.most_mvp_team})` : ''} />
                <Row label="🌟 Turneringsspiller — 25 pt" value={t.tournament_player} pts={t.tournament_player_team ? `(${t.tournament_player_team})` : ''} />
                <Row label="🛡️ Færrest mål ind" value={t.least_goals_conceded} />
                <Row label="⚡ Flest mål scoret" value={t.most_goals_scored} />
              </div>
            </>
          )}
        </div>
      )}

      {tab === 'matches' && (
        <div>
          {preds.length === 0
            ? <div className="card empty">Ingen kampgæt afgivet endnu.</div>
            : matches.filter(m => predMap[m.id]).map(m => {
                const pred = predMap[m.id]
                return (
                  <div key={m.id} className={`match-card${m.status === 'finished' ? ' finished' : ''}`} style={{ marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{m.home_team || '?'} vs {m.away_team || '?'}</div>
                        <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>{fmt(m.kickoff)}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        {m.status === 'finished' && (
                          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 18, fontWeight: 800, color: 'var(--gold)' }}>
                            {m.home_score}-{m.away_score}
                          </div>
                        )}
                        <div style={{ fontSize: 13 }}>
                          <span className={`badge ${pred.prediction === '1' ? 'badge-blue' : pred.prediction === 'X' ? 'badge-gray' : 'badge-green'}`}>
                            {pred.prediction}
                          </span>
                          {pred.exact_home !== null && pred.exact_home !== undefined && (
                            <span className="badge badge-gold" style={{ marginLeft: 4 }}>
                              {pred.exact_home}-{pred.exact_away}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {(pred.first_scorer_player || pred.match_mvp_player) && (
                      <div style={{ marginTop: 6, fontSize: 12, color: 'var(--text3)', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                        {pred.first_scorer_player && <span>⚽ {pred.first_scorer_player} ({pred.first_scorer_team})</span>}
                        {pred.first_scorer_team === 'ingen' && <span>⚽ Ingen mål</span>}
                        {pred.match_mvp_player && <span>🌟 {pred.match_mvp_player}</span>}
                      </div>
                    )}
                  </div>
                )
              })
          }
        </div>
      )}

      {tab === 'dreamteam' && (
        <div>
          {!dreamTeam
            ? <div className="card empty">Ingen VM Hold-gæt afgivet endnu.</div>
            : <>
                <div className="card">
                  <div className="section-title" style={{ marginTop: 0 }}>VM Hold (11 spillere · 5 pt pr. rigtig)</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {(dreamTeam.players || []).map((p, i) => (
                      <span key={i} style={{ padding: '4px 10px', background: 'var(--bg3)', borderRadius: 6, fontSize: 13 }}>
                        {p.player} <span style={{ color: 'var(--text3)', fontSize: 11 }}>({p.team})</span>
                      </span>
                    ))}
                  </div>
                  {dreamTeam.best_player && (
                    <>
                      <div className="section-title">🌟 Bedste spiller (25 pt)</div>
                      <div style={{ fontWeight: 600, fontSize: 15 }}>
                        {dreamTeam.best_player}
                        {dreamTeam.best_player_team && <span style={{ color: 'var(--text3)', fontSize: 13, marginLeft: 6 }}>({dreamTeam.best_player_team})</span>}
                      </div>
                    </>
                  )}
                </div>
              </>
          }
        </div>
      )}
    </div>
  )
}
