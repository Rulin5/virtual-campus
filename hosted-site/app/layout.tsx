import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Peter Oravec Pixel RPG Portfolio",
  description: "An offline-capable Phaser reconstruction of Peter Oravec's pixel RPG portfolio.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
