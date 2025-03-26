import {
  JetBrains_Mono as FontMono,
  Inter as FontSans,
} from "next/font/google";

export let fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export let fontMono = FontMono({
  subsets: ["latin"],
  variable: "--font-mono",
});
