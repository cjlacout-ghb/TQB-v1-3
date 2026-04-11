import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { LanguageProvider } from "@/contexts/LanguageContext";
import SplashScreen from "@/components/SplashScreen";
import "./globals.css";

export const metadata: Metadata = {
    title: "Calculadora de Torneo / Softbol",
    description: "Herramienta profesional para torneos de softbol. Incluye cálculo TQB y ER-TQB, de acuerdo a Regla C11 - WBSC.",
    keywords: ["softball", "TQB", "tie-breaker", "WBSC", "tournament", "rankings"],
    openGraph: {
        title: "Calculadora de Torneo / Softbol",
        description: "Herramienta profesional para torneos de softbol. Incluye cálculo TQB y ER-TQB, de acuerdo a Regla C11 - WBSC.",
        url: "https://tqb-v1-3.vercel.app/",
        siteName: "TQB Calculator",
        locale: "es_ES",
        type: "website",
    },
    twitter: {
        card: "summary",
        title: "Calculadora de Torneo / Softbol",
        description: "Herramienta profesional para torneos de softbol. Incluye cálculo TQB y ER-TQB, de acuerdo a Regla C11 - WBSC.",
    },
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

