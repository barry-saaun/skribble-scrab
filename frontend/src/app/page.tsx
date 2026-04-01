async function getHealth() {
  const res = await fetch("http://localhost:8080/api/health", {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch health status");
  }

  return res.json();
}
export default async function Home() {
  const data = await getHealth();

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold">Pictionary Clone</h1>
      <p>Backend status: {data.status}</p>
    </main>
  );
}
