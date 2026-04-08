import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6">
      <div
        className="w-full max-w-lg border-2 border-foreground bg-card p-8"
        style={{ boxShadow: "6px 6px 0px var(--brut-ink)" }}
      >
        {/* Label */}
        <div className="border-2 border-foreground inline-block px-3 py-1 mb-6">
          <span className="text-muted-foreground font-black text-xs uppercase tracking-widest">
            {"//"} 404
          </span>
        </div>

        <h1 className="font-black uppercase tracking-tighter leading-none mb-2">
          <span className="block text-8xl text-accent">404</span>
          <span className="block text-3xl mt-2">PAGE NOT FOUND</span>
        </h1>

        <hr className="border-foreground my-6" />

        <p className="text-sm text-muted-foreground uppercase tracking-wider leading-relaxed mb-8">
          Whatever you were looking for, it doesn&apos;t exist here, brochacho.
          <br />
          Check the URL or head back to the lobby.
        </p>

        <Link href="/" className="brut-btn block text-center">
          ← BACK TO LOBBY
        </Link>
      </div>
    </div>
  );
}
