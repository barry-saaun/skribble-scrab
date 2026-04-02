"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { env } from "~/env";

export default function Home() {
  const [messages, setMessages] = useState<string[]>([]);
  const socketRef = useRef<WebSocket | null>(null);

  const closeWs = useCallback(() => {
    socketRef.current?.close();
    setMessages([]);
  }, []);

  const connect = useCallback(() => {
    if (
      socketRef.current?.readyState === WebSocket.OPEN ||
      socketRef.current?.readyState === WebSocket.CONNECTING
    )
      return;
    const ws = new WebSocket(`${env.NEXT_PUBLIC_WS_BASE_URL}/ws`);

    socketRef.current = ws;

    ws.onopen = () => {
      console.log("connected to WebSocket");
      ws.send("hello from nextjs");
    };

    ws.onmessage = (event) => {
      setMessages((prev) => [...prev, event.data]);
    };

    ws.onclose = () => {
      console.log("ws disconnected...");
    };

    socketRef.current = ws;
  }, []);

  useEffect(() => {
    connect();

    return () => socketRef.current?.close();
  }, [connect]);

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold">Pictionary Clone</h1>

      <button
        className="mt-4 rounded bg-blue-600 px-4 py-2 text-white"
        onClick={() => socketRef.current?.send("ping from client")}
      >
        Send Message
      </button>

      <ul className="mt-4 list-disc pl-6">
        {messages.map((message, index) => (
          <li key={`${message}-${index}`}>{message}</li>
        ))}
      </ul>

      <div className="flex w-56 flex-row gap-2 py-10">
        <button onClick={connect} className="my-1 mx-2 bg-green-700">
          Connect to Server
        </button>
        <button onClick={closeWs} className="my-1 mx-2 bg-red-700">
          Disconnect Server
        </button>
      </div>
    </main>
  );
}
