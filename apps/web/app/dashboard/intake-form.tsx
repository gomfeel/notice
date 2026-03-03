"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

type IntakeStatus = "unread" | "read";

type RecentItem = {
  id: string;
  url: string;
  title: string;
  selectedFolder: string;
  confidence: number;
  status: IntakeStatus;
  createdAt: string;
};

type FolderItem = {
  id: string;
  name: string;
  description?: string;
};

function sourceLabel(source: string) {
  if (source === "supabase") return "Supabase";
  if (source === "memory") return "\uBA54\uBAA8\uB9AC";
  if (source === "memory-fallback") return "\uBA54\uBAA8\uB9AC(\uB300\uCCB4)";
  return "\uC54C \uC218 \uC5C6\uC74C";
}

function statusLabel(status: IntakeStatus) {
  return status === "read" ? "\uD655\uC778 \uC644\uB8CC" : "\uD655\uC778 \uC804";
}

export default function IntakeForm() {
  const router = useRouter();
  const pathname = usePathname();
  const safePathname = pathname ?? "/dashboard";

  const [url, setUrl] = useState("");
  const [newFolderName, setNewFolderName] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>("\uC544\uC9C1 \uC694\uCCAD\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.");
  const [items, setItems] = useState<RecentItem[]>([]);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [source, setSource] = useState<string>("unknown");

  const [filterFolder, setFilterFolder] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<"all" | IntakeStatus>("all");
  const [search, setSearch] = useState("");

  async function loadItems() {
    const response = await fetch("/api/intake", { method: "GET", cache: "no-store" });
    const data = await response.json();
    setItems(data.items ?? []);
    setSource(data.source ?? "unknown");
  }

  async function loadFolders() {
    const response = await fetch("/api/folders", { method: "GET", cache: "no-store" });
    const data = await response.json();
    setFolders(data.items ?? []);
  }

  useEffect(() => {
    Promise.all([loadItems(), loadFolders()]).catch(() => {
      setResult("\uCD08\uAE30 \uB370\uC774\uD130\uB97C \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.");
    });
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const folder = params.get("folder");
    const status = params.get("status");
    const q = params.get("q");

    if (folder) setFilterFolder(folder);
    if (status === "read" || status === "unread" || status === "all") {
      setFilterStatus(status as "all" | IntakeStatus);
    }
    if (q) setSearch(q);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (filterFolder !== "all") params.set("folder", filterFolder);
    if (filterStatus !== "all") params.set("status", filterStatus);
    if (search.trim()) params.set("q", search.trim());

    const qs = params.toString();
    router.replace(qs ? `${safePathname}?${qs}` : safePathname, { scroll: false });
  }, [filterFolder, filterStatus, search, router, safePathname]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const byFolder = filterFolder === "all" || item.selectedFolder === filterFolder;
      const byStatus = filterStatus === "all" || item.status === filterStatus;
      const q = search.trim().toLowerCase();
      const bySearch = !q || item.title.toLowerCase().includes(q) || item.url.toLowerCase().includes(q);
      return byFolder && byStatus && bySearch;
    });
  }, [items, filterFolder, filterStatus, search]);

  async function addFolder() {
    if (!newFolderName.trim()) {
      setResult("\uD3F4\uB354 \uC774\uB984\uC744 \uC785\uB825\uD574 \uC8FC\uC138\uC694.");
      return;
    }

    const response = await fetch("/api/folders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newFolderName.trim() }),
    });
    const data = await response.json();
    if (!response.ok) {
      setResult(data.error ?? "\uD3F4\uB354\uB97C \uC0DD\uC131\uD558\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.");
      return;
    }

    setNewFolderName("");
    setResult(JSON.stringify(data, null, 2));
    await loadFolders();
  }

  async function toggleStatus(item: RecentItem) {
    const nextStatus: IntakeStatus = item.status === "read" ? "unread" : "read";
    const response = await fetch(`/api/intake/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });

    const data = await response.json();
    if (!response.ok) {
      setResult(data.error ?? "\uB9C1\uD06C \uC0C1\uD0DC\uB97C \uBCC0\uACBD\uD558\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.");
      return;
    }

    await loadItems();
  }

  async function submit() {
    if (!url.trim()) {
      setResult("URL\uC744 \uC785\uB825\uD574 \uC8FC\uC138\uC694.");
      return;
    }

    setLoading(true);
    setResult("\uC694\uCCAD \uC911\uC785\uB2C8\uB2E4...");

    try {
      const response = await fetch("/api/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, folders }),
      });

      const data = await response.json();
      setResult(JSON.stringify(data, null, 2));
      await loadItems();
    } catch (error) {
      setResult(error instanceof Error ? error.message : "\uC54C \uC218 \uC5C6\uB294 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section style={{ marginTop: 24 }}>
      <h2>URL \uC218\uC9D1 \uD14C\uC2A4\uD2B8</h2>
      <p>URL\uC744 \uC785\uB825\uD558\uBA74 \uBA54\uD0C0\uB370\uC774\uD130 \uCD94\uCD9C\uACFC \uD3F4\uB354 \uBD84\uB958\uB97C \uC218\uD589\uD569\uB2C8\uB2E4.</p>

      <section style={{ marginBottom: 16 }}>
        <h3>\uD3F4\uB354</h3>
        <div style={{ display: "flex", gap: 8, maxWidth: 600 }}>
          <input
            value={newFolderName}
            onChange={(event) => setNewFolderName(event.target.value)}
            placeholder="\uC0C8 \uD3F4\uB354 \uC774\uB984"
            style={{ flex: 1, padding: 10 }}
          />
          <button onClick={addFolder} style={{ padding: "10px 16px" }}>
            \uD3F4\uB354 \uCD94\uAC00
          </button>
        </div>
        <ul style={{ paddingLeft: 18 }}>
          {folders.map((folder) => (
            <li key={folder.id}>{folder.name}</li>
          ))}
        </ul>
      </section>

      <div style={{ display: "flex", gap: 8, maxWidth: 900 }}>
        <input
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="https://example.com"
          style={{ flex: 1, padding: 10 }}
        />
        <button onClick={submit} disabled={loading} style={{ padding: "10px 16px" }}>
          {loading ? "\uCC98\uB9AC \uC911..." : "\uC804\uC1A1"}
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
        <h3>\uCD5C\uADFC \uC218\uC9D1 \uD56D\uBAA9</h3>
        <p>\uB370\uC774\uD130 \uC18C\uC2A4: {sourceLabel(source)}</p>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
          <select value={filterFolder} onChange={(e) => setFilterFolder(e.target.value)}>
            <option value="all">\uC804\uCCB4 \uD3F4\uB354</option>
            {folders.map((folder) => (
              <option key={folder.id} value={folder.name}>
                {folder.name}
              </option>
            ))}
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as "all" | IntakeStatus)}>
            <option value="all">\uC804\uCCB4 \uC0C1\uD0DC</option>
            <option value="unread">\uD655\uC778 \uC804</option>
            <option value="read">\uD655\uC778 \uC644\uB8CC</option>
          </select>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="\uC81C\uBAA9/URL \uAC80\uC0C9"
            style={{ minWidth: 220 }}
          />
        </div>

        {filteredItems.length === 0 ? <p>\uC870\uAC74\uC5D0 \uB9DE\uB294 \uD56D\uBAA9\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.</p> : null}
        <ul style={{ paddingLeft: 18 }}>
          {filteredItems.map((item) => (
            <li key={item.id} style={{ marginBottom: 8 }}>
              <strong>{item.title}</strong>
              <div>\uD3F4\uB354: {item.selectedFolder}</div>
              <div>\uC2E0\uB8B0\uB3C4: {item.confidence}</div>
              <div>\uC0C1\uD0DC: {statusLabel(item.status)}</div>
              <div style={{ marginTop: 6 }}>
                <button onClick={() => toggleStatus(item)} style={{ padding: "6px 10px" }}>
                  {item.status === "read" ? "\uD655\uC778 \uC804\uC73C\uB85C" : "\uD655\uC778 \uC644\uB8CC\uB85C"}
                </button>
              </div>
              <div style={{ marginTop: 4 }}>
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