// useGameSocket.ts still remains the single source of truth for WS state

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { GameState } from "~/types/game";

interface TUsePlayerPresence {
  gameState: GameState;
  playerID: string;
  sendLeave: () => void;
}

export default function usePlayerPresence({
  gameState,
  playerID,
  sendLeave,
}: TUsePlayerPresence) {
  const [confirmLeave, setConfirmLeave] = useState(false);

  const router = useRouter();

  const handleLeave = useCallback(() => {
    sendLeave();
    router.push("/");
  }, [sendLeave, router]);

  // Derive whether this player draws next. Only meaningful during intermission
  // (roundLive = false, game in progress).
  // Skips rotation boundaries intentionally:
  // crossing into a new rotation feels like a natural break point.
  const drawerIndex = gameState.drawOrder.findIndex(
    (id) => id === gameState.drawerID,
  );
  const nextIndex = drawerIndex + 1;
  const isNextDrawer =
    gameState.status === "in_progress" &&
    !gameState.roundLive &&
    nextIndex < gameState.drawOrder.length &&
    gameState.drawOrder[nextIndex] === playerID;

  // True only during the post-guess countdown, this is the window where leaving is allowed
  // and we want to draw the player's eye to the Leave button.
  const isIntermission =
    gameState.status === "in_progress" &&
    !gameState.roundLive &&
    gameState.roundEndingCountdown !== null;

  const isRoundLive = gameState.roundLive;

  useEffect(() => {
    const controller = new AbortController();

    window.addEventListener(
      "beforeunload",
      (e) => {
        if (!isRoundLive) return;

        e.preventDefault();
      },
      { signal: controller.signal },
    );

    return () => controller.abort();
  }, [isRoundLive]);

  const showConfirmLeave = confirmLeave && !gameState.roundLive;

  return {
    handleLeave,
    setConfirmLeave,
    isNextDrawer,
    isIntermission,
    showConfirmLeave,
  };
}
