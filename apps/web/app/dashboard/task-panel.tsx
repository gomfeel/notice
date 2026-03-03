"use client";

import { useEffect, useState } from "react";

type TaskItem = {
  id: string;
  content: string;
  isCompleted: boolean;
  showOnLockScreen?: boolean;
};

function sourceLabel(source: string) {
  if (source === "supabase") return "Supabase";
  if (source === "memory") return "메모리";
  if (source === "memory-fallback") return "메모리(대체)";
  return "알 수 없음";
}

export default function TaskPanel() {
  const [content, setContent] = useState("");
  const [showOnLockScreen, setShowOnLockScreen] = useState(false);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [source, setSource] = useState("unknown");
  const [error, setError] = useState("");

  async function loadTasks() {
    const response = await fetch("/api/tasks", { method: "GET", cache: "no-store" });
    const data = await response.json();
    setTasks(data.items ?? []);
    setSource(data.source ?? "unknown");
  }

  useEffect(() => {
    loadTasks().catch(() => {
      setError("할 일 목록을 불러오지 못했습니다.");
    });
  }, []);

  async function createTask() {
    if (!content.trim()) {
      setError("할 일 내용을 입력해 주세요.");
      return;
    }

    setError("");
    const response = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, showOnLockScreen }),
    });
    const data = await response.json();

    if (!response.ok) {
      setError(data.error ?? "할 일을 추가하지 못했습니다.");
      return;
    }

    setContent("");
    setShowOnLockScreen(false);
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
      setError(data.error ?? "할 일 상태를 변경하지 못했습니다.");
      return;
    }

    await loadTasks();
  }

  return (
    <section style={{ marginTop: 28 }}>
      <h2>할 일 관리</h2>
      <p>데이터 소스: {sourceLabel(source)}</p>

      <div style={{ display: "flex", gap: 8, alignItems: "center", maxWidth: 900 }}>
        <input
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="할 일 내용을 입력하세요"
          style={{ flex: 1, padding: 10 }}
        />
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

      {error ? <p style={{ color: "#b00020" }}>{error}</p> : null}

      <ul style={{ paddingLeft: 18, marginTop: 12 }}>
        {tasks.map((task) => (
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
          </li>
        ))}
      </ul>
      {tasks.length === 0 ? <p>등록된 할 일이 없습니다.</p> : null}
    </section>
  );
}