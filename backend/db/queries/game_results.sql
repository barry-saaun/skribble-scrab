-- name: InsertGameResult :exec
INSERT INTO game_results (room_id, player_id, display_name, score)
VALUES ($1, $2, $3, $4);

-- name: GetLeaderboard :many
SELECT player_id, display_name, SUM(score) AS total_score, COUNT(*) AS games_played
FROM game_results
GROUP BY player_id, display_name
ORDER BY total_score DESC
LIMIT $1;

-- name: GetPlayerStats :one
SELECT player_id, display_name, SUM(score) AS total_score, COUNT(*) AS games_played
FROM game_results
WHERE player_id = $1
GROUP BY player_id, display_name;
