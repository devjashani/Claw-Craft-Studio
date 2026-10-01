import { Anton, UnifrakturCook, Space_Grotesk, JetBrains_Mono } from "next/font/google";

export const fontAnton = Anton({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-anton",
  display: "swap",
});

export const fontUnifraktur = UnifrakturCook({
  weight: "700",
  subsets: ["latin"],
  variable: "--font-unifraktur",
  display: "swap",
});

export const fontSpaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

export const fontJetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});
