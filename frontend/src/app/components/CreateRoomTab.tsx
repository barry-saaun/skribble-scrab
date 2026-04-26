"use client";

import { useTransition, useEffect, useState } from "react";
import { createRoom } from "../actions";
import type { ActionResult } from "../actions";
import { ErrorCode, errorMessages } from "~/types/errors";
import { USERNAME_REGEX } from "~/types/events";
import { toast } from "sonner";
import React from "react";
import type { components } from "~/api/v1";

type Visibility = components["schemas"]["Visibility"];

const VISIBILITY_OPTIONS: {
  value: Visibility;
  label: string;
  lines: string[];
  svgPaths: React.ReactNode;
}[] = [
  {
    value: "public",
    label: "PUBLIC",
    lines: ["LISTED IN BROWSE.", "OPEN TO ALL."],
    svgPaths: (
      <>
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </>
    ),
  },
  {
    value: "private",
    label: "PRIVATE",
    lines: ["INVITE ONLY.", "HOST ADMITS."],
    svgPaths: (
      <>
        <rect x="3" y="11" width="18" height="11" rx="0" ry="0" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </>
    ),
  },
];

function CreateRoomTab({
  playerID,
  defaultDisplayName,
}: {
  playerID: string;
  defaultDisplayName: string;
}) {
  const [state, setState] = useState<ActionResult>(null);
  const [isPending, startTransition] = useTransition();
  const [visibility, setVisibility] = useState<Visibility>("public");
  const [roomName, setRoomName] = useState<string>("");
  const isDisabled =
    !playerID || !USERNAME_REGEX.test(defaultDisplayName) || !roomName;

  useEffect(() => {
    if (!state?.error) return;
    const code = state.error;
    const known = code in ErrorCode ? (code as keyof typeof ErrorCode) : null;
    toast.error(known ? "FAILED TO CREATE ROOM" : "NETWORK ERROR", {
      description: known
        ? errorMessages[ErrorCode[known]]
        : "Could not reach the server. Please try again.",
    });
  }, [state]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await createRoom({
        hostID: playerID,
        hostUsername: defaultDisplayName,
        hostDisplayName: defaultDisplayName,
        config: { visibility, name: roomName, maxPlayers: 10 },
      });
      setState(result);
    });
  }

  return (
    <div className="flex justify-center">
      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4">
        <div>
          <label className="mb-2 block text-xs uppercase tracking-widest text-muted-foreground">
            {"//"} ROOM SETTINGS
          </label>
          <div className="grid grid-cols-3 gap-3">
            <div className="border-2 border-foreground p-4 text-center">
              <div className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">
                Rounds
              </div>
              <div className="font-bold text-accent">8</div>
            </div>
            <div className="border-2 border-foreground p-4 text-center">
              <div className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">
                Time Per Turn
              </div>
              <div className="font-bold text-accent">60S</div>
            </div>
            <div className="border-2 border-foreground p-4 text-center">
              <div className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">
                Hint Delay
              </div>
              <div className="font-bold text-accent">30S</div>
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground opacity-50">
            {"//"} CONFIGURATION OPTIONS COMING SOON
          </p>
        </div>

        <div>
          <label className="mb-2 block text-xs uppercase tracking-widest text-muted-foreground">
            ROOM NAME
          </label>

          <input
            type="text"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            placeholder="ENTER YOUR ROOM NAME..."
            maxLength={20}
            className="w-full border-2 border-foreground bg-input px-3 py-2 text-sm tracking-wider placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background"
          />
          {/* {roomName && !USERNAME_REGEX.test(roomName) && ( */}
          {/*   <p className="mt-2 text-xs text-destructive uppercase tracking-wider"> */}
          {/*     3–20 CHARS · LETTERS, NUMBERS, _ OR - · NO SPACES */}
          {/*   </p> */}
          {/* )} */}
        </div>

        <div>
          <label className="mb-2 block text-xs uppercase tracking-widest text-muted-foreground">
            ROOM VISIBILITY
          </label>
          <div className="grid grid-cols-2 gap-3">
            {VISIBILITY_OPTIONS.map((opt) => {
              const selected = visibility === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setVisibility(opt.value)}
                  className="relative cursor-pointer p-4 text-left transition-all"
                  style={{
                    border: selected
                      ? "2px solid var(--brut-ink)"
                      : "2px solid var(--border)",
                    background: selected ? "var(--card)" : "var(--secondary)",
                    boxShadow: selected
                      ? "4px 4px 0px var(--brut-ink)"
                      : "none",
                    transform: selected ? "translate(-2px, -2px)" : "none",
                  }}
                >
                  {selected && (
                    <div
                      className="absolute -top-1 -right-1 font-mono text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5"
                      style={{
                        background: "var(--primary)",
                        color: "var(--primary-foreground)",
                        transform: "rotate(3deg)",
                      }}
                    >
                      SELECTED
                    </div>
                  )}
                  <div
                    className="w-10 h-10 flex items-center justify-center mb-3"
                    style={{
                      border: "2px solid var(--brut-ink)",
                      background: selected
                        ? "var(--primary)"
                        : "var(--background)",
                      color: selected
                        ? "var(--primary-foreground)"
                        : "var(--brut-ink)",
                    }}
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      {opt.svgPaths}
                    </svg>
                  </div>
                  <div className="font-mono font-bold text-sm uppercase tracking-wider text-foreground mb-1">
                    {opt.label}
                  </div>
                  <div className="font-mono text-[10px] text-muted-foreground leading-relaxed">
                    {opt.lines.map((line, i) => (
                      <React.Fragment key={line}>
                        {line}
                        {i < opt.lines.length - 1 && <br />}
                      </React.Fragment>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="submit"
          disabled={isDisabled || isPending}
          className={`brut-press w-full border-2 px-4 py-3 text-sm font-bold uppercase ${
            isDisabled || isPending
              ? "cursor-not-allowed border-muted bg-muted text-muted-foreground opacity-50"
              : "cursor-pointer text-background border-accent bg-accent"
          }`}
        >
          {isPending
            ? "CREATING..."
            : `CREATE ${visibility === "private" ? "PRIVATE" : "PUBLIC"} ROOM`}
        </button>
      </form>
    </div>
  );
}

export default CreateRoomTab;
