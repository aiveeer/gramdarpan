import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ग्रामदर्पण — ग्रामपंचायत लेखा संहिता ERP",
  description: "ग्रामदर्पण (Gramdarpan) - महाराष्ट्र ग्रामपंचायत लेखा संहिता २०११ ERP पोर्टल - मास्टर डेटा एंट्री, नमुना १-३३ ऑटो फिल, कर आकारणी, मागणी व पावती व्यवस्थापन",
  icons: {
    icon: "/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="mr" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
