// Translate position codes to Danish labels for dropdowns
const POS = { GK: 'Målmand', DEF: 'Forsvar', MID: 'Midtbane', FWD: 'Angriber' }

export function posLabel(position) {
  return POS[position] || position || ''
}

// Format player display string for <option> label
export function playerLabel(p) {
  if (!p) return ''
  if (typeof p === 'string') return p
  const pos = posLabel(p.position)
  return pos ? `${p.player} (${pos})` : p.player
}

// Sort players: GK first, then DEF, MID, FWD
const ORDER = { GK: 0, DEF: 1, MID: 2, FWD: 3 }
export function sortPlayers(players) {
  return [...players].sort((a, b) => {
    const ao = ORDER[a.position] ?? 9
    const bo = ORDER[b.position] ?? 9
    if (ao !== bo) return ao - bo
    return a.player.localeCompare(b.player)
  })
}
