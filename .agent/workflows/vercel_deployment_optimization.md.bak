---
description: Optimize a Next.js application for deployment on Vercel
---
# Vercel Deployment Optimization Workflow

This workflow provides a systematic approach for optimizing a Next.js application before deploying to Vercel, ensuring maximum performance and minimum bundle size.

## Prerequisites
- Working Next.js application.
- All code committed to your repository.

## Step 1: Run Linter and Fix Warnings
Before building, ensure the codebase is free of lint warnings and unused variables.
1. Run `npm run lint`.
2. Fix any warnings such as unused imports or unused variables. Leaving them might cause build errors in strict CI environments or bloat the bundle.
// turbo
npm run lint

## Step 2: Next.js Configuration Optimization
Update your `next.config.ts` (or `next.config.js` / `next.config.mjs`) to include production optimizations.
Ensure these flags are true:
- `reactStrictMode: true`
- `compress: true`
- Also add a compiler rule to strip consoles in production:
```ts
const nextConfig = {
    reactStrictMode: true,
    compress: true,
    compiler: {
        removeConsole: process.env.NODE_ENV === "production",
    },
};
```

## Step 3: Implement Dynamic Imports for Heavy Components
Search your main entry points (e.g., `src/app/page.tsx`) for components that are non-critical for the initial page load (like Modals, heavy libraries like jsPDF, Dialogs, etc.).

Refactor standard imports to dynamic imports:
```ts
import dynamic from 'next/dynamic';

// Replace static import:
// import MyHeavyModal from '@/components/modals/MyHeavyModal';

// With dynamic import:
const MyHeavyModal = dynamic(() => import('@/components/modals/MyHeavyModal'), {
    ssr: false, // Set to false if it purely relies on client-side JS (like modals)
});
```

## Step 4: Verify Analytics and Speed Insights Providers
Ensure you have included Vercel Analytics and Speed Insights to monitor production performance. Add to `src/app/layout.tsx`:
```tsx
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body>
                {children}
                <Analytics />
                <SpeedInsights />
            </body>
        </html>
    );
}
```

## Step 5: Execute a Clean Build
Perform a clean build to verify the optimizations and review the bundle sizes. Ensure that the "First Load JS" size is small (ideally well under 200 kB).
// turbo
npm run build

## Step 6: Deploy to Vercel
Once all above steps are completed and bundle size looks optimal, simply push your code to your connected GitHub repository and Vercel will trigger the deployment.
// turbo
git push origin main
