import "./globals.css"
import { Cormorant_Garamond, DM_Sans, Space_Grotesk } from "next/font/google"
import SessionProviderWrapper from "./SessionProviderWrapper"
import ConditionalNavbar from "@/components/ConditionalNavbar"
import CookieConsent from "@/components/CookieConsent"
import NavigationLoader from "@/components/NavigationLoader"

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
})

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dmsans",
  display: "swap",
})

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
})

export const metadata = {
  title: "AURUM — Premium Car Rental",
  description: "Luxury car rentals with exclusive rewards. Drive extraordinary.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${cormorant.variable} ${dmSans.variable} ${spaceGrotesk.variable} font-body bg-dark text-white-soft`}>
        <SessionProviderWrapper>
          <NavigationLoader />
          <ConditionalNavbar />
          {children}
          <CookieConsent />
        </SessionProviderWrapper>
      </body>
    </html>
  )
}
