import type { Metadata } from "next";
import { Geist, JetBrains_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { cn } from "~/lib/utils";
import { TooltipProvider } from "~/components/ui/tooltip";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Skribble Scrab",
  description: "DRAW or DIE!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn(
        "h-full",
        "antialiased",
        geistSans.variable,
        jetbrainsMono.variable,
      )}
    >
      <body className="min-h-full flex flex-col bg-background">
        <TooltipProvider>
          {children}
          <Toaster
            position="bottom-right"
            gap={8}
            toastOptions={{
              classNames: {
                // Structural only — no bg/color/border-color here so info & success
                // toasts can apply their own styles via inline `style` without fighting
                // !important class overrides.
                toast: "!rounded-none !border-2 !font-mono !shadow-none",
                error:
                  "!border-red-500 !bg-neutral-950 !text-neutral-100 [&_[data-description]]:!text-neutral-500",
                title: "!font-bold !uppercase !tracking-widest !text-xs",
                description: "!font-mono !text-xs !uppercase !tracking-wider",
                closeButton:
                  "!rounded-none !border !border-neutral-700 !bg-neutral-900 !text-neutral-400 hover:!text-neutral-100",
              },
            }}
          />
        </TooltipProvider>
      </body>
    </html>
  );
}
