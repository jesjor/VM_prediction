# ⚽ VM 2026 Prediction App

Fuld prediction-app til FIFA VM 2026. Alle 104 kampe, automatisk knockout-progression, admin panel, pointberegning.

## Deploy til Railway (10 minutter)

### 1. Opret Railway projekt

1. Gå til [railway.app](https://railway.app) og log ind
2. Klik **New Project** → **Deploy from GitHub repo**
3. Push denne mappe til GitHub først (se trin 2)

### 2. Push til GitHub

```bash
cd vm2026
git init
git add .
git commit -m "VM 2026 prediction app"
git remote add origin https://github.com/DIT_NAVN/vm2026.git
git push -u origin main
```

### 3. Tilføj PostgreSQL database

I Railway projektet:
1. Klik **+ New** → **Database** → **PostgreSQL**
2. Railway linker automatisk `DATABASE_URL` til din app

### 4. Sæt environment variables

I Railway → din app → **Variables**, tilføj:

| Variable | Værdi |
|----------|-------|
| `NODE_ENV` | `production` |
| `JWT_SECRET` | En lang tilfældig streng (fx `vm2026-super-secret-xyz-123`) |
| `ADMIN_USER` | `admin` (eller dit eget) |
| `ADMIN_PASS` | Din admin adgangskode |

`DATABASE_URL` sættes automatisk af Railway PostgreSQL.

### 5. Deploy

Railway bygger og deployer automatisk. Første gang tager ~3-4 minutter.

Når det er oppe:
- 🌐 App URL vises i Railway dashboard
- 🔐 Log ind på `/admin/login` med dine admin-credentials
- 👥 Start med at tilføje spillere under **Admin → Trupper**

---

## Funktioner

### For deltagere
- **Leaderboard** — live pointoversigt
- **Kampe** — alle 104 kampe med stadion, tidspunkt, resultat
- **Mine gæt** — log ind med navn + PIN
  - Turneringsgæt (topscorer, assists, lande, gruppevindere, kort, awards)
  - Kampgæt (1X2 + første målscorer, låses 15 min før start)

### For admin
- **Kampresultater** — indtast score + begivenheder (mål, kort, assists)
- **Trupper** — tilføj spillere til hvert hold (bruges i dropdowns)
- **Turnerings-stats** — opdater topscorer, assists, awards løbende
- Knockout-progression opdateres **automatisk** når resultater gemmes

### Pointsystem
| Kategori | Point |
|----------|-------|
| Topscorer/assist/land 1. plads | 5 pt |
| 2. plads | 3 pt |
| 3. plads | 1 pt |
| Rigtigt navn, forkert plads | 2 pt |
| Gruppevindr | 3 pt |
| Kamp 1X2 rigtig | 1 pt |
| Første målscorer rigtig | 1 pt |
| Turneringsspiller | 5 pt |
| Gule/røde kort, MVP, forsvar, angreb | 3 pt |

---

## Lokal udvikling

```bash
# Start database (kræver Docker)
docker run -e POSTGRES_PASSWORD=dev -p 5432:5432 -d postgres

# Server
cd server
DATABASE_URL=postgresql://postgres:dev@localhost:5432/vm2026 npm run dev

# Client (i nyt terminal)
cd client
VITE_API_URL=http://localhost:3001/api npm run dev
```

## Struktur

```
vm2026/
├── client/          # React frontend (Vite)
│   └── src/
│       ├── pages/   # Leaderboard, Matches, Predict, Admin
│       └── api.js   # Axios klient
├── server/          # Node.js + Express backend
│   └── src/
│       ├── db/      # PostgreSQL, schema, matchdata, points
│       ├── routes/  # auth, matches, participants, squads
│       └── middleware/
├── Dockerfile       # Multi-stage build
└── railway.toml     # Railway config
```
