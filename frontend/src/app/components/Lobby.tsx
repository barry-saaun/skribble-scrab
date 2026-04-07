"use client";

import { useState } from "react";
import { CreateRoomTab, JoinByCodeTab, BrowseRoomsTab } from "./LobbyTabs";

type Tab = "browse" | "create" | "join";

export function Lobby({
  searchParams,
}: {
  searchParams: { error?: string; code?: string };
}) {
  const [activeTab, setActiveTab] = useState<Tab>("create");
  const [defaultDisplayName, setDefaultDisplayName] = useState("");
  const [codeInput, setCodeInput] = useState(searchParams.code || "");

  return (
    <div className="min-h-screen bg-background text-foreground border-t-4 border-b-4 border-foreground">
      {/* Header */}
      <header className="border-b-2 border-foreground px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold uppercase tracking-tighter leading-tight">
              <span>SKRIBBLE SCRAB</span>
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
            <div className="w-px h-8 bg-border" />
            <div className="text-right">
              <div className="font-bold">V2.4.1</div>
              <div className="text-xs text-muted-foreground uppercase tracking-widest">
                VERSION
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Game Info Box */}
            <div className="border-2 border-foreground p-6 bg-card">
              <h2 className="text-3xl font-bold uppercase tracking-tighter leading-tight mb-6">
                <span>SKRIBBLE</span>
                <br />
                <span className="text-accent">SCRAB</span>
              </h2>

              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-4">
                REAL-TIME MULTIPLAYER DRAWING GAME
              </p>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">
                BUILT RAW. NO FLUFF.
              </p>

              {/* Game Stats */}
              <div className="grid grid-cols-3 gap-3 mt-6 pt-6 border-t-2 border-foreground">
                <div className="border-2 border-foreground p-4 text-center">
                  <div className="text-accent font-bold">60S</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-widest mt-1">
                    Per Turn
                  </div>
                </div>
                <div className="border-2 border-foreground p-4 text-center">
                  <div className="text-accent font-bold">8R</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-widest mt-1">
                    Rounds
                  </div>
                </div>
                <div className="border-2 border-foreground p-4 text-center">
                  <div className="text-accent font-bold">10P</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-widest mt-1">
                    Max Players
                  </div>
                </div>
              </div>
            </div>
            {/* Username Section */}
            <div className="border-2 border-foreground p-6 bg-card">
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-4">
                {"//"} YOUR CALLSIGN
              </p>
              <input
                type="text"
                value={defaultDisplayName}
                onChange={(e) => setDefaultDisplayName(e.target.value)}
                placeholder="ENTER USERNAME..."
                maxLength={24}
                className="w-full border-2 border-foreground bg-input px-3 py-2 text-sm  tracking-wider placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background"
              />
              <div className="flex items-center gap-2 mt-4">
                <button className="border-2 border-foreground w-8 h-8 flex items-center justify-center font-bold text-accent hover:bg-accent hover:text-accent-foreground transition-colors">
                  {defaultDisplayName === ""
                    ? "?"
                    : defaultDisplayName.charAt(0).toUpperCase()}
                </button>
              </div>
            </div>
            {/* Top Artists */}
            {/* TODO: Just for placeholder, to be implemented later */}
            <div className="border-2 border-foreground p-6 bg-card">
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-4">
                {"//"} TOP ARTISTS TODAY
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
                      <span className="text-muted-foreground">
                        {artist.rank}
                      </span>
                      <span className="ml-3">{artist.name}</span>
                    </div>
                    <span className="text-accent font-bold">
                      {artist.score}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar - Placeholder for later */}
          <div className="lg:col-span-1">
            <div className="border-2 border-foreground p-6 bg-card">
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-4">
                <span className="font-black">QUICK STATS</span>
                <br />
                {"//"} Features Coming Soon
              </p>
              <div className="space-y-3 font-mono text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">YOUR RANK:</span>
                  <span className="text-accent">#2847</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">WINS:</span>
                  <span>12</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">GAMES:</span>
                  <span>47</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-2 border-foreground">
          <div className="border-b-2 border-foreground flex gap-8 px-6">
            {[
              { id: "browse" as Tab, label: "BROWSE ROOMS" },
              { id: "create" as Tab, label: "CREATE ROOM" },
              { id: "join" as Tab, label: "JOIN BY CODE" },
            ].map((tab) => (
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

          {/* Tab Content */}
          <div className="p-6">
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
                error={searchParams.error}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
