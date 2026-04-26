import { useTransition, useEffect, useState } from "react";
import {
  ErrorCode,
  toastErrorMessages,
  toastErrorTitles,
} from "~/types/errors";
import { USERNAME_REGEX } from "~/types/events";
import { joinRoomAction } from "../actions";
import type { ActionResult } from "../actions";
import { toast } from "sonner";
import React from "react";

function JoinByCodeTab({
  playerID,
  defaultDisplayName,
  codeInput,
  setCodeInput,
}: {
  playerID: string;
  defaultDisplayName: string;
  codeInput: string[];
  setCodeInput: (value: string[]) => void;
}) {
  const [state, setState] = useState<ActionResult>(null);
  const [isPending, startTransition] = useTransition();
  const roomCode = codeInput.join("");
  const isDisabled =
    !playerID ||
    !USERNAME_REGEX.test(defaultDisplayName) ||
    codeInput.some((char) => !char);

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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await joinRoomAction({ playerID, displayName: defaultDisplayName, roomCode });
      setState(result);
    });
  }

  return (
    <div className="flex justify-center">
      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-6">
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

        <button
          type="submit"
          disabled={isDisabled || isPending}
          className={`brut-press w-full border-2 px-4 py-3 text-sm font-bold uppercase ${
            isDisabled || isPending
              ? "cursor-not-allowed border-muted bg-muted text-muted-foreground opacity-50"
              : "cursor-pointer border-foreground bg-accent text-accent-foreground hover:opacity-90"
          }`}
        >
          {isPending ? "JOINING..." : "JOIN ROOM"}
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

export default JoinByCodeTab;
