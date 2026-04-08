import Link from "next/link";
import {
  fullPageErrorCodes,
  fullPageErrorMessages,
  fullPageErrorTitles,
  type FullPageErrorCodes,
} from "~/types/errors";

const KNOWN_FULL_PAGE_CODES = new Set<string>(fullPageErrorCodes);

function resolveError(code: string | undefined): {
  title: string;
  message: string;
} {
  if (!code || !KNOWN_FULL_PAGE_CODES.has(code)) {
    return {
      title: "SOMETHING WENT WRONG",
      message:
        "An unexpected error occurred. Please check your link and try again.",
    };
  }

  const errorCode = code as FullPageErrorCodes;
  return {
    title: fullPageErrorTitles[errorCode],
    message: fullPageErrorMessages[errorCode],
  };
}

type SearchParams = {
  code?: string;
  room?: string;
};

type Props = {
  searchParams: Promise<SearchParams>;
};

const ErrorPage = async ({ searchParams }: Props) => {
  const params = await searchParams;

  console.log("[code]:", params.code);

  const { title, message } = resolveError(params.code);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6">
      <div
        className="w-full max-w-lg border-2 border-foreground bg-card p-8"
        style={{ boxShadow: "6px 6px 0px var(--brut-ink)" }}
      >
        <div className="border-2 border-destructive inline-block px-3 py-1 mb-6">
          <span className="text-destructive font-black text-xs uppercase tracking-widest">
            {"//"} ERROR
          </span>
        </div>

        <h1 className="font-black uppercase text-4xl tracking-tighter leading-none mb-4">
          {title}
        </h1>

        <p className="text-sm text-muted-foreground uppercase tracking-wider leading-relaxed mb-8">
          {message}
        </p>

        {params.room && /^[\x20-\x7E]{1,32}$/.test(params.room) && (
          <div className="border-2 border-foreground bg-background px-4 py-3 mb-8 font-mono text-sm">
            <span className="text-muted-foreground uppercase tracking-widest text-xs">
              Room:{" "}
            </span>
            <span className="font-bold">{params.room}</span>
          </div>
        )}

        <Link href="/" className="brut-btn block text-center">
          ← BACK TO LOBBY
        </Link>
      </div>
    </div>
  );
};

export default ErrorPage;
