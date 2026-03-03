"use client";

import { useEffect, useMemo, useState } from "react";

type TaskItem = {
  id: string;
  content: string;
  isCompleted: boolean;
  showOnLockScreen?: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
};

type TaskFilter = "all" | "completed" | "incomplete";

function sourceLabel(source: string) {
  if (source === "supabase") return "Supabase";
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
  const [content, setContent] = useState("");
  const [showOnLockScreen, setShowOnLockScreen] = useState(false);
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [source, setSource] = useState("unknown");
  const [error, setError] = useState("");

  const [filter, setFilter] = useState<TaskFilter>("all");
  const [query, setQuery] = useState("");

  async function loadTasks() {
    const response = await fetch("/api/tasks", { method: "GET", cache: "no-store" });
    const data = await response.json();
    setTasks(data.items ?? []);
    setSource(data.source ?? "unknown");
  }

  useEffect(() => {
    loadTasks().catch(() => {
      setError("\uD560 \uC77C \uBAA9\uB85D\uC744 \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.");
    });
  }, []);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const byStatus =
        filter === "all" ||
        (filter === "completed" && task.isCompleted) ||
        (filter === "incomplete" && !task.isCompleted);

      const q = query.trim().toLowerCase();
      const byQuery = !q || task.content.toLowerCase().includes(q);

      return byStatus && byQuery;
    });
  }, [tasks, filter, query]);

  async function createTask() {
    if (!content.trim()) {
      setError("\uD560 \uC77C \uB0B4\uC6A9\uC744 \uC785\uB825\uD574 \uC8FC\uC138\uC694.");
      return;
    }

    setError("");
    const response = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isCompleted: !task.isCompleted }),
    });
    const data = await response.json();

    if (!response.ok) {
      setError(data.error ?? "\uD560 \uC77C \uC0C1\uD0DC\uB97C \uBCC0\uACBD\uD558\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.");
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
            </div>
          </li>
        ))}
      </ul>
      {filteredTasks.length === 0 ? <p>\uC870\uAC74\uC5D0 \uB9DE\uB294 \uD560 \uC77C\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.</p> : null}
    </section>
  );
}