import { useEffect, useState } from 'react'
import api from '../api'

function StatList({ items, labelKey, subKey, countKey, countLabel, medal }) {
  if (!items || items.length === 0) return <p style={{ color: 'var(--text3)', fontSize: 14, padding: '8px 0' }}>Ingen data endnu.</p>
  const medals = ['🥇', '🥈', '🥉']
  return (
    <div>
      {items.slice(0, 10).map((item, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
          <div style={{ width: 28, textAlign: 'center', fontSize: i < 3 ? 18 : 14, color: 'var(--text3)', fontWeight: 700 }}>
            {i < 3 ? medals[i] : i + 1}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 14 }}>{item[labelKey]}</div>
            {subKey && item[subKey] && <div style={{ fontSize: 12, color: 'var(--text3)' }}>{item[subKey]}</div>}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 22, fontWeight: 800, color: 'var(--gold)' }}>
              {item[countKey]}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text3)' }}>{countLabel}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function Stats() {
  const [stats, setStats] = useState(null)
  const [cards, setCards] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('goals')

  useEffect(() => {
    Promise.all([
      api.get('/matches/stats/tournament'),
      api.get('/matches/stats/cards'),
    ]).then(([s, c]) => {
      setStats(s.data)
      setCards(c.data)
      setLoading(false)
    }).catch(() => setLoading(false))

    // Auto-refresh every 2 min
    const t = setInterval(() => {
      api.get('/matches/stats/tournament').then(r => setStats(r.data)).catch(() => {})
      api.get('/matches/stats/cards').then(r => setCards(r.data)).catch(() => {})
    }, 120000)
    return () => clearInterval(t)
  }, [])

  if (loading) return <div className="spinner">Henter statistik...</div>

  const tabs = [
    { id: 'goals',    label: '⚽ Topscorer' },
    { id: 'assists',  label: '🎯 Assists' },
    { id: 'yellow',   label: '🟡 Gule kort' },
    { id: 'red',      label: '🔴 Røde kort' },
    { id: 'cardpts',  label: '🃏 Kortpoint' },
    { id: 'attack',   label: '⚡ Flest mål' },
    { id: 'defense',  label: '🛡️ Færrest ind' },
  ]

  return (
    <div>
      <div style={{ padding: '1.25rem 0 1rem' }}>
        <div className="page-title">📊 Turneringsstatistik</div>
        <div className="page-sub">Live opdateret fra kampresultater</div>
      </div>

      {(!stats || (stats.topscorers?.length === 0 && stats.assists?.length === 0)) && (
        <div className="card empty">
          Statistik vises her når de første kampresultater er registreret.
        </div>
      )}

      <div className="tabs" style={{ overflowX: 'auto' }}>
        {tabs.map(t => (
          <button key={t.id} className={`tab-btn${tab === t.id ? ' active' : ''}`} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="card">
        {tab === 'goals' && (
          <>
            <div className="section-title" style={{ marginTop: 0 }}>Topscorer</div>
            <StatList items={stats?.topscorers} labelKey="player" subKey="team" countKey="count" countLabel="mål" />
          </>
        )}
        {tab === 'assists' && (
          <>
            <div className="section-title" style={{ marginTop: 0 }}>Flest assists</div>
            <StatList items={stats?.assists} labelKey="player" subKey="team" countKey="count" countLabel="assists" />
          </>
        )}
        {tab === 'yellow' && (
          <>
            <div className="section-title" style={{ marginTop: 0 }}>Flest gule kort — spiller</div>
            <StatList items={stats?.yellow_cards} labelKey="player" subKey="team" countKey="count" countLabel="gule" />
          </>
        )}
        {tab === 'red' && (
          <>
            <div className="section-title" style={{ marginTop: 0 }}>Flest røde kort — spiller</div>
            <StatList items={stats?.red_cards} labelKey="player" subKey="team" countKey="count" countLabel="røde" />
          </>
        )}
        {tab === 'cardpts' && (
          <>
            <div className="section-title" style={{ marginTop: 0 }}>Flest kortpoint — spiller (gul=2, rød=5)</div>
            <StatList items={cards?.players} labelKey="player" subKey="team" countKey="pts" countLabel="kortpt." />
            <div className="section-title">Hold</div>
            <StatList items={cards?.teams} labelKey="team" countKey="pts" countLabel="kortpt." />
          </>
        )}
        {tab === 'attack' && (
          <>
            <div className="section-title" style={{ marginTop: 0 }}>Flest mål scoret — hold</div>
            <StatList items={stats?.team_goals} labelKey="team" countKey="count" countLabel="mål" />
          </>
        )}
        {tab === 'defense' && (
          <>
            <div className="section-title" style={{ marginTop: 0 }}>Færrest mål lukket ind — hold</div>
            <StatList items={[...(stats?.team_conceded || [])].sort((a, b) => a.count - b.count)} labelKey="team" countKey="count" countLabel="mål ind" />
          </>
        )}
      </div>
    </div>
  )
}
