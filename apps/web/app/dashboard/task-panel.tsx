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
  if (source === "supabase") return "\uC11C\uBC84 DB";
  if (source === "memory") return "\uBA54\uBAA8\uB9AC";
  if (source === "memory-fallback") return "\uBA54\uBAA8\uB9AC(\uB300\uCCB4)";
  return "\uC54C \uC218 \uC5C6\uC74C";
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
      throw new Error(data.error ?? "\uD560 \uC77C \uBAA9\uB85D\uC744 \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.");
    }
    setTasks(data.items ?? []);
    setSource(data.source ?? "unknown");
  }

  useEffect(() => {
    loadTasks().catch(() => {
      setError("\uD560 \uC77C \uBAA9\uB85D\uC744 \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.");
    });
  }, []);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      loadTasks().catch((e) => {
        setError(e instanceof Error ? e.message : "\uD560 \uC77C \uBAA9\uB85D \uC790\uB3D9 \uC0C8\uB85C\uACE0\uCE68\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.");
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
      setError("\uD560 \uC77C \uB0B4\uC6A9\uC744 \uC785\uB825\uD574 \uC8FC\uC138\uC694.");
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
      setError(data.error ?? "\uD560 \uC77C\uC744 \uCD94\uAC00\uD558\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.");
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
      setError(data.error ?? "\uD560 \uC77C \uC0C1\uD0DC\uB97C \uBCC0\uACBD\uD558\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.");
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
      setError(data.error ?? "\uC7A0\uAE08\uD654\uBA74 \uD45C\uC2DC \uC0C1\uD0DC\uB97C \uBCC0\uACBD\uD558\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.");
      return;
    }

    await loadTasks();
  }

  return (
    <section style={{ marginTop: 28 }}>
      <h2>\uD560 \uC77C \uAD00\uB9AC</h2>
      <p>\uB370\uC774\uD130 \uC18C\uC2A4: {sourceLabel(source)}</p>

      <div style={{ display: "grid", gap: 8, maxWidth: 900 }}>
        <input
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="\uD560 \uC77C \uB0B4\uC6A9\uC744 \uC785\uB825\uD558\uC138\uC694"
          style={{ padding: 10 }}
        />
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <label style={{ display: "flex", gap: 4, alignItems: "center" }}>
            <span>\uC2DC\uC791</span>
            <input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
          </label>
          <label style={{ display: "flex", gap: 4, alignItems: "center" }}>
            <span>\uC885\uB8CC</span>
            <input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
          </label>
          <label style={{ display: "flex", gap: 4, alignItems: "center" }}>
            <input
              type="checkbox"
              checked={showOnLockScreen}
              onChange={(event) => setShowOnLockScreen(event.target.checked)}
            />
            \uC7A0\uAE08\uD654\uBA74 \uD45C\uC2DC
          </label>
          <button onClick={createTask} style={{ padding: "10px 14px" }}>
            \uCD94\uAC00
          </button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
        <select value={filter} onChange={(e) => setFilter(e.target.value as TaskFilter)}>
          <option value="all">\uC804\uCCB4</option>
          <option value="incomplete">\uBBF8\uC644\uB8CC</option>
          <option value="completed">\uC644\uB8CC</option>
        </select>
        <select value={lockFilter} onChange={(e) => setLockFilter(e.target.value as TaskLockFilter)}>
          <option value="all">\uC7A0\uAE08\uD654\uBA74 \uC804\uCCB4</option>
          <option value="lock_on">\uC7A0\uAE08\uD654\uBA74 \uD45C\uC2DC</option>
          <option value="lock_off">\uC7A0\uAE08\uD654\uBA74 \uBBF8\uD45C\uC2DC</option>
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as TaskSort)}>
          <option value="created_desc">\uCD5C\uC2E0 \uD65C\uB3D9\uC21C</option>
          <option value="starts_asc">\uC2DC\uC791 \uC2DC\uAC04 \uC21C</option>
          <option value="ends_asc">\uC885\uB8CC \uC2DC\uAC04 \uC21C</option>
        </select>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="\uD560 \uC77C \uAC80\uC0C9"
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
              <div>\uC2DC\uC791: {formatDate(task.startsAt)}</div>
              <div>\uC885\uB8CC: {formatDate(task.endsAt)}</div>
              <div>
                \uC7A0\uAE08\uD654\uBA74: {task.showOnLockScreen ? "\uD45C\uC2DC" : "\uBBF8\uD45C\uC2DC"}
                {" "}
                <button onClick={() => toggleLockScreen(task)} style={{ padding: "4px 8px", marginLeft: 6 }}>
                  {task.showOnLockScreen ? "\uBBF8\uD45C\uC2DC\uB85C \uBCC0\uACBD" : "\uD45C\uC2DC\uB85C \uBCC0\uACBD"}
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
      {filteredTasks.length === 0 ? <p>\uC870\uAC74\uC5D0 \uB9DE\uB294 \uD560 \uC77C\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.</p> : null}
    </section>
  );
}
