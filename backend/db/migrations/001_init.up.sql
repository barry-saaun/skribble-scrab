CREATE TABLE IF NOT EXISTS words (
    id      SERIAL PRIMARY KEY,
    word    TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL DEFAULT 'general'
);

CREATE TABLE IF NOT EXISTS game_results (
    id           SERIAL PRIMARY KEY,
    room_id      TEXT        NOT NULL,
    player_id    TEXT        NOT NULL,
    display_name TEXT        NOT NULL,
    score        INTEGER     NOT NULL DEFAULT 0,
    played_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_game_results_player_id ON game_results (player_id);
CREATE INDEX IF NOT EXISTS idx_game_results_played_at ON game_results (played_at DESC);

INSERT INTO words (word, category) VALUES
    ('cat', 'animals'), ('dog', 'animals'), ('elephant', 'animals'), ('dragon', 'fantasy'),
    ('robot', 'sci-fi'), ('guitar', 'music'), ('pizza', 'food'), ('castle', 'buildings'),
    ('mountain', 'nature'), ('ocean', 'nature'), ('tree', 'nature'), ('flower', 'nature'),
    ('car', 'vehicles'), ('rocket', 'sci-fi'), ('house', 'buildings')
ON CONFLICT (word) DO NOTHING;
