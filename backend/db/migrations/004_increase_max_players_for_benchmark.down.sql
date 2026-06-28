ALTER TABLE rooms
  DROP CONSTRAINT IF EXISTS rooms_max_players_check,
  ADD CONSTRAINT rooms_max_players_check CHECK (max_players BETWEEN 1 AND 15);
