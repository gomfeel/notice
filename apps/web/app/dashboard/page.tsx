import IntakeForm from "./intake-form";
import TaskPanel from "./task-panel";

const phase1Checklist = [
  "공유 링크 URL 수집 경로",
  "메타데이터 추출",
  "AI 폴더 추천",
  "Supabase 저장 및 실시간 반영",
];

export default function DashboardPage() {
  return (
    <main style={{ padding: 24, fontFamily: "sans-serif" }}>
      <h1>노티스 대시보드</h1>
      <p>1단계 기능이 API 경로 `POST /api/intake`와 연결되어 있습니다.</p>
      <ul>
        {phase1Checklist.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <IntakeForm />
      <TaskPanel />
    </main>
  );
}