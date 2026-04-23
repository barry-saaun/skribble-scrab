// useGameSocket.ts still remains the single source of truth for WS state

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { GameState } from "~/types/game";

interface TUsePlayerPresence {
  gameState: GameState;
  playerID: string;
  isHost: boolean;
  sendLeave: () => void;
  sendTransferHost: (targetID: string) => void;
}

export default function usePlayerPresence({
  gameState,
  playerID,
  isHost,
  sendLeave,
  sendTransferHost,
}: TUsePlayerPresence) {
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [showHostLeaveModal, setShowHostLeaveModal] = useState(false);

  const router = useRouter();

  // Standard (non-host) leave — used by Stay/Leave confirm row
  const handleLeave = useCallback(() => {
    sendLeave();
    router.push("/");
  }, [sendLeave, router]);

  // Called when ← LEAVE is clicked. Routes to host modal or standard confirm
  // depending on role. Host modal is only relevant in the lobby; mid-game the
  // backend blocks transfers anyway, so we fall through to normal confirm.
  const onLeaveClick = useCallback(() => {
    if (isHost && gameState.status === "waiting") {
      const hasOtherPlayers = gameState.players.some((p) => p.role !== "host");
      if (hasOtherPlayers) {
        setShowHostLeaveModal(true);
      } else {
        // Sole occupant — no successor needed, leave immediately
        sendLeave();
        router.push("/");
      }
    } else {
      setConfirmLeave(true);
    }
  }, [isHost, gameState.status, gameState.players, sendLeave, router]);

  const onCancelLeave = useCallback(() => setConfirmLeave(false), []);

  // ── Host-leave modal handlers ──────────────────────────────────────────────

  const onCancelHostLeave = useCallback(() => setShowHostLeaveModal(false), []);

  // Mode A: just leave, server auto-promotes
  const onLeaveRandom = useCallback(() => {
    sendLeave();
    router.push("/");
  }, [sendLeave, router]);

  // Mode B: transfer first, then leave in the same tick.
  // Both messages are queued on the same WS connection so the server processes
  // host.transfer before player.leave, meaning wasHost will be false by the
  // time RemovePlayer runs and Mode A will NOT double-fire.
  const onLeaveWithTransfer = useCallback(
    (targetID: string) => {
      sendTransferHost(targetID);
      sendLeave();
      router.push("/");
    },
    [sendTransferHost, sendLeave, router],
  );

  // ── Derived state ──────────────────────────────────────────────────────────

  const drawerIndex = gameState.drawOrder.findIndex(
    (id) => id === gameState.drawerID,
  );
  const nextIndex = drawerIndex + 1;
  const isNextDrawer =
    gameState.status === "in_progress" &&
    !gameState.roundLive &&
    nextIndex < gameState.drawOrder.length &&
    gameState.drawOrder[nextIndex] === playerID;

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
    // Standard leave flow
    handleLeave,
    onLeaveClick,
    onCancelLeave,
    isNextDrawer,
    isIntermission,
    showConfirmLeave,

    // Host-leave modal
    showHostLeaveModal,
    onCancelHostLeave,
    onLeaveRandom,
    onLeaveWithTransfer,
  };
}
