import IntakeForm from "./intake-form";
import TaskPanel from "./task-panel";

const phase1Checklist = [
  "\uACF5\uC720 \uB9C1\uD06C URL \uC218\uC9D1 \uACBD\uB85C",
  "\uBA54\uD0C0\uB370\uC774\uD130 \uCD94\uCD9C",
  "AI \uD3F4\uB354 \uCD94\uCC9C",
  "Supabase \uC800\uC7A5 \uBC0F \uC900\uC2E4\uC2DC\uAC04 \uBC18\uC601",
];

export default function DashboardPage() {
  return (
    <main style={{ padding: 24, fontFamily: "sans-serif" }}>
      <h1>\uB178\uD2F0\uC2A4 \uB300\uC2DC\uBCF4\uB4DC</h1>
      <p>1\uB2E8\uACC4 \uAE30\uB2A5\uC740 API \uACBD\uB85C `POST /api/intake`\uC640 \uC5F0\uACB0\uB418\uC5B4 \uC788\uC2B5\uB2C8\uB2E4.</p>
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
