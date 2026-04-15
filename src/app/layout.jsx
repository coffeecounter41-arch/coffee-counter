import { Tajawal } from "next/font/google";
import "./globals.css";

const tajawal = Tajawal({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700", "800", "900"],
  variable: "--font-tajawal",
});


export const viewport = {
  themeColor: "#2563eb", 
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, 
};

export const metadata = {
  title: "coffee-counter | Tableau de bord",
  description: "Systeme intelligent de supervision des machines a cafe",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "coffee-counter",
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr" dir="ltr">
      <head>
        <link rel="icon" href="/icon-192x192.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icon-192x192.svg" />
      </head>
      <body
        className={`${tajawal.variable} font-tajawal antialiased`}
      >
        {children}
      </body>
    </html>
  );
}