"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "notice_user_id";
const UUID_V4_OR_V1 = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default function UserScopePanel() {
  const [userId, setUserId] = useState("");
  const [message, setMessage] = useState("저장된 사용자 ID가 없습니다.");

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY)?.trim() ?? "";
    if (saved) {
      setUserId(saved);
      setMessage(`현재 사용자 ID: ${saved}`);
    }
  }, []);

  function saveUserId() {
    const next = userId.trim();
    if (!next) {
      setMessage("사용자 ID를 입력해 주세요.");
      return;
    }
    if (!UUID_V4_OR_V1.test(next)) {
      setMessage("UUID 형식이 아닙니다. 예: 9d6dfca0-b4f2-4a3f-93da-78e4d40138d2");
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, next);
    setMessage(`사용자 ID를 저장했습니다: ${next}`);
    window.location.reload();
  }

  function clearUserId() {
    window.localStorage.removeItem(STORAGE_KEY);
    setUserId("");
    setMessage("사용자 ID를 초기화했습니다.");
    window.location.reload();
  }

  return (
    <section style={{ marginTop: 12, padding: 12, border: "1px solid #ddd", borderRadius: 8, maxWidth: 900 }}>
      <h2 style={{ marginTop: 0 }}>사용자 분리 설정</h2>
      <p style={{ marginTop: 0 }}>멀티 사용자 분리 모드에서는 사용자 ID를 설정해야 데이터가 분리됩니다.</p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input
          value={userId}
          onChange={(event) => setUserId(event.target.value)}
          placeholder="예: user_001"
          style={{ minWidth: 260, padding: 8 }}
        />
        <button onClick={saveUserId} style={{ padding: "8px 12px" }}>
          저장
        </button>
        <button onClick={clearUserId} style={{ padding: "8px 12px" }}>
          초기화
        </button>
      </div>
      <p style={{ marginBottom: 0, opacity: 0.85 }}>{message}</p>
    </section>
  );
}
