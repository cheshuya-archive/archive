import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Чешуя — цифровой архив",
  description: "Улица, объекты, графика, выставки и издания художника Чешуя.",
  icons: { icon: "/media/logo.jpg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ru"><body>{children}</body></html>;
}
