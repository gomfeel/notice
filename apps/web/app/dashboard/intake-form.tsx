"use client";

import { useEffect, useState } from "react";

type RecentItem = {
  id: string;
  url: string;
  title: string;
  selectedFolder: string;
  confidence: number;
  createdAt: string;
};

const defaultFolders = [{ name: "stock" }, { name: "travel" }, { name: "work" }];

export default function IntakeForm() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>("No request yet");
  const [items, setItems] = useState<RecentItem[]>([]);
  const [source, setSource] = useState<"memory" | "supabase" | "unknown">("unknown");

  async function loadItems() {
    const response = await fetch("/api/intake", { method: "GET", cache: "no-store" });
    const data = await response.json();
    setItems(data.items ?? []);
    setSource(data.source ?? "unknown");
  }

  useEffect(() => {
    loadItems().catch(() => {
      setResult("Failed to load history");
    });
  }, []);

  async function submit() {
    if (!url.trim()) {
      setResult("URL is required");
      return;
    }

    setLoading(true);
    setResult("Requesting...");

    try {
      const response = await fetch("/api/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          folders: defaultFolders,
        }),
      });

      const data = await response.json();
      setResult(JSON.stringify(data, null, 2));
      await loadItems();
    } catch (error) {
      setResult(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section style={{ marginTop: 24 }}>
      <h2>URL Intake Test</h2>
      <p>Submit a URL to run metadata extraction and folder classification.</p>
      <div style={{ display: "flex", gap: 8, maxWidth: 900 }}>
        <input
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="https://example.com"
          style={{ flex: 1, padding: 10 }}
        />
        <button onClick={submit} disabled={loading} style={{ padding: "10px 16px" }}>
          {loading ? "Processing..." : "Submit"}
        </button>
      </div>

      <pre
        style={{
          marginTop: 12,
          padding: 12,
          border: "1px solid #ddd",
          background: "#fafafa",
          overflowX: "auto",
          whiteSpace: "pre-wrap",
        }}
      >
        {result}
      </pre>

      <section style={{ marginTop: 20 }}>
        <h3>Recent Intake Items</h3>
        <p>data source: {source}</p>
        {items.length === 0 ? <p>No items yet</p> : null}
        <ul style={{ paddingLeft: 18 }}>
          {items.map((item) => (
            <li key={item.id} style={{ marginBottom: 8 }}>
              <strong>{item.title}</strong>
              <div>folder: {item.selectedFolder}</div>
              <div>confidence: {item.confidence}</div>
              <div>
                <a href={item.url} target="_blank" rel="noreferrer">
                  {item.url}
                </a>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </section>
  );
}