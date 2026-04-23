CREATE TYPE room_visibility AS ENUM ('private', 'public');
CREATE TYPE room_status AS ENUM ('waiting', 'in_progress', 'finished');

CREATE TABLE IF NOT EXISTS rooms (
  id               TEXT             PRIMARY KEY,
  host_id          TEXT             NOT NULL,
  host_username    TEXT             NOT NULL,
  host_display_name TEXT            NOT NULL,
  visibility       room_visibility  NOT NULL DEFAULT 'public',
  status           room_status      NOT NULL DEFAULT 'waiting',
  max_players      INTEGER          NOT NULL CHECK (max_players > 0),
  created_at       TIMESTAMPTZ      NOT NULL DEFAULT now(),
  finished_at      TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS room_players (
  room_id      TEXT        NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  player_id    TEXT        NOT NULL,
  username     TEXT        NOT NULL,
  display_name TEXT        NOT NULL,
  role         TEXT        NOT NULL DEFAULT 'player',
  joined_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (room_id, player_id)
);
