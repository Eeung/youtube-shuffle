import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ReactNode } from 'react'
import Navigation from "./components/navigation";
import MainSection from "./components/MainSection";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Playlist Shuffle",
  description: "Youtube playlist shuffle",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="flex flex-col w-screen h-screen">
          <Navigation/>
          <MainSection>
            {children}
          </MainSection>
        </div>
      </body>
    </html>
  );
}
