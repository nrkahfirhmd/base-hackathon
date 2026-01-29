import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import "@coinbase/onchainkit/styles.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
    return {
        title: "DeQRypt",
        description: "Pay with Crypto via QR",
        other: {
        'base:app_id': '69763dba3a92926b661fd515',
        'fc:miniapp': JSON.stringify({
            version: 'next',
            imageUrl: 'https://deqrypt.vercel.app/embed-image',
            button: {
                title: `Launch DeQRypt`,
                action: {
                    type: 'launch_miniapp',
                    name: 'DeQRypt',
                    url: 'https://deqrypt.vercel.app',
                    splashImageUrl: 'https://deqrypt.vercel.app/splash-image',
                    splashBackgroundColor: '#000000',
                },
            },
        }),
        },
    };
}

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
        <Providers>
          <div className="w-full max-w-md bg-white dark:bg-black min-h-screen shadow-2xl relative overflow-x-hidden overflow-y-auto border-x border-gray-200 dark:border-gray-800">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
