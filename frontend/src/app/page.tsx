import { Lobby } from "./components/Lobby";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; code?: string }>;
}) {
  const params = await searchParams;
  return <Lobby searchParams={params} />;
}
