export default function Rules() {
  const cats = [
    {
      title: '⚽ Kampgæt',
      sub: 'Afgives pr. kamp — låses automatisk 15 min før afspark. Maks 12 pt pr. kamp.',
      rows: [
        { label: 'Rigtigt kampresultat (1 / X / 2)', pts: '3 pt' },
        { label: 'Eksakt slutscore (fx 2-1) — bonus oveni kampresultat', pts: '3 pt' },
        { label: 'Rigtig første målscorer', pts: '3 pt' },
        { label: 'Ingen mål i kampen — forudsat ingen scorer (0-0)', pts: '3 pt' },
        { label: 'Kampens spiller (MVP)', pts: '3 pt' },
        { label: 'Maks per kamp (alt rigtigt)', pts: '12 pt', highlight: true },
      ]
    },
    {
      title: '🏅 Top 3 Topscorer',
      sub: 'Top X logik: gætter du Top 2, og spilleren vinder (Top 1), giver det stadig point — for han er jo "inden for Top 2". Men gætter du Top 1 og han ender på 2. plads, er det 0 point. Samme spiller må vælges på alle 3 slots.',
      rows: [
        { label: 'Top 1 — spilleren vinder topscorertitlen', pts: '20 pt', highlight: true },
        { label: 'Top 2 — spilleren ender på 1. eller 2. plads', pts: '15 pt' },
        { label: 'Top 3 — spilleren ender på 1., 2. eller 3. plads', pts: '10 pt' },
        { label: 'Spilleren ender udenfor den Top du valgte', pts: '0 pt' },
        { label: 'Maks — samme spiller alle 3 slots, han vinder', pts: '45 pt', highlight: true },
      ]
    },
    {
      title: '🎯 Top 3 Assists',
      sub: 'Nøjagtigt samme regler og point som topscorer.',
      rows: [
        { label: 'Top 1', pts: '20 pt', highlight: true },
        { label: 'Top 2', pts: '15 pt' },
        { label: 'Top 3', pts: '10 pt' },
        { label: 'Maks (all-in)', pts: '45 pt', highlight: true },
      ]
    },
    {
      title: '🌍 VM Slutstilling',
      sub: 'Samme Top X logik. Gætter du Top 2, og holdet vinder VM, giver det 15 pt. Samme hold må vælges på alle 3 pladser.',
      rows: [
        { label: 'VM Vinder — holdet vinder turneringen', pts: '20 pt', highlight: true },
        { label: 'Top 2 — holdet ender på 1. eller 2. plads', pts: '15 pt' },
        { label: 'Top 3 — holdet ender på 1., 2. eller 3. plads', pts: '10 pt' },
        { label: 'Maks (all-in på ét hold)', pts: '45 pt', highlight: true },
      ]
    },
    {
      title: '🏆 Gruppegæt',
      sub: 'Eksakt gæt kræves — ingen Top X bonus her. Aflåses ved VM-start.',
      rows: [
        { label: 'Gruppevindr — eksakt rigtig (pr. gruppe × 12 grupper)', pts: '5 pt' },
        { label: 'Nr. 2 i gruppe — eksakt rigtig (pr. gruppe × 12 grupper)', pts: '3 pt' },
        { label: 'Maks alle 12 grupper rigtige (12×8)', pts: '96 pt', highlight: true },
      ]
    },
    {
      title: '🃏 Kort & Disciplin',
      sub: 'Kortpoint beregnes: Gul=2, Rød=5, Gul+Rød i SAMME kamp=5 (kun rødt tæller for den kamp).',
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
      sub: 'Aflåses 15 min før første kamp — 11. juni 2026.',
      rows: [
        { label: 'Flest MVP-priser — spiller', pts: '3 pt' },
        { label: 'Turneringsspiller (bedste spiller hele VM)', pts: '25 pt', highlight: true },
        { label: 'Færrest mål lukket ind — hold', pts: '20 pt' },
        { label: 'Flest mål scoret — hold', pts: '20 pt' },
      ]
    },
    {
      title: '🚨 VAR Straffespark — Specielt gæt',
      sub: 'Nærmest-vinder: gæt på det totale antal VAR-tildelte straffespark under hele VM. Låses 48 timer efter turneringsstart.',
      rows: [
        { label: '1. plads (nærmest det korrekte antal)', pts: '30 pt', highlight: true },
        { label: '2. plads', pts: '15 pt' },
        { label: '3. plads og resten', pts: '0 pt' },
        { label: 'Ved uafgjort deler de berørte pladser point', pts: '' },
      ]
    },
    {
      title: '🌟 VM Hold (Dream Team)',
      sub: 'Vælg 11 spillere til det officielle VM All-Star hold + bedste spiller. Aflåses ved VM-start.',
      rows: [
        { label: 'Pr. rigtig spiller i det officielle VM hold (×11)', pts: '5 pt' },
        { label: 'Bedste spiller i hele turneringen', pts: '25 pt', highlight: true },
        { label: 'Maks (11 rigtige + bedste spiller)', pts: '80 pt', highlight: true },
      ]
    },
  ]

  const examples = [
    { ex: '✅ Gætter Messi Top 2 — han vinder (Top 1)', res: '15 pt — inden for Top 2', ok: true },
    { ex: '✅ Gætter Argentina Top 1, 2 og 3 — de vinder VM', res: '20+15+10 = 45 pt!', ok: true },
    { ex: '✅ Eksakt score 2-1 — kampen slutter 2-1', res: '+3 pt bonus', ok: true },
    { ex: '❌ Gætter Messi Top 1 — han ender på 2. plads', res: '0 pt — ikke Top 1', ok: false },
    { ex: '❌ Gætter Spanien Gruppe A vinder — de er nr. 2', res: '0 pt — eksakt kræves i grupper', ok: false },
  ]

  return (
    <div>
      <div style={{ padding: '1.25rem 0 1rem' }}>
        <div className="page-title">📋 Regler & Point</div>
        <div className="page-sub">Alt du skal vide — læs inden du gætter!</div>
      </div>

      {/* Top X forklaring */}
      <div className="card" style={{ marginBottom: '1rem', borderColor: 'rgba(245,197,24,.35)', background: 'rgba(245,197,24,.06)' }}>
        <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 17, fontWeight: 700, color: 'var(--gold)', marginBottom: '.75rem' }}>
          ⚡ TOP X LOGIK — FORSTÅ DET HER FØRST
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {examples.map(e => (
            <div key={e.ex} style={{ background: 'var(--bg3)', borderRadius: 8, padding: '8px 12px', display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 13, color: 'var(--text2)' }}>{e.ex}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: e.ok ? 'var(--green)' : 'var(--red)', flexShrink: 0 }}>{e.res}</span>
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

      <div className="card">
        <div className="section-title">ℹ️ Praktiske regler</div>
        <ul style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 2.1, paddingLeft: '1.25rem' }}>
          <li>Kampgæt låses <strong style={{color:'var(--text)'}}>15 min før kampstart</strong> — kan ikke ændres bagefter.</li>
          <li>Turneringsgæt låses <strong style={{color:'var(--text)'}}>15 min før første kamp</strong> den 11. juni 2026.</li>
          <li>Log ind med <strong style={{color:'var(--text)'}}>navn + 4-cifret PIN</strong>. Husk dit PIN — det kan ikke nulstilles uden admin.</li>
          <li>Point opdateres automatisk når admin registrerer kampresultater.</li>
          <li>Admin kan altid rette fejl i resultater.</li>
          <li>Kortpoint: Gult=2, Rødt=5, Gult+Rødt i én kamp=5 (kun rødt tæller for den kamp).</li>
          <li>Eksakt score er <strong style={{color:'var(--text)'}}>bonus</strong> — du får kampresultat-point selv om eksakt score er forkert.</li>
        </ul>
      </div>
    </div>
  )
}
