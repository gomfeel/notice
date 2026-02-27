import Link from "next/link";

export default function HomePage() {
  return (
    <main style={{ padding: 24, fontFamily: "sans-serif" }}>
      <h1>Notice</h1>
      <p>Dashboard entry point</p>
      <Link href="/dashboard">Go to dashboard</Link>
    </main>
  );
}
