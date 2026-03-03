"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

type TaskItem = {
  id: string;
  content: string;
  isCompleted: boolean;
  showOnLockScreen?: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
  createdAt?: string | null;
};

type TaskFilter = "all" | "completed" | "incomplete";
type TaskLockFilter = "all" | "lock_on" | "lock_off";
type TaskSort = "created_desc" | "starts_asc" | "ends_asc";

function sourceLabel(source: string) {
  if (source === "supabase") return "서버 DB";
  if (source === "memory") return "메모리";
  if (source === "memory-fallback") return "메모리(대체)";
  return "알 수 없음";
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("ko-KR");
}

export default function TaskPanel() {
  const router = useRouter();
  const pathname = usePathname();
  const safePathname = pathname ?? "/dashboard";

  const [content, setContent] = useState("");
  const [showOnLockScreen, setShowOnLockScreen] = useState(false);
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [source, setSource] = useState("unknown");
  const [error, setError] = useState("");

  const [filter, setFilter] = useState<TaskFilter>("all");
  const [lockFilter, setLockFilter] = useState<TaskLockFilter>("all");
  const [sortBy, setSortBy] = useState<TaskSort>("created_desc");
  const [query, setQuery] = useState("");

  function requestHeaders() {
    const userId = window.localStorage.getItem("notice_user_id")?.trim();
    const headers: Record<string, string> = {};
    if (userId) headers["x-notice-user-id"] = userId;
    return headers;
  }

  async function loadTasks() {
    const response = await fetch("/api/tasks", {
      method: "GET",
      cache: "no-store",
      headers: requestHeaders(),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error ?? "할 일 목록을 불러오지 못했습니다.");
    }
    setTasks(data.items ?? []);
    setSource(data.source ?? "unknown");
  }

  useEffect(() => {
    loadTasks().catch(() => {
      setError("할 일 목록을 불러오지 못했습니다.");
    });
  }, []);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      loadTasks().catch((e) => {
        setError(e instanceof Error ? e.message : "할 일 목록 자동 새로고침에 실패했습니다.");
      });
    }, 15000);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const taskFilter = params.get("task_filter");
    const taskLock = params.get("task_lock");
    const taskSort = params.get("task_sort");
    const taskQ = params.get("task_q");

    if (taskFilter === "all" || taskFilter === "completed" || taskFilter === "incomplete") {
      setFilter(taskFilter as TaskFilter);
    }
    if (taskLock === "all" || taskLock === "lock_on" || taskLock === "lock_off") {
      setLockFilter(taskLock as TaskLockFilter);
    }
    if (taskSort === "created_desc" || taskSort === "starts_asc" || taskSort === "ends_asc") {
      setSortBy(taskSort as TaskSort);
    }
    if (taskQ) {
      setQuery(taskQ);
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (filter !== "all") {
      params.set("task_filter", filter);
    } else {
      params.delete("task_filter");
    }
    if (lockFilter !== "all") {
      params.set("task_lock", lockFilter);
    } else {
      params.delete("task_lock");
    }
    if (sortBy !== "created_desc") {
      params.set("task_sort", sortBy);
    } else {
      params.delete("task_sort");
    }

    if (query.trim()) {
      params.set("task_q", query.trim());
    } else {
      params.delete("task_q");
    }

    const qs = params.toString();
    router.replace(qs ? `${safePathname}?${qs}` : safePathname, { scroll: false });
  }, [filter, lockFilter, sortBy, query, router, safePathname]);

  const filteredTasks = useMemo(() => {
    const filtered = tasks.filter((task) => {
      const byStatus =
        filter === "all" ||
        (filter === "completed" && task.isCompleted) ||
        (filter === "incomplete" && !task.isCompleted);

      const byLock =
        lockFilter === "all" ||
        (lockFilter === "lock_on" && Boolean(task.showOnLockScreen)) ||
        (lockFilter === "lock_off" && !task.showOnLockScreen);

      const q = query.trim().toLowerCase();
      const byQuery = !q || task.content.toLowerCase().includes(q);

      return byStatus && byLock && byQuery;
    });

    return filtered.sort((a, b) => {
      if (sortBy === "starts_asc") {
        return toTime(a.startsAt) - toTime(b.startsAt);
      }
      if (sortBy === "ends_asc") {
        return toTime(a.endsAt) - toTime(b.endsAt);
      }
      return toTime(b.createdAt) - toTime(a.createdAt);
    });
  }, [tasks, filter, lockFilter, sortBy, query]);

  function toTime(value?: string | null) {
    if (!value) return Number.MAX_SAFE_INTEGER;
    const time = new Date(value).getTime();
    return Number.isNaN(time) ? Number.MAX_SAFE_INTEGER : time;
  }

  async function createTask() {
    if (!content.trim()) {
      setError("할 일 내용을 입력해 주세요.");
      return;
    }
    if (startsAt && endsAt && new Date(endsAt).getTime() < new Date(startsAt).getTime()) {
      setError("종료 시간은 시작 시간 이후여야 합니다.");
      return;
    }

    setError("");
    const response = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...requestHeaders() },
      body: JSON.stringify({
        content,
        showOnLockScreen,
        startsAt: startsAt || null,
        endsAt: endsAt || null,
      }),
    });
    const data = await response.json();

    if (!response.ok) {
      setError(data.error ?? "할 일을 추가하지 못했습니다.");
      return;
    }

    setContent("");
    setShowOnLockScreen(false);
    setStartsAt("");
    setEndsAt("");
    await loadTasks();
  }

  async function toggleTask(task: TaskItem) {
    const response = await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...requestHeaders() },
      body: JSON.stringify({ isCompleted: !task.isCompleted }),
    });
    const data = await response.json();

    if (!response.ok) {
      setError(data.error ?? "할 일 상태를 변경하지 못했습니다.");
      return;
    }

    await loadTasks();
  }

  async function toggleLockScreen(task: TaskItem) {
    const response = await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...requestHeaders() },
      body: JSON.stringify({ showOnLockScreen: !Boolean(task.showOnLockScreen) }),
    });
    const data = await response.json();

    if (!response.ok) {
      setError(data.error ?? "잠금화면 표시 상태를 변경하지 못했습니다.");
      return;
    }

    await loadTasks();
  }

  return (
    <section style={{ marginTop: 28 }}>
      <h2>할 일 관리</h2>
      <p>데이터 소스: {sourceLabel(source)}</p>

      <div style={{ display: "grid", gap: 8, maxWidth: 900 }}>
        <input
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="할 일 내용을 입력하세요"
          style={{ padding: 10 }}
        />
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <label style={{ display: "flex", gap: 4, alignItems: "center" }}>
            <span>시작</span>
            <input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
          </label>
          <label style={{ display: "flex", gap: 4, alignItems: "center" }}>
            <span>종료</span>
            <input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
          </label>
          <label style={{ display: "flex", gap: 4, alignItems: "center" }}>
            <input
              type="checkbox"
              checked={showOnLockScreen}
              onChange={(event) => setShowOnLockScreen(event.target.checked)}
            />
            잠금화면 표시
          </label>
          <button onClick={createTask} style={{ padding: "10px 14px" }}>
            추가
          </button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
        <select value={filter} onChange={(e) => setFilter(e.target.value as TaskFilter)}>
          <option value="all">전체</option>
          <option value="incomplete">미완료</option>
          <option value="completed">완료</option>
        </select>
        <select value={lockFilter} onChange={(e) => setLockFilter(e.target.value as TaskLockFilter)}>
          <option value="all">잠금화면 전체</option>
          <option value="lock_on">잠금화면 표시</option>
          <option value="lock_off">잠금화면 미표시</option>
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as TaskSort)}>
          <option value="created_desc">최신 활동순</option>
          <option value="starts_asc">시작 시간 순</option>
          <option value="ends_asc">종료 시간 순</option>
        </select>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="할 일 검색"
          style={{ minWidth: 220 }}
        />
      </div>

      {error ? <p style={{ color: "#b00020" }}>{error}</p> : null}

      <ul style={{ paddingLeft: 18, marginTop: 12 }}>
        {filteredTasks.map((task) => (
          <li key={task.id} style={{ marginBottom: 8 }}>
            <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                type="checkbox"
                checked={task.isCompleted}
                onChange={() => toggleTask(task)}
              />
              <span style={{ textDecoration: task.isCompleted ? "line-through" : "none" }}>
                {task.content}
              </span>
            </label>
            <div style={{ marginLeft: 24, fontSize: 13, opacity: 0.85 }}>
              <div>시작: {formatDate(task.startsAt)}</div>
              <div>종료: {formatDate(task.endsAt)}</div>
              <div>
                잠금화면: {task.showOnLockScreen ? "표시" : "미표시"}
                {" "}
                <button onClick={() => toggleLockScreen(task)} style={{ padding: "4px 8px", marginLeft: 6 }}>
                  {task.showOnLockScreen ? "미표시로 변경" : "표시로 변경"}
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
      {filteredTasks.length === 0 ? <p>조건에 맞는 할 일이 없습니다.</p> : null}
    </section>
  );
}

