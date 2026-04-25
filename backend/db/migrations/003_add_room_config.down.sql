ALTER TABLE rooms
  DROP COLUMN IF EXISTS name,
  DROP CONSTRAINT IF EXISTS rooms_max_players_check,
  ADD CONSTRAINT rooms_max_players_check CHECK (max_players > 0);
