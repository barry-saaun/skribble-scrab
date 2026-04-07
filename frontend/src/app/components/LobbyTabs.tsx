import { createRoom, joinRoomAction } from "../actions";
import { ErrorCode, errorMessages } from "~/types/events";

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
  const isDisabled = !defaultDisplayName;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">
          {"//"} {PLACEHOLDER_ROOMS.length} ACTIVE ROOMS
        </p>
        <button className="border-2 border-foreground px-3 py-1 text-xs font-bold uppercase hover:bg-foreground hover:text-background transition-colors cursor-pointer">
          REFRESH
        </button>
      </div>

      <div className="space-y-3">
        {PLACEHOLDER_ROOMS.map((room) => (
          <div
            key={room.code}
            className="border-2 border-foreground p-4 flex items-center justify-between shadow-[4px_4px_0_0_hsl(var(--foreground))]"
          >
            <div>
              <div className="flex items-center gap-2 flex-wrap">
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
              <p className="text-xs text-muted-foreground mt-1">
                {room.players}/{room.maxPlayers} PLAYERS &nbsp;•&nbsp; ROUND{" "}
                {room.round}/{room.maxRounds} &nbsp;•&nbsp; {room.code}
              </p>
              <div className="flex gap-1 mt-2">
                {[...Array(room.maxPlayers)].map((_, i) => (
                  <div
                    key={i}
                    className={`h-2 w-4 ${i < room.players ? "bg-accent" : "bg-border"}`}
                  />
                ))}
              </div>
            </div>
            <button
              disabled={isDisabled}
              className={`border-2 px-4 py-2 text-xs font-bold uppercase transition-all flex-shrink-0 ml-4 ${
                isDisabled
                  ? "border-muted bg-muted text-muted-foreground cursor-not-allowed opacity-50"
                  : "border-accent bg-accent text-accent-foreground hover:opacity-90 cursor-pointer"
              }`}
            >
              {room.status === "WAITING" ? "JOIN" : "SPECTATE"}
            </button>
          </div>
        ))}
      </div>

      {/* Quick Play */}
      <div className="border-2 border-foreground p-4 flex items-center justify-between mt-4 shadow-[4px_4px_0_0_hsl(var(--foreground))]">
        <div>
          <h3 className="font-bold uppercase">QUICK PLAY</h3>
          <p className="text-xs text-muted-foreground mt-1 uppercase tracking-widest">
            DROP INTO THE BEST AVAILABLE ROOM INSTANTLY
          </p>
        </div>
        <button
          disabled={isDisabled}
          className={`border-2 px-4 py-2 text-xs font-bold uppercase transition-all flex-shrink-0 ml-4 ${
            isDisabled
              ? "border-muted bg-muted text-muted-foreground cursor-not-allowed opacity-50"
              : "border-accent bg-accent text-accent-foreground hover:opacity-90 cursor-pointer"
          }`}
        >
          QUICK PLAY
        </button>
      </div>
    </div>
  );
}

function CreateRoomTab({ defaultDisplayName }: { defaultDisplayName: string }) {
  const isDisabled = !defaultDisplayName;

  return (
    <div className="flex justify-center">
      <form action={createRoom} className="space-y-4 w-full max-w-md">
        <input
          type="hidden"
          name="displayName"
          value={defaultDisplayName || "Anonymous Artist"}
        />

        <div>
          <label className="text-xs uppercase tracking-widest text-muted-foreground block mb-2">
            {"//"} ROOM SETTINGS
          </label>
          <div className="grid grid-cols-3 gap-3">
            <div className="border-2 border-foreground p-4 text-center">
              <div className="text-muted-foreground text-xs uppercase tracking-widest mb-2">
                Rounds
              </div>
              <div className="text-accent font-bold">8</div>
            </div>
            <div className="border-2 border-foreground p-4 text-center">
              <div className="text-muted-foreground text-xs uppercase tracking-widest mb-2">
                Time Per Turn
              </div>
              <div className="text-accent font-bold">60S</div>
            </div>
            <div className="border-2 border-foreground p-4 text-center">
              <div className="text-muted-foreground text-xs uppercase tracking-widest mb-2">
                Hint Delay
              </div>
              <div className="text-accent font-bold">30S</div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3 opacity-50">
            {"//"} CONFIGURATION OPTIONS COMING SOON
          </p>
        </div>

        <button
          type="submit"
          disabled={isDisabled}
          className={`w-full border-2 px-4 py-3 text-sm font-bold uppercase transition-all ${
            isDisabled
              ? "border-muted bg-muted text-muted-foreground cursor-not-allowed opacity-50"
              : "border-foreground bg-foreground text-background hover:bg-accent hover:border-accent hover:text-accent-foreground cursor-pointer"
          }`}
        >
          CREATE ROOM &amp; JOIN
        </button>
      </form>
    </div>
  );
}

function JoinByCodeTab({
  defaultDisplayName,
  codeInput,
  setCodeInput,
  error,
}: {
  defaultDisplayName: string;
  codeInput: string;
  setCodeInput: (value: string) => void;
  error?: string;
}) {
  const isDisabled = !defaultDisplayName.trim() || codeInput.length !== 6;

  return (
    <div className="flex justify-center">
      <form action={joinRoomAction} className="space-y-6 w-full max-w-md">
        {error && (
          <div className="border-2 border-destructive bg-background p-3">
            <p className="text-sm text-destructive font-mono">
              {errorMessages[error as ErrorCode] ?? "Something went wrong."}
            </p>
          </div>
        )}

        <div>
          <label className="text-xs uppercase tracking-widest text-muted-foreground block mb-4">
            {"//"} ENTER ROOM ACCESS CODE
          </label>
          <RoomCodeInput value={codeInput} onChange={setCodeInput} />
          <p className="text-xs text-muted-foreground mt-4 text-center">
            ASK THE ROOM HOST FOR THE CODE.
            <br />
            CODES ARE CASE-SENSITIVE.
          </p>
        </div>

        {/* <div> */}
        {/*   <label */}
        {/*     htmlFor="displayName" */}
        {/*     className="text-xs uppercase tracking-widest text-muted-foreground block mb-2" */}
        {/*   > */}
        {/*     {"//"} YOUR NAME */}
        {/*   </label> */}
        {/*   <input */}
        {/*     id="displayName" */}
        {/*     name="displayName" */}
        {/*     type="text" */}
        {/*     required */}
        {/*     maxLength={24} */}
        {/*     value={displayName} */}
        {/*     onChange={(e) => setDisplayName(e.target.value)} */}
        {/*     className="w-full border-2 border-foreground bg-input px-3 py-2 text-sm  tracking-wider placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background" */}
        {/*   /> */}
        {/* </div> */}

        <input type="hidden" name="roomCode" value={codeInput} />
        <input type="hidden" name="displayName" value={defaultDisplayName} />

        <button
          type="submit"
          disabled={isDisabled}
          className={`w-full border-2 px-4 py-3 text-sm font-bold uppercase transition-all ${
            isDisabled
              ? "border-muted bg-muted text-muted-foreground cursor-not-allowed opacity-50"
              : "border-foreground bg-accent text-accent-foreground hover:opacity-90 cursor-pointer"
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
  value: string;
  onChange: (value: string) => void;
}) {
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      const newValue = value.slice(0, index) + value.slice(index + 1);
      onChange(newValue);
      if (index > 0) {
        document.getElementById(`code-input-${index - 1}`)?.focus();
      }
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      if (index > 0) {
        document.getElementById(`code-input-${index - 1}`)?.focus();
      }
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      if (index < 5) {
        document.getElementById(`code-input-${index + 1}`)?.focus();
      }
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number,
  ) => {
    const char = e.currentTarget.value.slice(-1);

    if (!/^[A-Za-z0-9]?$/.test(char)) return;

    const newValue = value.slice(0, index) + char + value.slice(index + 1);
    onChange(newValue);

    if (char && index < 5) {
      document.getElementById(`code-input-${index + 1}`)?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent, index: number) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/[^A-Za-z0-9]/g, "")
      .slice(0, 6 - index);
    if (!pasted) return;
    const newValue = (
      value.slice(0, index) +
      pasted +
      value.slice(index + pasted.length)
    ).slice(0, 6);
    onChange(newValue);
    const nextIndex = Math.min(index + pasted.length, 5);
    document.getElementById(`code-input-${nextIndex}`)?.focus();
  };

  const slots = Array.from({ length: 6 }, (_, i) => value[i] || "");

  return (
    <div className="border-2 border-foreground bg-input p-8">
      <div className="flex justify-center gap-6 mb-2">
        {slots.map((char, i) => (
          <input
            key={i}
            id={`code-input-${i}`}
            type="text"
            inputMode="text"
            maxLength={1}
            value={char}
            onChange={(e) => handleChange(e, i)}
            onKeyDown={(e) => handleKeyDown(e, i)}
            onPaste={(e) => handlePaste(e, i)}
            className="w-12 h-12 text-center text-3xl font-bold text-accent bg-transparent outline-none cursor-text"
          />
        ))}
      </div>
      <div className="flex justify-center gap-6 text-muted-foreground">
        {slots.map((_, i) => (
          <div key={i} className="w-12 text-center text-lg leading-none">
            _
          </div>
        ))}
      </div>
    </div>
  );
}

export { JoinByCodeTab, BrowseRoomsTab, CreateRoomTab };
