import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { LanguageProvider } from "@/contexts/LanguageContext";
import SplashScreen from "@/components/SplashScreen";
import "./globals.css";

export const metadata: Metadata = {
    title: "TQB Calculator - Softball Tie-Breaker",
    description: "Calculate softball tournament standings using WBSC Rule C11 tie-breaking criteria. Supports TQB, ER-TQB, and head-to-head calculations.",
    keywords: ["softball", "TQB", "tie-breaker", "WBSC", "tournament", "rankings"],
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="es" suppressHydrationWarning>
            <body className="antialiased">
                <SplashScreen />
                <LanguageProvider>
                    {children}
                    <Analytics />
                    <SpeedInsights />
                </LanguageProvider>
            </body>
        </html>
    );
}

