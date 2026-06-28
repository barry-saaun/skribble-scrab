-- Raises the room size cap from 15 to 500 so the concurrency benchmark
-- (benchmarks/concurrency/main.go) can create large rooms instead of
-- spreading hundreds of players across many small rooms.
ALTER TABLE rooms
  DROP CONSTRAINT IF EXISTS rooms_max_players_check,
  ADD CONSTRAINT rooms_max_players_check CHECK (max_players BETWEEN 1 AND 500);
