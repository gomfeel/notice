"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

type IntakeStatus = "unread" | "read";
type IntakeSort = "created_desc" | "created_asc" | "confidence_desc";

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
  if (source === "supabase") return "\uC11C\uBC84 DB";
  if (source === "memory") return "\uBA54\uBAA8\uB9AC";
  if (source === "memory-fallback") return "\uBA54\uBAA8\uB9AC(\uB300\uCCB4)";
  return "\uC54C \uC218 \uC5C6\uC74C";
}

function statusLabel(status: IntakeStatus) {
  return status === "read" ? "\uD655\uC778 \uC644\uB8CC" : "\uD655\uC778 \uC804";
}

function sortLabel(sort: IntakeSort) {
  if (sort === "created_asc") return "\uC624\uB798\uB41C\uC21C";
  if (sort === "confidence_desc") return "\uC2E0\uB8B0\uB3C4\uC21C";
  return "\uCD5C\uC2E0\uC21C";
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("ko-KR");
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
  const [sortBy, setSortBy] = useState<IntakeSort>("created_desc");
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
    const intervalId = window.setInterval(() => {
      loadItems().catch(() => {});
    }, 15000);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const folder = params.get("folder");
    const status = params.get("status");
    const sort = params.get("sort");
    const q = params.get("q");

    if (folder) setFilterFolder(folder);
    if (status === "read" || status === "unread" || status === "all") {
      setFilterStatus(status as "all" | IntakeStatus);
    }
    if (sort === "created_desc" || sort === "created_asc" || sort === "confidence_desc") {
      setSortBy(sort as IntakeSort);
    }
    if (q) setSearch(q);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (filterFolder !== "all") params.set("folder", filterFolder);
    if (filterStatus !== "all") params.set("status", filterStatus);
    if (sortBy !== "created_desc") params.set("sort", sortBy);
    if (search.trim()) params.set("q", search.trim());

    const qs = params.toString();
    router.replace(qs ? `${safePathname}?${qs}` : safePathname, { scroll: false });
  }, [filterFolder, filterStatus, sortBy, search, router, safePathname]);

  const filteredItems = useMemo(() => {
    const filtered = items.filter((item) => {
      const byFolder = filterFolder === "all" || item.selectedFolder === filterFolder;
      const byStatus = filterStatus === "all" || item.status === filterStatus;
      const q = search.trim().toLowerCase();
      const bySearch = !q || item.title.toLowerCase().includes(q) || item.url.toLowerCase().includes(q);
      return byFolder && byStatus && bySearch;
    });

    return filtered.sort((a, b) => {
      if (sortBy === "created_asc") {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortBy === "confidence_desc") {
        return b.confidence - a.confidence;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [items, filterFolder, filterStatus, sortBy, search]);

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
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as IntakeSort)}>
            <option value="created_desc">\uCD5C\uC2E0\uC21C</option>
            <option value="created_asc">\uC624\uB798\uB41C\uC21C</option>
            <option value="confidence_desc">\uC2E0\uB8B0\uB3C4\uC21C</option>
          </select>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="\uC81C\uBAA9/URL \uAC80\uC0C9"
            style={{ minWidth: 220 }}
          />
        </div>

        <p style={{ marginTop: 0, opacity: 0.8 }}>
          \uD45C\uC2DC \uD56D\uBAA9: {filteredItems.length} / {items.length} · \uC815\uB82C: {sortLabel(sortBy)}
        </p>

        {filteredItems.length === 0 ? <p>\uC870\uAC74\uC5D0 \uB9DE\uB294 \uD56D\uBAA9\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.</p> : null}
        <ul style={{ paddingLeft: 18 }}>
          {filteredItems.map((item) => (
            <li key={item.id} style={{ marginBottom: 8 }}>
              <strong>{item.title}</strong>
              <div>\uD3F4\uB354: {item.selectedFolder}</div>
              <div>\uC2E0\uB8B0\uB3C4: {item.confidence}</div>
              <div>\uC0C1\uD0DC: {statusLabel(item.status)}</div>
              <div>\uC0DD\uC131\uC2DC\uAC01: {formatDate(item.createdAt)}</div>
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
