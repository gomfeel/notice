"use client";

import { useEffect, useState } from "react";

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
  if (source === "memory") return "메모리";
  if (source === "memory-fallback") return "메모리(대체)";
  return "알 수 없음";
}

function statusLabel(status: IntakeStatus) {
  return status === "read" ? "확인 완료" : "확인 전";
}

export default function IntakeForm() {
  const [url, setUrl] = useState("");
  const [newFolderName, setNewFolderName] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>("아직 요청이 없습니다.");
  const [items, setItems] = useState<RecentItem[]>([]);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [source, setSource] = useState<string>("unknown");

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
      setResult("초기 데이터를 불러오지 못했습니다.");
    });
  }, []);

  async function addFolder() {
    if (!newFolderName.trim()) {
      setResult("폴더 이름을 입력해 주세요.");
      return;
    }

    const response = await fetch("/api/folders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newFolderName.trim() }),
    });
    const data = await response.json();
    if (!response.ok) {
      setResult(data.error ?? "폴더를 생성하지 못했습니다.");
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
      setResult(data.error ?? "링크 상태를 변경하지 못했습니다.");
      return;
    }

    await loadItems();
  }

  async function submit() {
    if (!url.trim()) {
      setResult("URL을 입력해 주세요.");
      return;
    }

    setLoading(true);
    setResult("요청 중입니다...");

    try {
      const response = await fetch("/api/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          folders,
        }),
      });

      const data = await response.json();
      setResult(JSON.stringify(data, null, 2));
      await loadItems();
    } catch (error) {
      setResult(error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section style={{ marginTop: 24 }}>
      <h2>URL 수집 테스트</h2>
      <p>URL을 입력하면 메타데이터 추출과 폴더 분류를 수행합니다.</p>

      <section style={{ marginBottom: 16 }}>
        <h3>폴더</h3>
        <div style={{ display: "flex", gap: 8, maxWidth: 600 }}>
          <input
            value={newFolderName}
            onChange={(event) => setNewFolderName(event.target.value)}
            placeholder="새 폴더 이름"
            style={{ flex: 1, padding: 10 }}
          />
          <button onClick={addFolder} style={{ padding: "10px 16px" }}>
            폴더 추가
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
          {loading ? "처리 중..." : "전송"}
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
        <h3>최근 수집 항목</h3>
        <p>데이터 소스: {sourceLabel(source)}</p>
        {items.length === 0 ? <p>아직 항목이 없습니다.</p> : null}
        <ul style={{ paddingLeft: 18 }}>
          {items.map((item) => (
            <li key={item.id} style={{ marginBottom: 8 }}>
              <strong>{item.title}</strong>
              <div>폴더: {item.selectedFolder}</div>
              <div>신뢰도: {item.confidence}</div>
              <div>상태: {statusLabel(item.status)}</div>
              <div style={{ marginTop: 6 }}>
                <button onClick={() => toggleStatus(item)} style={{ padding: "6px 10px" }}>
                  {item.status === "read" ? "확인 전으로" : "확인 완료로"}
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