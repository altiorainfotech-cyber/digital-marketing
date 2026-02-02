import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { ErrorBoundary } from "@/components/errors";
import { ToastProvider } from "@/lib/design-system/components/composite/Toast/ToastContainer";
import { WebVitalsReporter } from "@/components/analytics";
import { BrowserDetection } from "@/components/common/BrowserDetection";
import "./globals.css";
import "./browser-fixes.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DASCMS - Digital Asset & SEO Content Management System",
  description: "Role-based web application for managing marketing assets with approval workflows",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <BrowserDetection />
        <ErrorBoundary>
          <SessionProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </SessionProvider>
        </ErrorBoundary>
        <WebVitalsReporter />
      </body>
    </html>
  );
}
