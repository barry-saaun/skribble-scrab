"use client";

import React, { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { createRoom, joinRoomAction } from "../actions";
import {
  ErrorCode,
  errorMessages,
  toastErrorTitles,
  toastErrorMessages,
} from "~/types/errors";

// Must mirror backend: ^[a-zA-Z0-9][a-zA-Z0-9_-]{1,18}[a-zA-Z0-9]$
export const USERNAME_REGEX = /^[a-zA-Z0-9][a-zA-Z0-9_-]{1,18}[a-zA-Z0-9]$/;

const PLACEHOLDER_ROOMS = [
  {
    name: "CHAOS DRAWING CLUB",
    status: "IN PROGRESS",
    players: 5,
    maxPlayers: 8,
    round: 6,
    maxRounds: 10,
    code: "rm_001",
  },
  {
    name: "SPEED ROUND HELL",
    status: "WAITING",
    players: 2,
    maxPlayers: 6,
    round: 0,
    maxRounds: 8,
    code: "rm_002",
  },
  {
    name: "SILENT ARTISTS ONLY",
    status: "IN PROGRESS",
    players: 7,
    maxPlayers: 8,
    round: 3,
    maxRounds: 6,
    code: "rm_003",
  },
  {
    name: "PICTIONARY VETERANS",
    status: "WAITING",
    players: 1,
    maxPlayers: 10,
    round: 0,
    maxRounds: 12,
    code: "rm_004",
  },
] as const;

function BrowseRoomsTab({
  defaultDisplayName,
}: {
  defaultDisplayName: string;
}) {
  const isDisabled = !USERNAME_REGEX.test(defaultDisplayName);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">
          {"//"} {PLACEHOLDER_ROOMS.length} ACTIVE ROOMS
        </p>
        <button className="brut-press cursor-pointer border-2 border-foreground px-3 py-1 text-xs font-bold uppercase hover:bg-foreground hover:text-background">
          REFRESH
        </button>
      </div>

      <div className="space-y-3">
        {PLACEHOLDER_ROOMS.map((room) => (
          <div
            key={room.code}
            className="flex items-center justify-between border-2 border-foreground p-4 shadow-[4px_4px_0_0_hsl(var(--foreground))]"
          >
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-bold uppercase">{room.name}</h3>
                <span
                  className={`border px-2 py-0.5 text-xs font-bold uppercase ${
                    room.status === "WAITING"
                      ? "border-destructive text-destructive"
                      : "border-foreground text-foreground"
                  }`}
                >
                  {room.status}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {room.players}/{room.maxPlayers} PLAYERS &nbsp;•&nbsp; ROUND{" "}
                {room.round}/{room.maxRounds} &nbsp;•&nbsp; {room.code}
              </p>
              <div className="mt-2 flex gap-1">
                {[...Array(room.maxPlayers)].map((_, i) => (
                  <div
                    key={i}
                    className={`h-2 w-4 ${
                      i < room.players ? "bg-accent" : "bg-border"
                    }`}
                  />
                ))}
              </div>
            </div>
            <button
              disabled={isDisabled}
              className={`brut-press ml-4 shrink-0 border-2 px-4 py-2 text-xs font-bold uppercase ${
                isDisabled
                  ? "cursor-not-allowed border-muted bg-muted text-muted-foreground opacity-50"
                  : "cursor-pointer border-accent bg-accent text-accent-foreground hover:opacity-90"
              }`}
            >
              {room.status === "WAITING" ? "JOIN" : "SPECTATE"}
            </button>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between border-2 border-foreground p-4 shadow-[4px_4px_0_0_hsl(var(--foreground))]">
        <div>
          <h3 className="font-bold uppercase">QUICK PLAY</h3>
          <p className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">
            DROP INTO THE BEST AVAILABLE ROOM INSTANTLY
          </p>
        </div>
        <button
          disabled={isDisabled}
          className={`brut-press ml-4 shrink-0 border-2 px-4 py-2 text-xs font-bold uppercase ${
            isDisabled
              ? "cursor-not-allowed border-muted bg-muted text-muted-foreground opacity-50"
              : "cursor-pointer border-accent bg-accent text-accent-foreground hover:opacity-90"
          }`}
        >
          QUICK PLAY
        </button>
      </div>
    </div>
  );
}

type Visibility = "public" | "private";

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

function CreateRoomTab({ defaultDisplayName }: { defaultDisplayName: string }) {
  const [state, formAction] = useActionState(createRoom, null);
  const [visibility, setVisibility] = useState<Visibility>("public");
  const isDisabled = !USERNAME_REGEX.test(defaultDisplayName);

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

  return (
    <div className="flex justify-center">
      <form action={formAction} className="w-full max-w-md space-y-4">
        <input
          type="hidden"
          name="displayName"
          value={defaultDisplayName || "Anonymous Artist"}
        />
        <input type="hidden" name="visibility" value={visibility} />

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
          disabled={isDisabled}
          className={`brut-press w-full border-2 px-4 py-3 text-sm font-bold uppercase ${
            isDisabled
              ? "cursor-not-allowed border-muted bg-muted text-muted-foreground opacity-50"
              : "cursor-pointer  text-background border-accent bg-accent "
          }`}
        >
          CREATE {visibility === "private" ? "PRIVATE" : "PUBLIC"} ROOM
        </button>
      </form>
    </div>
  );
}

function JoinByCodeTab({
  defaultDisplayName,
  codeInput,
  setCodeInput,
}: {
  defaultDisplayName: string;
  codeInput: string[];
  setCodeInput: (value: string[]) => void;
}) {
  const [state, formAction] = useActionState(joinRoomAction, null);
  const roomCode = codeInput.join("");
  const isDisabled =
    !USERNAME_REGEX.test(defaultDisplayName) || codeInput.some((char) => !char);

  useEffect(() => {
    if (state?.error === ErrorCode.GAME_ALREADY_ACTIVE) {
      toast.error(toastErrorTitles[ErrorCode.GAME_ALREADY_ACTIVE], {
        description: toastErrorMessages[ErrorCode.GAME_ALREADY_ACTIVE],
      });
    }

    if (state?.error === ErrorCode.ROOM_FULL) {
      toast.error(toastErrorTitles[ErrorCode.ROOM_FULL], {
        description: toastErrorMessages[ErrorCode.ROOM_FULL],
      });
    }
  }, [state]);

  return (
    <div className="flex justify-center">
      <form action={formAction} className="w-full max-w-md space-y-6">
        <div>
          <label className="mb-4 block text-xs uppercase tracking-widest text-muted-foreground">
            {"//"} ENTER ROOM ACCESS CODE
          </label>

          <RoomCodeInput value={codeInput} onChange={setCodeInput} />

          <p className="mt-4 text-center text-xs text-muted-foreground">
            ASK THE ROOM HOST FOR THE CODE.
            <br />
            CODES ARE CASE-SENSITIVE.
          </p>
        </div>

        <input type="hidden" name="roomCode" value={roomCode} />
        <input type="hidden" name="displayName" value={defaultDisplayName} />

        <button
          type="submit"
          disabled={isDisabled}
          className={`brut-press w-full border-2 px-4 py-3 text-sm font-bold uppercase ${
            isDisabled
              ? "cursor-not-allowed border-muted bg-muted text-muted-foreground opacity-50"
              : "cursor-pointer border-foreground bg-accent text-accent-foreground hover:opacity-90"
          }`}
        >
          JOIN ROOM
        </button>
      </form>
    </div>
  );
}

function RoomCodeInput({
  value,
  onChange,
}: {
  value: string[];
  onChange: (value: string[]) => void;
}) {
  const inputRefs = React.useRef<Array<HTMLInputElement | null>>([]);
  const [isAllSelected, setIsAllSelected] = React.useState(false);

  const focusInput = (index: number) => {
    const input = inputRefs.current[index];
    if (!input) return;
    input.focus();
    input.select();
  };

  const clearAll = () => {
    onChange(Array(6).fill(""));
  };

  const updateSlot = (index: number, char: string) => {
    const next = [...value];
    next[index] = char;
    onChange(next);
  };

  const clearSlot = (index: number) => {
    const next = [...value];
    next[index] = "";
    onChange(next);
  };

  const selectAllSlots = () => {
    setIsAllSelected(true);

    inputRefs.current.forEach((input) => {
      input?.select();
    });
  };

  const clearAllSelection = () => {
    if (isAllSelected) {
      setIsAllSelected(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number,
  ) => {
    const raw = e.target.value;
    const char = raw.slice(-1);

    if (!char) {
      clearSlot(index);
      clearAllSelection();
      return;
    }

    if (!/^[A-Za-z0-9]$/.test(char)) {
      return;
    }

    if (isAllSelected) {
      const next = Array(6).fill("");
      next[0] = char;
      onChange(next);
      setIsAllSelected(false);

      requestAnimationFrame(() => {
        focusInput(1);
      });

      return;
    }

    updateSlot(index, char);
    clearAllSelection();

    if (index < 5) {
      requestAnimationFrame(() => {
        focusInput(index + 1);
      });
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number,
  ) => {
    const isSelectAllShortcut =
      (e.metaKey || e.ctrlKey) &&
      !e.shiftKey &&
      !e.altKey &&
      e.key.toLowerCase() === "a";

    if (isSelectAllShortcut) {
      e.preventDefault();
      selectAllSlots();
      return;
    }

    if ((e.metaKey || e.ctrlKey || e.altKey) && !isSelectAllShortcut) {
      return;
    }

    if (e.key === "Backspace" || e.key === "Delete") {
      e.preventDefault();

      if (isAllSelected) {
        clearAll();
        setIsAllSelected(false);
        requestAnimationFrame(() => {
          focusInput(0);
        });
        return;
      }

      if (value[index]) {
        clearSlot(index);
        return;
      }

      if (index > 0) {
        clearSlot(index - 1);

        requestAnimationFrame(() => {
          focusInput(index - 1);
        });
      }

      return;
    }

    if (e.key === "ArrowLeft") {
      e.preventDefault();
      clearAllSelection();

      if (index > 0) {
        focusInput(index - 1);
      }

      return;
    }

    if (e.key === "ArrowRight") {
      e.preventDefault();
      clearAllSelection();

      if (index < 5) {
        focusInput(index + 1);
      }

      return;
    }

    if (e.key === "Tab") {
      clearAllSelection();
      return;
    }
  };

  const handlePaste = (
    e: React.ClipboardEvent<HTMLInputElement>,
    index: number,
  ) => {
    e.preventDefault();

    const pasted = e.clipboardData.getData("text").replace(/[^A-Za-z0-9]/g, "");

    if (!pasted) return;

    const startIndex = isAllSelected ? 0 : index;
    const next = isAllSelected ? Array(6).fill("") : [...value];
    const sliced = pasted.slice(0, 6 - startIndex);

    for (let i = 0; i < sliced.length; i += 1) {
      next[startIndex + i] = sliced[i];
    }

    onChange(next);
    setIsAllSelected(false);

    const nextIndex = Math.min(startIndex + sliced.length, 5);

    requestAnimationFrame(() => {
      focusInput(nextIndex);
    });
  };

  const handleCopy = (e: React.ClipboardEvent<HTMLInputElement>) => {
    if (!isAllSelected) return;

    e.preventDefault();
    e.clipboardData.setData("text/plain", value.join(""));
  };

  const handleCut = (e: React.ClipboardEvent<HTMLInputElement>) => {
    if (!isAllSelected) return;

    e.preventDefault();
    e.clipboardData.setData("text/plain", value.join(""));
    clearAll();
    setIsAllSelected(false);

    requestAnimationFrame(() => {
      focusInput(0);
    });
  };

  const handleFocus = (index: number) => {
    if (isAllSelected) {
      setIsAllSelected(false);
    }

    requestAnimationFrame(() => {
      inputRefs.current[index]?.select();
    });
  };

  return (
    <div className="border-2 border-foreground bg-input p-8">
      <div className="mb-2 flex justify-center gap-6">
        {value.map((char, i) => (
          <input
            key={i}
            ref={(el) => {
              inputRefs.current[i] = el;
            }}
            type="text"
            inputMode="text"
            maxLength={1}
            value={char}
            onChange={(e) => handleChange(e, i)}
            onKeyDown={(e) => handleKeyDown(e, i)}
            onPaste={(e) => handlePaste(e, i)}
            onCopy={handleCopy}
            onCut={handleCut}
            onFocus={() => handleFocus(i)}
            className={`h-12 w-12 cursor-text bg-transparent text-center text-3xl font-bold outline-none ${
              isAllSelected ? "text-accent ring-2 ring-accent" : "text-accent"
            }`}
          />
        ))}
      </div>

      <div className="flex justify-center gap-6 text-muted-foreground">
        {value.map((_, i) => (
          <div key={i} className="w-12 text-center text-lg leading-none">
            _
          </div>
        ))}
      </div>
    </div>
  );
}

export { JoinByCodeTab, BrowseRoomsTab, CreateRoomTab };
