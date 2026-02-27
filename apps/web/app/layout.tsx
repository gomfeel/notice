import "./globals.css";

export const metadata = {
  title: "Notice Dashboard",
  description: "Notice web dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
