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
  if (source === "supabase") return "서버 DB";
  if (source === "memory") return "메모리";
  if (source === "memory-fallback") return "메모리(대체)";
  return "알 수 없음";
}

function statusLabel(status: IntakeStatus) {
  return status === "read" ? "확인 완료" : "확인 전";
}

function sortLabel(sort: IntakeSort) {
  if (sort === "created_asc") return "오래된순";
  if (sort === "confidence_desc") return "신뢰도순";
  return "최신순";
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
  const [result, setResult] = useState<string>("아직 요청이 없습니다.");
  const [items, setItems] = useState<RecentItem[]>([]);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [source, setSource] = useState<string>("unknown");

  const [filterFolder, setFilterFolder] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<"all" | IntakeStatus>("all");
  const [sortBy, setSortBy] = useState<IntakeSort>("created_desc");
  const [search, setSearch] = useState("");

  function requestHeaders() {
    const userId = window.localStorage.getItem("notice_user_id")?.trim();
    const headers: Record<string, string> = {};
    if (userId) headers["x-notice-user-id"] = userId;
    return headers;
  }

  async function loadItems() {
    const response = await fetch("/api/intake", {
      method: "GET",
      cache: "no-store",
      headers: requestHeaders(),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error ?? "최근 수집 항목을 불러오지 못했습니다.");
    }
    setItems(data.items ?? []);
    setSource(data.source ?? "unknown");
  }

  async function loadFolders() {
    const response = await fetch("/api/folders", {
      method: "GET",
      cache: "no-store",
      headers: requestHeaders(),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error ?? "폴더 목록을 불러오지 못했습니다.");
    }
    setFolders(data.items ?? []);
  }

  useEffect(() => {
    Promise.all([loadItems(), loadFolders()]).catch(() => {
      setResult("초기 데이터를 불러오지 못했습니다.");
    });
  }, []);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      loadItems().catch((e) => {
        setResult(
          e instanceof Error
            ? e.message
            : "최근 수집 항목 자동 새로고침에 실패했습니다."
        );
      });
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
      setResult("폴더 이름을 입력해 주세요.");
      return;
    }

    const response = await fetch("/api/folders", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...requestHeaders() },
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
      headers: { "Content-Type": "application/json", ...requestHeaders() },
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
        headers: { "Content-Type": "application/json", ...requestHeaders() },
        body: JSON.stringify({ url, folders }),
      });

      const data = await response.json();
      if (!response.ok) {
        setResult(data.error ?? "수집 요청을 처리하지 못했습니다.");
        return;
      }
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

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
          <select value={filterFolder} onChange={(e) => setFilterFolder(e.target.value)}>
            <option value="all">전체 폴더</option>
            {folders.map((folder) => (
              <option key={folder.id} value={folder.name}>
                {folder.name}
              </option>
            ))}
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as "all" | IntakeStatus)}>
            <option value="all">전체 상태</option>
            <option value="unread">확인 전</option>
            <option value="read">확인 완료</option>
          </select>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as IntakeSort)}>
            <option value="created_desc">최신순</option>
            <option value="created_asc">오래된순</option>
            <option value="confidence_desc">신뢰도순</option>
          </select>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="제목/URL 검색"
            style={{ minWidth: 220 }}
          />
        </div>

        <p style={{ marginTop: 0, opacity: 0.8 }}>
          표시 항목: {filteredItems.length} / {items.length} · 정렬: {sortLabel(sortBy)}
        </p>

        {filteredItems.length === 0 ? <p>조건에 맞는 항목이 없습니다.</p> : null}
        <ul style={{ paddingLeft: 18 }}>
          {filteredItems.map((item) => (
            <li key={item.id} style={{ marginBottom: 8 }}>
              <strong>{item.title}</strong>
              <div>폴더: {item.selectedFolder}</div>
              <div>신뢰도: {item.confidence}</div>
              <div>상태: {statusLabel(item.status)}</div>
              <div>생성시각: {formatDate(item.createdAt)}</div>
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


