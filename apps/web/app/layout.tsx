import "./globals.css";

export const metadata = {
  title: "노티스 대시보드",
  description: "노티스 웹 대시보드",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}