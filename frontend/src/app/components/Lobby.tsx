"use client";

import { useState } from "react";
import { CreateRoomTab, JoinByCodeTab, BrowseRoomsTab } from "./LobbyTabs";

type Tab = "browse" | "create" | "join";

const TABS: { id: Tab; label: string }[] = [
  { id: "browse", label: "BROWSE ROOMS" },
  { id: "create", label: "CREATE ROOM" },
  { id: "join", label: "JOIN BY CODE" },
];

// NOTE: Placeholder to look nice, modify later
const SIDEBAR: { field: string; description: string }[] = [
  { field: "Per Turn", description: "60s" },
  { field: "Rounds", description: "8" },
  { field: "Max Players", description: "10" },
];

export function Lobby() {
  const [activeTab, setActiveTab] = useState<Tab>("browse");
  const [defaultDisplayName, setDefaultDisplayName] = useState("");
  const [codeInput, setCodeInput] = useState<string[]>(Array(6).fill(""));

  const tabContent = (
    <>
      {activeTab === "browse" && (
        <BrowseRoomsTab defaultDisplayName={defaultDisplayName} />
      )}
      {activeTab === "create" && (
        <CreateRoomTab defaultDisplayName={defaultDisplayName} />
      )}
      {activeTab === "join" && (
        <JoinByCodeTab
          defaultDisplayName={defaultDisplayName}
          codeInput={codeInput}
          setCodeInput={setCodeInput}
        />
      )}
    </>
  );

  const tabBar = (
    <div className="flex gap-8 px-6 border-b-2 border-foreground bg-card">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`py-4 text-xs uppercase tracking-widest font-bold transition-all ${
            activeTab === tab.id
              ? "border-b-2 border-accent text-foreground"
              : "border-b-2 border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );

  const callsign = (
    <div className="border-2 border-foreground p-4 bg-card shadow-[4px_4px_0_0_hsl(var(--foreground))]">
      <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
        {"// YOUR CALLSIGN"}
      </p>
      <input
        type="text"
        value={defaultDisplayName}
        onChange={(e) => setDefaultDisplayName(e.target.value)}
        placeholder="ENTER USERNAME..."
        maxLength={24}
        className="w-full border-2 border-foreground bg-input px-3 py-2 text-sm tracking-wider placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background"
      />
      <div className="flex items-center gap-3 mt-4">
        <button className="border-2 border-foreground w-8 h-8 flex items-center justify-center font-bold text-accent hover:bg-accent hover:text-accent-foreground transition-colors">
          {defaultDisplayName === ""
            ? "?"
            : defaultDisplayName.charAt(0).toUpperCase()}
        </button>
        <span className="text-xs uppercase tracking-widest text-muted-foreground">
          {defaultDisplayName === ""
            ? "ANONYMOUS ARTIST"
            : defaultDisplayName.toUpperCase()}
        </span>
      </div>
    </div>
  );

  const topArtists = (
    <div className="border-2 border-foreground p-4 bg-card shadow-[4px_4px_0_0_hsl(var(--foreground))]">
      <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
        {"// TOP ARTISTS TODAY"}
      </p>
      <div className="space-y-2 font-mono text-sm">
        {[
          { rank: "01", name: "XENO DRAWS", score: "4820" },
          { rank: "02", name: "BRUSHMSTR", score: "3910" },
          { rank: "03", name: "PIXEL_OVERLORD", score: "3740" },
          { rank: "04", name: "SCRIBBLE_LORD", score: "2990" },
        ].map((artist) => (
          <div
            key={artist.rank}
            className="flex items-center justify-between text-xs"
          >
            <div>
              <span className="text-muted-foreground">{artist.rank}</span>
              <span className="ml-3">{artist.name}</span>
            </div>
            <span className="text-accent font-bold">{artist.score}</span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── Large screen layout ── */}
      <div className="hidden lg:block">
        {/* Top header bar */}
        <header className="border-b border-foreground/30 px-6 py-2 flex items-center justify-between text-xs font-mono">
          <span className="font-bold uppercase tracking-wider">
            ● SKRIBBLE SCRAB — DRAW OR DIE
          </span>
          <div className="flex items-center gap-6 text-muted-foreground">
            <span>
              <span className="text-foreground font-bold">247</span> ONLINE
            </span>
            <span>
              <span className="text-foreground font-bold">38</span> ROOMS
            </span>
            <span className="border border-foreground text-foreground px-2 py-0.5 font-bold">
              V2.4.1
            </span>
          </div>
        </header>

        {/* Centered container */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex gap-6 items-start">
            {/* Left sidebar */}
            <aside className="w-96 shrink-0 flex flex-col gap-3">
              {/* Title + stats box */}
              <div
                className="p-6 bg-card"
                style={{
                  border: "2px solid var(--brut-ink)",
                  boxShadow: "4px 4px 0px var(--brut-ink)",
                }}
              >
                <div className="flex items-end justify-between gap-2">
                  <h1 className="font-black uppercase leading-none tracking-tighter">
                    <span className="block text-4xl">SKRI</span>
                    <span className="block text-4xl text-accent">BBLE</span>
                    <span className="block text-4xl">SCRAB</span>
                  </h1>
                  {/* Silhouette */}
                  <svg
                    viewBox="0 0 60 80"
                    className="w-14 h-20 shrink-0 opacity-15"
                    fill="currentColor"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    {/* Head */}
                    <circle cx="38" cy="10" r="7" />
                    {/* Body leaning forward */}
                    <path d="M38 17 C38 17 30 22 24 30 C20 35 18 40 18 40 L26 42 C26 42 28 38 30 35 L32 50 L28 65 L36 65 L38 52 L40 65 L48 65 L44 50 L46 34 C46 34 52 28 54 24 L48 20 C48 20 44 26 40 28 L38 17Z" />
                    {/* Arm reaching forward to draw */}
                    <path d="M24 30 L8 44 L12 48 L28 36Z" />
                    {/* Pencil/pen */}
                    <rect
                      x="4"
                      y="43"
                      width="6"
                      height="2"
                      rx="1"
                      transform="rotate(-45 4 43)"
                    />
                  </svg>
                </div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground mt-3 leading-relaxed">
                  MULTIPLAYER DRAWING GAME
                  <br />
                  BUILT RAW. NO FLUFF.
                </p>
                <hr className="border-foreground my-3" />
                <div className="grid grid-cols-3 gap-2">
                  {SIDEBAR.map((side) => (
                    <div
                      key={side.field}
                      className="border-2 border-foreground p-2 text-center"
                    >
                      <div className="text-accent font-black text-[16px]">
                        {side.description}
                      </div>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5 leading-tight">
                        {side.field}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {callsign}
              {topArtists}
            </aside>

            {/* Right: tabs + content */}
            <div className="flex-1 min-w-0 border-2 border-foreground">
              {tabBar}
              <div className="p-6">{tabContent}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Small screen layout  ── */}
      <div className="lg:hidden">
        <header className="border-b-2 border-foreground px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold uppercase tracking-tighter leading-tight">
                SKRIBBLE SCRAB
              </h1>
              <p className="text-xs tracking-widest text-muted-foreground mt-1">
                MULTIPLAYER DRAWING GAME
              </p>
            </div>

            <div className="flex items-center gap-8 text-sm font-mono">
              <div className="text-right">
                <div className="font-bold">247</div>
                <div className="text-xs text-muted-foreground uppercase tracking-widest">
                  ONLINE
                </div>
              </div>
              <div className="w-px h-8 bg-border" />
              <div className="text-right">
                <div className="font-bold">38</div>
                <div className="text-xs text-muted-foreground uppercase tracking-widest">
                  ROOMS
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-360  mx-auto p-6 space-y-6">
          {/* Game Info */}
          <div
            className="border-2 p-6 bg-card"
            style={{
              border: "2px solid var(--brut-ink)",
              boxShadow: "4px 4px 0px var(--brut-ink)",
            }}
          >
            <div className="flex flex-row justify-between">
              <div className="flex flex-col space-y-2 ">
                <h2 className="text-5xl font-bold uppercase tracking-tighter leading-tight mb-6">
                  <span>SKRIBBLE</span>
                  <br />
                  <span className="text-accent">SCRAB</span>
                </h2>
                <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
                  REAL-TIME MULTIPLAYER DRAWING GAME <br />
                  BUILT RAW. NO FLUFF.
                </p>
              </div>

              {/* Silhouette */}
              <svg
                viewBox="0 0 60 80"
                className="w-32 h-40 shrink-0 opacity-15 mr-5"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Head */}
                <circle cx="38" cy="10" r="7" />
                {/* Body leaning forward */}
                <path d="M38 17 C38 17 30 22 24 30 C20 35 18 40 18 40 L26 42 C26 42 28 38 30 35 L32 50 L28 65 L36 65 L38 52 L40 65 L48 65 L44 50 L46 34 C46 34 52 28 54 24 L48 20 C48 20 44 26 40 28 L38 17Z" />
                {/* Arm reaching forward to draw */}
                <path d="M24 30 L8 44 L12 48 L28 36Z" />
                {/* Pencil/pen */}
                <rect
                  x="4"
                  y="43"
                  width="6"
                  height="2"
                  rx="1"
                  transform="rotate(-45 4 43)"
                />
              </svg>
            </div>

            <div className="grid grid-cols-3 gap-3 mt-6 pt-6 border-t-2 border-foreground">
              {SIDEBAR.map((side) => (
                <div
                  key={side.field}
                  className="bg-secondary border-2 border-foreground p-4 text-center"
                >
                  <div className="text-accent font-black">
                    {side.description}
                  </div>
                  <div className="text-xs text-muted-foreground uppercase tracking-widest mt-1">
                    {side.field}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {callsign}
          {topArtists}

          {/* Tabs */}
          <div className="border-2 border-foreground">
            {tabBar}
            <div className="p-6">{tabContent}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
