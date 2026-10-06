import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SoundWave — votre bibliothèque musicale",
  description: "Une place pour découvrir, écouter et retrouver la musique qui vous accompagne.",
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
