import IntakeForm from "./intake-form";

const phase1Checklist = [
  "Share Extension URL intake path",
  "Metadata extraction",
  "AI folder recommendation",
  "Supabase save + Realtime reflection",
];

export default function DashboardPage() {
  return (
    <main style={{ padding: 24, fontFamily: "sans-serif" }}>
      <h1>Notice Dashboard</h1>
      <p>Phase 1 is connected to API route: POST /api/intake</p>
      <ul>
        {phase1Checklist.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <IntakeForm />
    </main>
  );
}