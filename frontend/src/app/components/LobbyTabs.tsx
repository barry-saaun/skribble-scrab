import { createRoom } from "../actions";
import { joinRoomAction } from "../join/actions";
import { ErrorCode, errorMessages } from "~/types/events";

function BrowseRoomsTab({
  defaultDisplayName,
}: {
  defaultDisplayName: string;
}) {
  const isDisabled = !defaultDisplayName;

  return (
    <div>
      <p className="text-xs uppercase tracking-widest text-muted-foreground mb-4">
        {"//"} 4 ACTIVE ROOMS
      </p>
      <div className="space-y-3">
        <div className="border-2 border-foreground p-4 flex items-center justify-between">
          <div>
            <h3 className="font-bold uppercase">CHAOS DRAWING CLUB</h3>
            <p className="text-xs text-muted-foreground mt-1">
              5/8 PLAYERS • ROUND 6/10 • rm_001
            </p>
            <div className="flex gap-1 mt-2">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className={`h-2 w-4 ${i < 5 ? "bg-accent" : "bg-border"}`}
                />
              ))}
            </div>
          </div>
          <button
            disabled={isDisabled}
            className={`border-2 px-4 py-2 text-xs font-bold uppercase transition-all ${
              isDisabled
                ? "border-muted bg-muted text-muted-foreground cursor-not-allowed opacity-50"
                : "border-accent bg-accent text-accent-foreground hover:opacity-90 cursor-pointer"
            }`}
          >
            SPECTATE
          </button>
        </div>

        <div className="border-2 border-foreground p-4 flex items-center justify-between">
          <div>
            <h3 className="font-bold uppercase">
              SPEED ROUND HELL{" "}
              <span className="border-2 border-destructive text-destructive px-2 py-1 text-xs ml-2">
                WAITING
              </span>
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              2/6 PLAYERS • ROUND 0/8 • rm_002
            </p>
            <div className="flex gap-1 mt-2">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className={`h-2 w-4 ${i < 2 ? "bg-accent" : "bg-border"}`}
                />
              ))}
            </div>
          </div>
          <button
            disabled={isDisabled}
            className={`border-2 px-4 py-2 text-xs font-bold uppercase transition-all ${
              isDisabled
                ? "border-muted bg-muted text-muted-foreground cursor-not-allowed opacity-50"
                : "border-accent bg-accent text-accent-foreground hover:opacity-90 cursor-pointer"
            }`}
          >
            JOIN
          </button>
        </div>
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
          CREATE ROOM
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
