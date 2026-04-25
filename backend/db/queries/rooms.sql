-- name: InsertRoom :exec
INSERT INTO rooms (id, name, host_id, host_username, host_display_name, visibility, status, max_players)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
RETURNING *;

-- name: GetRoomByID :one
SELECT * FROM rooms WHERE id = $1;

-- name: ListPublicRooms :many
SELECT * FROM rooms
WHERE visibility = 'public' AND status = 'waiting'
ORDER BY created_at DESC;

-- name: UpdateRoomStatus :exec
UPDATE rooms
SET status      = $2,
    finished_at = CASE WHEN $2 = 'finished'::room_status THEN now() ELSE finished_at END
WHERE id = $1;

-- name: InsertRoomPlayer :exec
INSERT INTO room_players (room_id, player_id, username, display_name, role)
VALUES ($1, $2, $3, $4, $5);

-- name: DeleteRoomPlayer :exec
DELETE FROM room_players WHERE room_id = $1 AND player_id = $2;
