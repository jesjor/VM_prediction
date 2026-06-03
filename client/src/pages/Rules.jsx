export default function Rules() {
  const cats = [
    {
      title: '⚽ Kampgæt', sub: 'Afgives pr. kamp — låses 15 min før afspark',
      rows: [
        { label: 'Rigtigt kampresultat (1 / X / 2)', pts: '3 pt' },
        { label: 'Rigtig første målscorer', pts: '3 pt' },
        { label: 'Ingen mål (0-0) — gættet ingen målscorer', pts: '3 pt' },
        { label: 'Kampens spiller (MVP)', pts: '3 pt' },
        { label: 'Maks per kamp', pts: '9 pt' },
      ]
    },
    {
      title: '🌍 Turneringsresultat', sub: 'Afgives inden VM start — låses 15 min før første kamp',
      rows: [
        { label: 'Vinder af VM (1. plads)', pts: '20 pt', highlight: true },
        { label: '2. plads i VM', pts: '15 pt', highlight: true },
        { label: '3. plads i VM', pts: '10 pt', highlight: true },
        { label: 'Gruppevindr (pr. gruppe — 12 grupper)', pts: '5 pt' },
        { label: 'Nr. 2 i gruppe (pr. gruppe — 12 grupper)', pts: '3 pt' },
      ]
    },
    {
      title: '🏅 Top 3 Topscorer', sub: 'Eksakt plads skal rammes — ingen bonus for forkert plads. Samme spiller må vælges på alle 3 pladser.',
      rows: [
        { label: '1. plads topscorer — eksakt', pts: '5 pt' },
        { label: '2. plads topscorer — eksakt', pts: '3 pt' },
        { label: '3. plads topscorer — eksakt', pts: '1 pt' },
        { label: 'Forkert plads', pts: '0 pt' },
        { label: 'Maks (samme spiller på alle 3 pladser, han vinder)', pts: '9 pt' },
      ]
    },
    {
      title: '🎯 Top 3 Assists', sub: 'Samme regler som topscorer',
      rows: [
        { label: '1. plads assists — eksakt', pts: '5 pt' },
        { label: '2. plads assists — eksakt', pts: '3 pt' },
        { label: '3. plads assists — eksakt', pts: '1 pt' },
        { label: 'Forkert plads', pts: '0 pt' },
      ]
    },
    {
      title: '🃏 Øvrige turneringsgæt', sub: 'Aflåses ved VM-start',
      rows: [
        { label: 'Flest gule kort — spiller', pts: '3 pt' },
        { label: 'Flest gule kort — hold', pts: '3 pt' },
        { label: 'Flest røde kort — spiller', pts: '3 pt' },
        { label: 'Flest røde kort — hold', pts: '3 pt' },
        { label: 'Flest MVP-priser — spiller', pts: '3 pt' },
        { label: 'Turneringsspiller (bedste spiller)', pts: '5 pt' },
        { label: 'Færrest mål lukket ind — hold', pts: '3 pt' },
        { label: 'Flest mål scoret — hold', pts: '3 pt' },
      ]
    },
    {
      title: '🌟 VM Hold (Dream Team)', sub: 'Vælg 11 spillere til det officielle VM All-Star hold + bedste spiller. Afgives inden VM start.',
      rows: [
        { label: 'Pr. rigtig spiller i det officielle VM hold', pts: '5 pt' },
        { label: 'Bedste spiller i hele turneringen', pts: '20 pt', highlight: true },
        { label: 'Maks (11 rigtige + bedste spiller)', pts: '75 pt', highlight: true },
      ]
    },
  ]

  const maxPts = [
    { label: 'Kampgæt (9 pt × 104 kampe)', pts: '936 pt' },
    { label: 'VM vinder + 2. + 3. plads', pts: '45 pt' },
    { label: 'Gruppegæt (12 × 8 pt)', pts: '96 pt' },
    { label: 'Top 3 topscorer + assists (max 9+9)', pts: '18 pt' },
    { label: 'Øvrige turneringsgæt (8 × maks)', pts: '26 pt' },
    { label: 'VM Hold + bedste spiller', pts: '75 pt' },
  ]

  return (
    <div>
      <div style={{ padding: '1.25rem 0 1rem' }}>
        <div className="page-title">📋 Regler & Point</div>
        <div className="page-sub">Alt du skal vide om pointsystemet</div>
      </div>

      <div className="card" style={{ marginBottom: '1rem', borderColor: 'rgba(245,197,24,.3)', background: 'rgba(245,197,24,.05)' }}>
        <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 16, fontWeight: 700, color: 'var(--gold)', marginBottom: '.5rem' }}>⚡ HIGH RISK — HIGH REWARD</div>
        <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.6 }}>
          I topscorer, assist og landeplacering kan du vælge <strong style={{ color: 'var(--text)' }}>samme spiller/land på alle 3 pladser</strong>. Gætter du Messi på 1., 2. og 3. plads topscorer, og han faktisk vinder, får du <strong style={{ color: 'var(--gold)' }}>5 + 3 + 1 = 9 point</strong>. Men gætter du forkert plads, giver det <strong style={{ color: 'var(--red)' }}>0 point</strong> — ingen bonus for "rigtigt navn, forkert plads".
        </p>
      </div>

      {cats.map(cat => (
        <div key={cat.title} className="rules-cat">
          <div className="rules-cat-title">{cat.title}</div>
          {cat.sub && <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: '.75rem' }}>{cat.sub}</p>}
          {cat.rows.map(row => (
            <div key={row.label} className="rules-row">
              <span className="rules-row-label">{row.label}</span>
              <span className="rules-pts" style={{ color: row.highlight ? 'var(--gold)' : undefined }}>{row.pts}</span>
            </div>
          ))}
        </div>
      ))}

      <div className="card" style={{ marginTop: '.5rem' }}>
        <div className="section-title">Teoretisk maksimum</div>
        {maxPts.map(r => (
          <div key={r.label} className="rules-row">
            <span className="rules-row-label" style={{ fontSize: 13 }}>{r.label}</span>
            <span className="rules-pts" style={{ fontSize: 16 }}>{r.pts}</span>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginTop: '8px', background: 'rgba(59,130,246,.06)', borderColor: 'rgba(59,130,246,.2)' }}>
        <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 16, fontWeight: 700, color: 'var(--blue)', marginBottom: '.5rem' }}>ℹ️ Generelle regler</div>
        <ul style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.8, paddingLeft: '1.25rem' }}>
          <li>Kampgæt låses automatisk <strong style={{ color: 'var(--text)' }}>15 minutter</strong> før kampstart.</li>
          <li>Turneringsgæt (topscorer, lande, grupper, VM hold m.m.) låses <strong style={{ color: 'var(--text)' }}>15 min før første kamp</strong> — 11. juni.</li>
          <li>Log ind med dit navn og 4-cifrede PIN. Husk dit PIN — det kan ikke nulstilles uden admin.</li>
          <li>Point opdateres automatisk, når admin registrerer kampresultater.</li>
          <li>Admin kan altid rette i resultater ved fejl.</li>
        </ul>
      </div>
    </div>
  )
}
