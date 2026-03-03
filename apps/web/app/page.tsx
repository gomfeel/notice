import Link from "next/link";

export default function HomePage() {
  return (
    <main style={{ padding: 24, fontFamily: "sans-serif" }}>
      <h1>노티스</h1>
      <p>대시보드 시작 화면</p>
      <Link href="/dashboard">대시보드로 이동</Link>
    </main>
  );
}