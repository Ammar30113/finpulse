import type { Metadata } from "next";
import "./globals.css";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider } from "@/components/layout/AuthProvider";

export const metadata: Metadata = {
  title: "FinPulse — Personal Finance Dashboard",
  description: "Track expenses, manage credit, and achieve your financial goals",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ErrorBoundary>
          <AuthProvider>{children}</AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
