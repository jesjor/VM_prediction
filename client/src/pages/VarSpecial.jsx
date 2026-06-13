import { useEffect, useState } from 'react'
import api from '../api'

const LOCK_TIME = new Date('2026-06-15T21:00:00Z') // 15. juni kl. 23:00 dansk tid

function useCountdown(target) {
  const [text, setText] = useState('')
  useEffect(() => {
    function update() {
      const diff = target - new Date()
      if (diff <= 0) { setText('Låst'); return }
      const d = Math.floor(diff / 86400000)
      const h = Math.floor((diff % 86400000) / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      if (d > 0) setText(`${d}d ${h}t`)
      else if (h > 0) setText(`${h}t ${m}m`)
      else setText(`${m}m ${s}s`)
    }
    update()
    const t = setInterval(update, 1000)
    return () => clearInterval(t)
  }, [])
  return text
}

const CATS = [
  {
    key: 'var_penalties',
    emoji: '⚽',
    title: 'VAR Straffespark',
    desc: 'Hvor mange straffespark tildeles via VAR under hele VM 2026?',
    hint: 'Straffe der dømmes EFTER VAR-gennemgang tæller. Tip: VM 2022 i Qatar havde 5 VAR-straffe.',
    color: 'var(--blue)',
  },
  {
    key: 'var_red_cards',
    emoji: '🔴',
    title: 'VAR Røde Kort',
    desc: 'Hvor mange røde kort dømmes via VAR under hele VM 2026?',
    hint: 'Direkte røde kort og omgjorte gule → røde via VAR tæller. VM 2022 havde 3.',
    color: 'var(--red)',
  },
  {
    key: 'var_goals_disallowed',
    emoji: '🚫',
    title: 'VAR Annullerede Mål',
    desc: 'Hvor mange mål annulleres efter VAR-gennemgang under hele VM 2026?',
    hint: 'Offside og frispark der afsløres via VAR. VM 2022 havde 8 annullerede mål.',
    color: 'var(--gold)',
  },
]

function VarCatCard({ cat, value, onChange, locked, allGuesses }) {
  const countdown = useCountdown(LOCK_TIME)

  return (
    <div style={{
      background: 'var(--bg2)', border: `1px solid ${locked ? 'var(--border)' : cat.color + '44'}`,
      borderRadius: 12, padding: '1rem', marginBottom: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <span style={{ fontSize: 28 }}>{cat.emoji}</span>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{cat.title}</div>
          <div style={{ fontSize: 12, color: 'var(--text3)' }}>
            Nærmest vinder <span style={{ color: 'var(--gold)', fontWeight: 700 }}>30 pt</span> · 2. plads <span style={{ fontWeight: 700 }}>15 pt</span>
          </div>
        </div>
      </div>

      <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 8, lineHeight: 1.6 }}>{cat.desc}</p>
      <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 10, fontStyle: 'italic' }}>💡 {cat.hint}</p>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <input
          type="number" min="0" max="500"
          value={value ?? ''}
          onChange={e => onChange(e.target.value === '' ? null : parseInt(e.target.value))}
          disabled={locked}
          placeholder="0"
          style={{
            width: 90, textAlign: 'center', padding: '10px',
            fontFamily: "'Barlow Condensed',sans-serif", fontSize: 28, fontWeight: 800,
            border: `2px solid ${locked ? 'var(--border)' : value !== null ? cat.color : 'var(--border2)'}`,
            borderRadius: 8, background: 'var(--bg3)', color: 'var(--text)',
          }}
        />
        {!locked && (
          <div style={{ fontSize: 12, color: 'var(--text3)' }}>
            ⏳ Låser om <strong style={{ color: countdown === 'Låst' ? 'var(--red)' : 'var(--text)' }}>{countdown}</strong>
          </div>
        )}
        {locked && value !== null && (
          <div style={{ fontSize: 13 }}>
            🔒 Dit gæt: <strong style={{ color: cat.color, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 20 }}>{value}</strong>
          </div>
        )}
        {locked && value === null && (
          <div style={{ fontSize: 13, color: 'var(--text3)' }}>🔒 Ingen gæt afgivet</div>
        )}
      </div>

      {/* Show distribution of guesses after lock */}
      {locked && allGuesses.length > 0 && (
        <div style={{ marginTop: 10, borderTop: '1px solid var(--border)', paddingTop: 8 }}>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Alle gæt
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {allGuesses.sort((a,b) => a.guess - b.guess).map((g, i) => (
              <div key={i} style={{
                padding: '3px 10px', borderRadius: 20, fontSize: 13,
                background: g.isMe ? cat.color + '33' : 'var(--bg3)',
                border: g.isMe ? `1px solid ${cat.color}` : '1px solid var(--border)',
                fontWeight: g.isMe ? 700 : 400,
              }}>
                {g.name}: <strong>{g.guess}</strong>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function VarSpecial({ participant, pin }) {
  const [preds, setPreds] = useState({ var_penalties: null, var_red_cards: null, var_goals_disallowed: null })
  const [allPreds, setAllPreds] = useState([])
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(true)
  const locked = new Date() > LOCK_TIME

  useEffect(() => {
    if (!participant) { setLoading(false); return }
    Promise.all([
      api.get(`/participants/${participant.id}/var-prediction`),
      api.get('/participants/var-predictions/all'),
    ]).then(([mine, all]) => {
      if (mine.data) setPreds({
        var_penalties: mine.data.var_penalties,
        var_red_cards: mine.data.var_red_cards,
        var_goals_disallowed: mine.data.var_goals_disallowed,
      })
      setAllPreds(all.data || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [participant?.id])

  async function save() {
    if (!participant) return
    setSaving(true)
    try {
      await api.put(`/participants/${participant.id}/var-prediction`, {
        pin,
        var_penalties: preds.var_penalties,
        var_red_cards: preds.var_red_cards,
        var_goals_disallowed: preds.var_goals_disallowed,
      })
      setMsg('✅ VAR-gæt gemt!')
      setTimeout(() => setMsg(''), 3000)
    } catch(e) {
      setMsg('❌ ' + (e.response?.data?.error || 'Fejl'))
    }
    setSaving(false)
  }

  if (!participant) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>🚨</div>
        <div style={{ fontWeight: 600, marginBottom: 4 }}>Log ind for at afgive VAR-gæt</div>
        <div style={{ fontSize: 13, color: 'var(--text3)' }}>Gå til "Mine gæt" og log ind med dit navn og PIN</div>
      </div>
    )
  }

  if (loading) return <div className="spinner">Henter...</div>

  const allGuessesFor = (key) => allPreds
    .filter(p => p[key] !== null && p[key] !== undefined)
    .map(p => ({ name: p.name, guess: parseInt(p[key]), isMe: p.participant_id === participant.id }))

  const allFilled = CATS.every(c => preds[c.key] !== null && preds[c.key] !== undefined)

  return (
    <div>
      <div style={{ background: 'rgba(239,68,68,.06)', border: '1px solid rgba(239,68,68,.25)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, display: 'flex', gap: 10, alignItems: 'center' }}>
        <span style={{ fontSize: 20 }}>🚨</span>
        <div>
          <div style={{ fontWeight: 600, fontSize: 14 }}>VAR Special — Nærmest-vinder</div>
          <div style={{ fontSize: 12, color: 'var(--text2)' }}>
            Gæt på 3 VAR-kategorier. Låser <strong>15. juni kl. 23:00</strong> dansk tid.
            Pr. kategori: 1. plads = 30 pt · 2. plads = 15 pt · Resten = 0.
          </div>
        </div>
      </div>

      {msg && <div className={`alert ${msg.includes('✅') ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: 12 }}>{msg}</div>}

      {CATS.map(cat => (
        <VarCatCard
          key={cat.key}
          cat={cat}
          value={preds[cat.key]}
          onChange={val => setPreds(p => ({ ...p, [cat.key]: val }))}
          locked={locked}
          allGuesses={locked ? allGuessesFor(cat.key) : []}
        />
      ))}

      {!locked && (
        <button
          className="btn btn-gold btn-full"
          onClick={save}
          disabled={saving || !allFilled}
          style={{ marginTop: 4 }}
        >
          {saving ? 'Gemmer...' : allFilled ? '💾 Gem VAR-gæt' : 'Udfyld alle 3 felter for at gemme'}
        </button>
      )}
    </div>
  )
}
