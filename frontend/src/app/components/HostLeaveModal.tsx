"use client";

import { useState } from "react";
import type { Player } from "~/types/game";

type Step = "choose" | "pick";

interface Props {
  players: Player[]; // full room list; component filters out the host
  scores: Record<string, number>;
  onLeaveRandom: () => void;
  onLeaveWithTransfer: (targetID: string) => void;
  onCancel: () => void;
}

export default function HostLeaveModal({
  players,
  scores,
  onLeaveRandom,
  onLeaveWithTransfer,
  onCancel,
}: Props) {
  const [step, setStep] = useState<Step>("choose");
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [selected, setSelected] = useState<string | null>(null);

  const eligible = players.filter((p) => p.role !== "host" && p.connected);

  const goToPick = () => {
    setDirection("forward");
    setStep("pick");
  };

  const goBack = () => {
    setDirection("back");
    setSelected(null);
    setStep("choose");
  };

  const stepAnimClass =
    direction === "forward" ? "step-enter-right" : "step-enter-left";

  return (
    <div
      className="backdrop-fade-in fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: "oklch(0.14 0.008 60 / 0.65)" }}
      onClick={onCancel}
    >
      <div
        className="modal-drop-in w-full max-w-sm bg-card font-mono overflow-hidden"
        style={{
          border: "2px solid var(--brut-ink)",
          boxShadow: "8px 8px 0px var(--brut-ink)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ borderBottom: "2px solid var(--brut-ink)" }}
        >
          <span className="text-[11px] uppercase tracking-widest font-bold">
            ← LEAVING ROOM
          </span>
          <button
            onClick={onCancel}
            className="brut-press font-mono text-[10px] uppercase tracking-widest px-2 py-1"
            style={{
              border: "1px solid var(--border)",
              color: "var(--muted-foreground)",
            }}
          >
            ✕ CANCEL
          </button>
        </div>

        {/* ── Step indicator ── */}
        <div
          className="flex"
          style={{ borderBottom: "1.5px solid var(--border)" }}
        >
          {(["choose", "pick"] as Step[]).map((s, i) => {
            const isActive = step === s;
            const isDone = step === "pick" && s === "choose";
            return (
              <div
                key={s}
                className="flex-1 px-4 py-2 text-[9px] uppercase tracking-widest font-bold flex items-center gap-1.5"
                style={{
                  color: isActive
                    ? "var(--primary)"
                    : "var(--muted-foreground)",
                  borderBottom: isActive
                    ? "2px solid var(--primary)"
                    : "2px solid transparent",
                  background: isActive
                    ? "color-mix(in oklch, var(--primary) 5%, transparent)"
                    : "transparent",
                  transition:
                    "color 0.15s, border-color 0.15s, background 0.15s",
                }}
              >
                {isDone ? (
                  <span style={{ color: "var(--muted-foreground)" }}>✓</span>
                ) : (
                  <span
                    className="w-3.5 h-3.5 flex items-center justify-center text-[8px]"
                    style={{
                      border: `1px solid ${isActive ? "var(--primary)" : "var(--border)"}`,
                      color: isActive
                        ? "var(--primary)"
                        : "var(--muted-foreground)",
                      transition: "border-color 0.15s, color 0.15s",
                    }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                )}
                {s === "choose" ? "METHOD" : "ASSIGN"}
              </div>
            );
          })}
        </div>

        {/* ── Step content — keyed so React remounts on step change, firing CSS animation ── */}
        <div key={step} className={stepAnimClass}>
          {step === "choose" ? (
            /* ════ STEP 1: choose method ════ */
            <div className="p-4 flex flex-col gap-3">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
                HOW SHOULD THE HOST BE REASSIGNED?
              </p>

              {/* Option A — auto */}
              <button
                onClick={onLeaveRandom}
                className="brut-press w-full text-left p-3 flex flex-col gap-1"
                style={{
                  border: "2px solid var(--brut-ink)",
                  background: "transparent",
                  boxShadow: "var(--brut-shadow-sm)",
                }}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="text-[9px] px-1.5 py-0.5 font-bold uppercase tracking-widest"
                    style={{
                      border: "1px solid var(--brut-ink)",
                      background: "var(--brut-ink)",
                      color: "var(--canvas-bg)",
                    }}
                  >
                    AUTO
                  </span>
                  <span className="text-xs font-bold uppercase tracking-widest">
                    RANDOM ASSIGN
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground tracking-wide">
                  System promotes the longest-waiting player.
                </p>
              </button>

              {/* Option B — pick */}
              <button
                onClick={eligible.length > 0 ? goToPick : undefined}
                disabled={eligible.length === 0}
                className="brut-press w-full text-left p-3 flex flex-col gap-1"
                style={{
                  border: "2px solid var(--primary)",
                  background: "transparent",
                  boxShadow: "4px 4px 0px var(--primary)",
                  opacity: eligible.length === 0 ? 0.4 : 1,
                  cursor: eligible.length === 0 ? "not-allowed" : "pointer",
                }}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="text-[9px] px-1.5 py-0.5 font-bold uppercase tracking-widest"
                    style={{
                      border: "1px solid var(--primary)",
                      background: "var(--primary)",
                      color: "oklch(0.975 0.01 80)",
                    }}
                  >
                    PICK
                  </span>
                  <span
                    className="text-xs font-bold uppercase tracking-widest"
                    style={{ color: "var(--primary)" }}
                  >
                    CHOOSE HOST
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground tracking-wide">
                  {eligible.length === 0
                    ? "No eligible players to promote."
                    : "Select who takes over before you go."}
                </p>
              </button>
            </div>
          ) : (
            /* ════ STEP 2: pick a player ════ */
            <div className="flex flex-col">
              <div
                className="px-4 py-2 text-[10px] uppercase tracking-widest text-muted-foreground"
                style={{ borderBottom: "1.5px solid var(--border)" }}
              >
                SELECT NEW HOST
              </div>

              {/* Player list */}
              <div className="flex flex-col max-h-52 overflow-y-auto">
                {eligible.map((p) => {
                  const isSelected = selected === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setSelected(p.id)}
                      className="brut-press flex items-center gap-3 px-4 py-3 text-left w-full"
                      style={{
                        borderBottom: "1px solid var(--border)",
                        borderLeft: isSelected
                          ? "3px solid var(--primary)"
                          : "3px solid transparent",
                        background: isSelected
                          ? "color-mix(in oklch, var(--primary) 8%, transparent)"
                          : "transparent",
                        transition: "border-left-color 0.1s, background 0.1s",
                      }}
                    >
                      {/* Checkbox square */}
                      <div
                        className="w-3 h-3 shrink-0 flex items-center justify-center"
                        style={{
                          border: `1.5px solid ${isSelected ? "var(--primary)" : "var(--border)"}`,
                          background: isSelected
                            ? "var(--primary)"
                            : "transparent",
                          transition: "border-color 0.1s, background 0.1s",
                        }}
                      >
                        {isSelected && (
                          <span
                            className="font-bold"
                            style={{
                              color: "oklch(0.975 0.01 80)",
                              fontSize: "7px",
                              lineHeight: 1,
                            }}
                          >
                            ▣
                          </span>
                        )}
                      </div>

                      {/* Avatar */}
                      <div
                        className="w-6 h-6 shrink-0 flex items-center justify-center font-mono font-bold text-[10px]"
                        style={{
                          background: isSelected
                            ? "var(--primary)"
                            : "var(--secondary)",
                          color: isSelected
                            ? "oklch(0.975 0.010 80)"
                            : "var(--foreground)",
                          border: isSelected
                            ? "none"
                            : "1px solid var(--border)",
                          transition: "background 0.1s, color 0.1s",
                        }}
                      >
                        {p.userName.charAt(0).toUpperCase()}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-[11px] uppercase tracking-wider truncate">
                          {p.userName}
                        </div>
                        <div className="text-[9px] text-muted-foreground">
                          {scores[p.id] ?? 0} PTS
                        </div>
                      </div>

                      {isSelected && (
                        <span
                          className="text-[9px] uppercase tracking-widest font-bold shrink-0 confirm-leave-enter"
                          style={{ color: "var(--primary)" }}
                        >
                          SELECTED
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Footer actions */}
              <div
                className="flex items-center gap-2 p-3"
                style={{ borderTop: "1.5px solid var(--border)" }}
              >
                <button
                  onClick={goBack}
                  className="brut-press font-mono text-[10px] uppercase tracking-widest px-3 py-2 bg-transparent shrink-0"
                  style={{
                    border: "1.5px solid var(--border)",
                    color: "var(--muted-foreground)",
                  }}
                >
                  ← BACK
                </button>
                <button
                  onClick={
                    selected ? () => onLeaveWithTransfer(selected) : undefined
                  }
                  disabled={!selected}
                  className="brut-press flex-1 font-mono text-[10px] uppercase tracking-widest py-2 px-3 font-bold"
                  style={{
                    border: "2px solid var(--primary)",
                    background: selected ? "var(--primary)" : "transparent",
                    color: selected
                      ? "oklch(0.975 0.01 80)"
                      : "var(--muted-foreground)",
                    opacity: selected ? 1 : 0.45,
                    cursor: selected ? "pointer" : "not-allowed",
                    transition: "background 0.12s, color 0.12s, opacity 0.12s",
                  }}
                >
                  TRANSFER + LEAVE →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
