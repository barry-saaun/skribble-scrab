-- name: GetRandomWord :one
SELECT word FROM words
ORDER BY RANDOM()
LIMIT 1;
