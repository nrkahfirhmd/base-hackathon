import type { Metadata , Viewport} from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DeQRypt",
  description: "Pay with Crypto via QR",
  other: {
    "base:app_id": "69763e273a92926b661fd516",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased
        bg-gray-100 dark:bg-gray-900 flex justify-center min-h-screen`}
      >
        <div className="w-full max-w-md bg-white dark:bg-black min-h-screen shadow-2xl relative overflow-x-hidden overflow-y-auto border-x border-gray-200 dark:border-gray-800">
          {children}
        </div>
      </body>
    </html>
  );
}
