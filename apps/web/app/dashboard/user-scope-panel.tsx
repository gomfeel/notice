"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "notice_user_id";
const UUID_V4_OR_V1 = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type ProbeResult = {
  source?: string;
  items?: unknown[];
  error?: string;
};

type HealthResult = {
  status: string;
  now: string;
  config: {
    supabaseEnabled: boolean;
    apiTokenEnabled: boolean;
    requireUserId: boolean;
    defaultUserIdConfigured: boolean;
  };
};

export default function UserScopePanel() {
  const [userId, setUserId] = useState("");
  const [message, setMessage] = useState("저장된 사용자 ID가 없습니다.");
  const [probeMessage, setProbeMessage] = useState("");
  const [healthMessage, setHealthMessage] = useState("");
  const [probing, setProbing] = useState(false);
  const [checkingHealth, setCheckingHealth] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY)?.trim() ?? "";
    if (saved) {
      setUserId(saved);
      setMessage(`현재 사용자 ID: ${saved}`);
    }
  }, []);

  function generateUuid() {
    const next = crypto.randomUUID();
    setUserId(next);
    setMessage(`UUID를 생성했습니다: ${next}`);
  }

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
    setProbeMessage("");
    window.location.reload();
  }

  async function probeApi() {
    const current = userId.trim() || window.localStorage.getItem(STORAGE_KEY)?.trim() || "";
    if (!current) {
      setProbeMessage("테스트를 위해 먼저 사용자 ID를 저장해 주세요.");
      return;
    }

    setProbing(true);
    setProbeMessage("연결 테스트 중...");
    try {
      const response = await fetch("/api/tasks", {
        method: "GET",
        cache: "no-store",
        headers: { "x-notice-user-id": current },
      });
      const data = (await response.json()) as ProbeResult;
      if (!response.ok) {
        setProbeMessage(`실패: ${data.error ?? "알 수 없는 오류"}`);
        return;
      }

      const count = Array.isArray(data.items) ? data.items.length : 0;
      setProbeMessage(`성공: source=${data.source ?? "unknown"}, tasks=${count}`);
    } catch (error) {
      setProbeMessage(error instanceof Error ? `실패: ${error.message}` : "실패: 알 수 없는 오류");
    } finally {
      setProbing(false);
    }
  }

  async function checkHealth() {
    setCheckingHealth(true);
    setHealthMessage("서버 설정 확인 중...");
    try {
      const response = await fetch("/api/health", { method: "GET", cache: "no-store" });
      const data = (await response.json()) as HealthResult;
      if (!response.ok) {
        setHealthMessage("서버 상태 확인 실패");
        return;
      }

      setHealthMessage(
        [
          `status=${data.status}`,
          `supabase=${data.config.supabaseEnabled ? "on" : "off"}`,
          `apiToken=${data.config.apiTokenEnabled ? "on" : "off"}`,
          `requireUserId=${data.config.requireUserId ? "on" : "off"}`,
          `defaultUserId=${data.config.defaultUserIdConfigured ? "set" : "empty"}`,
        ].join(" | ")
      );
    } catch (error) {
      setHealthMessage(error instanceof Error ? `실패: ${error.message}` : "실패: 알 수 없는 오류");
    } finally {
      setCheckingHealth(false);
    }
  }

  return (
    <section style={{ marginTop: 12, padding: 12, border: "1px solid #ddd", borderRadius: 8, maxWidth: 900 }}>
      <h2 style={{ marginTop: 0 }}>사용자 분리 설정</h2>
      <p style={{ marginTop: 0 }}>
        Supabase 모드에서는 사용자 ID(UUID)가 필요합니다. 저장 후 대시보드 요청에 자동 적용됩니다.
      </p>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input
          value={userId}
          onChange={(event) => setUserId(event.target.value)}
          placeholder="예: 9d6dfca0-b4f2-4a3f-93da-78e4d40138d2"
          style={{ minWidth: 340, padding: 8 }}
        />
        <button onClick={generateUuid} style={{ padding: "8px 12px" }}>
          UUID 생성
        </button>
        <button onClick={saveUserId} style={{ padding: "8px 12px" }}>
          저장
        </button>
        <button onClick={clearUserId} style={{ padding: "8px 12px" }}>
          초기화
        </button>
        <button onClick={probeApi} disabled={probing} style={{ padding: "8px 12px" }}>
          {probing ? "테스트 중..." : "API 테스트"}
        </button>
        <button onClick={checkHealth} disabled={checkingHealth} style={{ padding: "8px 12px" }}>
          {checkingHealth ? "확인 중..." : "서버 상태"}
        </button>
      </div>

      <p style={{ marginBottom: 0, opacity: 0.9 }}>{message}</p>
      {probeMessage ? <p style={{ marginTop: 6, marginBottom: 0, opacity: 0.9 }}>{probeMessage}</p> : null}
      {healthMessage ? <p style={{ marginTop: 6, marginBottom: 0, opacity: 0.9 }}>{healthMessage}</p> : null}
    </section>
  );
}
