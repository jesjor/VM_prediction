-- VM 2026 Prediction App - Database Schema
-- Run this once to set up the database

-- Users (admins only for now, participants are just names)
CREATE TABLE IF NOT EXISTS admins (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Participants (no login needed - just a name + PIN)
CREATE TABLE IF NOT EXISTS participants (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  pin VARCHAR(4) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Matches (seeded from matchData.js)
CREATE TABLE IF NOT EXISTS matches (
  id INTEGER PRIMARY KEY,
  round VARCHAR(20) NOT NULL,  -- 'GROUP', 'R32', 'R16', 'QF', 'SF', '3RD', 'FINAL'
  group_name VARCHAR(2),       -- 'A'-'L' for group stage, NULL for knockout
  home_team VARCHAR(100),      -- NULL until knockout teams are known
  away_team VARCHAR(100),
  home_slot VARCHAR(20),       -- e.g. 'W-A', 'R-B', 'W-73' for knockouts
  away_slot VARCHAR(20),
  kickoff TIMESTAMPTZ NOT NULL,
  stadium_key VARCHAR(30) NOT NULL,
  stadium_name VARCHAR(100) NOT NULL,
  stadium_city VARCHAR(100) NOT NULL,
  stadium_capacity INTEGER,
  label VARCHAR(200),          -- display label for knockout matches
  -- Result
  home_score INTEGER,
  away_score INTEGER,
  home_score_et INTEGER,       -- extra time (knockout only)
  away_score_et INTEGER,
  home_score_pens INTEGER,     -- penalties
  away_score_pens INTEGER,
  winner VARCHAR(100),         -- filled in when match is done
  status VARCHAR(20) DEFAULT 'scheduled', -- scheduled, live, finished
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Match events (goals, cards per match)
CREATE TABLE IF NOT EXISTS match_events (
  id SERIAL PRIMARY KEY,
  match_id INTEGER REFERENCES matches(id) ON DELETE CASCADE,
  team VARCHAR(100) NOT NULL,
  player VARCHAR(100) NOT NULL,
  event_type VARCHAR(20) NOT NULL, -- 'goal', 'own_goal', 'assist', 'yellow', 'red', 'yellow_red'
  minute INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tournament-wide predictions (top scorers, assists, etc.)
CREATE TABLE IF NOT EXISTS tournament_predictions (
  id SERIAL PRIMARY KEY,
  participant_id INTEGER REFERENCES participants(id) ON DELETE CASCADE,
  -- Top scorers (1-3)
  topscorer_1_team VARCHAR(100),
  topscorer_1_player VARCHAR(100),
  topscorer_2_team VARCHAR(100),
  topscorer_2_player VARCHAR(100),
  topscorer_3_team VARCHAR(100),
  topscorer_3_player VARCHAR(100),
  -- Top assists (1-3)
  assist_1_team VARCHAR(100),
  assist_1_player VARCHAR(100),
  assist_2_team VARCHAR(100),
  assist_2_player VARCHAR(100),
  assist_3_team VARCHAR(100),
  assist_3_player VARCHAR(100),
  -- Top 3 countries (final standings)
  country_1 VARCHAR(100),
  country_2 VARCHAR(100),
  country_3 VARCHAR(100),
  -- Group winners (A-L)
  group_winner_a VARCHAR(100),
  group_winner_b VARCHAR(100),
  group_winner_c VARCHAR(100),
  group_winner_d VARCHAR(100),
  group_winner_e VARCHAR(100),
  group_winner_f VARCHAR(100),
  group_winner_g VARCHAR(100),
  group_winner_h VARCHAR(100),
  group_winner_i VARCHAR(100),
  group_winner_j VARCHAR(100),
  group_winner_k VARCHAR(100),
  group_winner_l VARCHAR(100),
  -- Cards
  most_yellow_team VARCHAR(100),
  most_yellow_player VARCHAR(100),
  most_red_team VARCHAR(100),
  most_red_player VARCHAR(100),
  -- MVP / awards
  most_mvp_player VARCHAR(100),
  most_mvp_team VARCHAR(100),
  tournament_player VARCHAR(100),
  tournament_player_team VARCHAR(100),
  -- Defense / attack
  least_goals_conceded VARCHAR(100),
  most_goals_scored VARCHAR(100),
  locked_at TIMESTAMPTZ,  -- set when predictions are locked (15 min before first match)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Per-match predictions (1X2 + first goalscorer)
CREATE TABLE IF NOT EXISTS match_predictions (
  id SERIAL PRIMARY KEY,
  participant_id INTEGER REFERENCES participants(id) ON DELETE CASCADE,
  match_id INTEGER REFERENCES matches(id) ON DELETE CASCADE,
  prediction VARCHAR(1) NOT NULL CHECK (prediction IN ('1','X','2')), -- 1=home, X=draw, 2=away
  first_scorer_team VARCHAR(100),
  first_scorer_player VARCHAR(100),   -- can be NULL = no goalscorer
  locked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(participant_id, match_id)
);

-- Squads (admin can add/edit players per team)
CREATE TABLE IF NOT EXISTS squads (
  id SERIAL PRIMARY KEY,
  team VARCHAR(100) NOT NULL,
  player VARCHAR(100) NOT NULL,
  position VARCHAR(20), -- GK, DEF, MID, FWD
  number INTEGER,
  UNIQUE(team, player)
);

-- Tournament results (filled by admin as tournament progresses)
CREATE TABLE IF NOT EXISTS tournament_results (
  id SERIAL PRIMARY KEY,
  result_key VARCHAR(50) UNIQUE NOT NULL,  -- 'topscorer_1', 'assist_2', etc.
  team VARCHAR(100),
  player VARCHAR(100),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_match_predictions_participant ON match_predictions(participant_id);
CREATE INDEX IF NOT EXISTS idx_match_predictions_match ON match_predictions(match_id);
CREATE INDEX IF NOT EXISTS idx_match_events_match ON match_events(match_id);
CREATE INDEX IF NOT EXISTS idx_tournament_predictions_participant ON tournament_predictions(participant_id);

-- Dream team predictions (VM hold - bedste 11)
CREATE TABLE IF NOT EXISTS dream_team_predictions (
  id SERIAL PRIMARY KEY,
  participant_id INTEGER REFERENCES participants(id) ON DELETE CASCADE UNIQUE,
  players JSONB NOT NULL DEFAULT '[]', -- array of {team, player, position} max 11
  best_player_team VARCHAR(100),
  best_player VARCHAR(100),
  locked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Match MVP prediction (kampens spiller)
-- Added to match_predictions table via ALTER
DO $$ BEGIN
  ALTER TABLE match_predictions ADD COLUMN IF NOT EXISTS match_mvp_team VARCHAR(100);
  ALTER TABLE match_predictions ADD COLUMN IF NOT EXISTS match_mvp_player VARCHAR(100);
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Match MVP actual result (filled by admin)
DO $$ BEGIN
  ALTER TABLE matches ADD COLUMN IF NOT EXISTS match_mvp_player VARCHAR(100);
  ALTER TABLE matches ADD COLUMN IF NOT EXISTS match_mvp_team VARCHAR(100);
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Group runners-up predictions
DO $$ BEGIN
  ALTER TABLE tournament_predictions ADD COLUMN IF NOT EXISTS group_runner_a VARCHAR(100);
  ALTER TABLE tournament_predictions ADD COLUMN IF NOT EXISTS group_runner_b VARCHAR(100);
  ALTER TABLE tournament_predictions ADD COLUMN IF NOT EXISTS group_runner_c VARCHAR(100);
  ALTER TABLE tournament_predictions ADD COLUMN IF NOT EXISTS group_runner_d VARCHAR(100);
  ALTER TABLE tournament_predictions ADD COLUMN IF NOT EXISTS group_runner_e VARCHAR(100);
  ALTER TABLE tournament_predictions ADD COLUMN IF NOT EXISTS group_runner_f VARCHAR(100);
  ALTER TABLE tournament_predictions ADD COLUMN IF NOT EXISTS group_runner_g VARCHAR(100);
  ALTER TABLE tournament_predictions ADD COLUMN IF NOT EXISTS group_runner_h VARCHAR(100);
  ALTER TABLE tournament_predictions ADD COLUMN IF NOT EXISTS group_runner_i VARCHAR(100);
  ALTER TABLE tournament_predictions ADD COLUMN IF NOT EXISTS group_runner_j VARCHAR(100);
  ALTER TABLE tournament_predictions ADD COLUMN IF NOT EXISTS group_runner_k VARCHAR(100);
  ALTER TABLE tournament_predictions ADD COLUMN IF NOT EXISTS group_runner_l VARCHAR(100);
  ALTER TABLE tournament_predictions ADD COLUMN IF NOT EXISTS most_yellow_team_overall VARCHAR(100);
  ALTER TABLE tournament_predictions ADD COLUMN IF NOT EXISTS most_red_team_overall VARCHAR(100);
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
-- Group runner-up results
DO $$ BEGIN
  ALTER TABLE tournament_results ADD COLUMN IF NOT EXISTS result_value TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Card points predictions
DO $$ BEGIN
  ALTER TABLE tournament_predictions ADD COLUMN IF NOT EXISTS most_card_pts_player VARCHAR(100);
  ALTER TABLE tournament_predictions ADD COLUMN IF NOT EXISTS most_card_pts_player_team VARCHAR(100);
  ALTER TABLE tournament_predictions ADD COLUMN IF NOT EXISTS most_card_pts_team VARCHAR(100);
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
