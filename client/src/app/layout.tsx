import "./globals.css"
import { Inter, Oswald } from "next/font/google"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
})

const oswald = Oswald({
  subsets: ["latin"],
  weight: ["700"],          // important: you use font-weight: 700
  variable: "--font-oswald",
  display: "swap",
})

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${oswald.variable}`}>
      <body>{children}</body>
    </html>
  )
}
