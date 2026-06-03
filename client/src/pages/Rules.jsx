export default function Rules() {
  const cats = [
    {
      title: '⚽ Kampgæt',
      sub: 'Afgives pr. kamp — låses 15 min før afspark',
      rows: [
        { label: 'Rigtigt kampresultat (1 / X / 2)', pts: '3 pt' },
        { label: 'Rigtig første målscorer', pts: '3 pt' },
        { label: 'Ingen mål i kampen (0-0) — forudsat ingen scorer', pts: '3 pt' },
        { label: 'Kampens spiller (MVP)', pts: '3 pt' },
        { label: 'Maks per kamp', pts: '9 pt', highlight: true },
      ]
    },
    {
      title: '🏅 Top 3 Topscorer',
      sub: 'Top X logik: gætter du Top 2, og spilleren vinder (Top 1), giver det stadig point. Men gætter du Top 1, og han ender på Top 2, giver det 0. Samme spiller må vælges på alle 3 pladser.',
      rows: [
        { label: 'Top 1 (vinder topscorer)', pts: '20 pt', highlight: true },
        { label: 'Top 2 (ender på 1. eller 2. plads)', pts: '15 pt' },
        { label: 'Top 3 (ender på 1., 2. eller 3. plads)', pts: '10 pt' },
        { label: 'Udenfor top X du gættede', pts: '0 pt' },
        { label: 'Maks (samme spiller alle 3 pladser, han vinder)', pts: '45 pt', highlight: true },
      ]
    },
    {
      title: '🎯 Top 3 Assists',
      sub: 'Nøjagtig samme regler og point som topscorer.',
      rows: [
        { label: 'Top 1 (flest assists)', pts: '20 pt', highlight: true },
        { label: 'Top 2', pts: '15 pt' },
        { label: 'Top 3', pts: '10 pt' },
        { label: 'Maks (all-in på én spiller)', pts: '45 pt', highlight: true },
      ]
    },
    {
      title: '🌍 VM Slutstilling',
      sub: 'Samme Top X logik. Gætter du Top 2, og holdet vinder VM, giver det 15 pt.',
      rows: [
        { label: 'VM Vinder (Top 1)', pts: '20 pt', highlight: true },
        { label: 'Top 2 (vinder eller 2. plads)', pts: '15 pt' },
        { label: 'Top 3', pts: '10 pt' },
        { label: 'Maks (samme hold alle 3 pladser, de vinder)', pts: '45 pt', highlight: true },
      ]
    },
    {
      title: '🏆 Gruppegæt',
      sub: 'Aflåses ved VM-start. Eksakt gæt kræves.',
      rows: [
        { label: 'Gruppevindr (pr. gruppe × 12)', pts: '5 pt' },
        { label: 'Nr. 2 i gruppe (pr. gruppe × 12)', pts: '3 pt' },
        { label: 'Maks (alle 12 grupper rigtige × 8)', pts: '96 pt', highlight: true },
      ]
    },
    {
      title: '🃏 Kort & Disciplin',
      sub: 'Hvem får flest kort? Gul=2 kortpoint, Rød=5 kortpoint, Gul+Rød=5 kortpoint.',
      rows: [
        { label: 'Flest gule kort — spiller', pts: '20 pt' },
        { label: 'Flest gule kort — hold', pts: '20 pt' },
        { label: 'Flest røde kort — spiller', pts: '20 pt' },
        { label: 'Flest røde kort — hold', pts: '20 pt' },
        { label: 'Flest kortpoint samlet — spiller', pts: '20 pt' },
        { label: 'Flest kortpoint samlet — hold', pts: '20 pt' },
      ]
    },
    {
      title: '🎖️ Øvrige turneringsgæt',
      sub: 'Aflåses ved VM-start.',
      rows: [
        { label: 'Flest MVP-priser — spiller', pts: '3 pt' },
        { label: 'Turneringsspiller (bedste spiller)', pts: '25 pt', highlight: true },
        { label: 'Færrest mål lukket ind — hold', pts: '20 pt' },
        { label: 'Flest mål scoret — hold', pts: '20 pt' },
      ]
    },
    {
      title: '🌟 VM Hold (Dream Team)',
      sub: 'Vælg 11 spillere til det officielle VM All-Star hold + bedste spiller. Aflåses ved VM-start.',
      rows: [
        { label: 'Pr. rigtig spiller i det officielle VM hold', pts: '5 pt' },
        { label: 'Bedste spiller i hele turneringen', pts: '25 pt', highlight: true },
        { label: 'Maks (11 rigtige + bedste spiller)', pts: '80 pt', highlight: true },
      ]
    },
  ]

  return (
    <div>
      <div style={{ padding: '1.25rem 0 1rem' }}>
        <div className="page-title">📋 Regler & Point</div>
        <div className="page-sub">Alt du skal vide om pointsystemet</div>
      </div>

      {/* Top X forklaring */}
      <div className="card" style={{ marginBottom: '1rem', borderColor: 'rgba(245,197,24,.35)', background: 'rgba(245,197,24,.06)' }}>
        <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 17, fontWeight: 700, color: 'var(--gold)', marginBottom: '.5rem' }}>
          ⚡ TOP X LOGIK — HIGH RISK / HIGH REWARD
        </div>
        <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.7, marginBottom: '.75rem' }}>
          I topscorer, assist og landeplacering gætter du <strong style={{ color: 'var(--text)' }}>Top 1, Top 2 eller Top 3</strong> — ikke en eksakt placering.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[
            ['✅ Du gætter Messi Top 2. Han vinder (Top 1).', '15 pt — han er inden for Top 2'],
            ['✅ Du gætter Messi Top 1, 2 og 3. Han vinder.', '20+15+10 = 45 pt!'],
            ['❌ Du gætter Messi Top 1. Han ender Top 2.', '0 pt — han er IKKE Top 1'],
            ['❌ Du gætter Messi Top 2. Han ender Top 3.', '0 pt — han er IKKE inden for Top 2'],
          ].map(([ex, res]) => (
            <div key={ex} style={{ background: 'var(--bg3)', borderRadius: 8, padding: '8px 10px' }}>
              <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 3 }}>{ex}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: ex.startsWith('✅') ? 'var(--green)' : 'var(--red)' }}>{res}</div>
            </div>
          ))}
        </div>
      </div>

      {cats.map(cat => (
        <div key={cat.title} className="rules-cat">
          <div className="rules-cat-title">{cat.title}</div>
          {cat.sub && <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: '.75rem', lineHeight: 1.6 }}>{cat.sub}</p>}
          {cat.rows.map(row => (
            <div key={row.label} className="rules-row">
              <span className="rules-row-label">{row.label}</span>
              <span className="rules-pts" style={{ color: row.highlight ? 'var(--gold)' : undefined }}>{row.pts}</span>
            </div>
          ))}
        </div>
      ))}

      <div className="card" style={{ marginTop: '.5rem' }}>
        <div className="section-title">ℹ️ Generelle regler</div>
        <ul style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 2, paddingLeft: '1.25rem' }}>
          <li>Kampgæt låses automatisk <strong style={{ color: 'var(--text)' }}>15 minutter</strong> før kampstart.</li>
          <li>Turneringsgæt låses <strong style={{ color: 'var(--text)' }}>15 min før første kamp</strong> — 11. juni 2026.</li>
          <li>Log ind med navn + 4-cifret PIN. PIN kan ikke nulstilles uden admin.</li>
          <li>Point opdateres automatisk når admin registrerer kampresultater.</li>
          <li>Admin kan altid rette fejl i resultater.</li>
          <li>Kortpoint: Gult=2, Rødt=5, Gult+Rødt i samme kamp=5 (kun rødt tæller).</li>
        </ul>
      </div>
    </div>
  )
}
