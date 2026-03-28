---
name: Splash Screen Implementation
description: Comprehensive procedure for implementing a premium splash screen with specific branding (CJL logo) and the "Simplifica" typography "científico de tu juego".
---

# Splash Screen Implementation Strategy

This skill outlines the steps to replicate the professional splash screen used in **The Show Pro Series**. It includes branding assets, timing, animations, and responsive considerations.

## Branding Assets

1.  **Logo File:** `_CJL-ProfileAccount_BW2.jpg`
    *   **Source Location:** `/public/images/`
    *   **Alt Text:** "The Show Pro Series"

2.  **Branding Text:** `científico de tu juego`
    *   **Font Family:** `'Simplifica', sans-serif`
    *   **Font Source:** `/public/fonts/SIMPLIFICA Typeface.ttf`
    *   **Styling:** `text-3xl`, `tracking-[0.2em]`, `text-white`, `font-normal`, `lowercase` (No forced capitalization).


## Implementation Procedure

### 1. Font Configuration
Register the font in your global CSS to ensure it's available throughout the application:

```css
@font-face {
  font-family: 'Simplifica';
  src: url('/fonts/SIMPLIFICA%20Typeface.ttf') format('truetype');
  font-weight: normal;
  font-style: normal;
  font-display: swap;
}
```

### 2. Component Structure (Next.js/React)
Create a `SplashScreen` component that occupies the entire viewport until it times out.

```tsx
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

export default function SplashScreen() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // 1.5 seconds display time
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black animate-in fade-in duration-500">
      {/* Responsive Logo Container */}
      <div className="relative w-64 h-64 md:w-80 md:h-80 mb-2">
        <Image
          src="/images/_CJL-ProfileAccount_BW2.jpg"
          alt="The Show Pro Series"
          fill
          priority
          style={{ objectFit: "contain" }}
        />
      </div>

      {/* Branding Phrase */}
      <p 
        className="text-white text-2xl tracking-widest text-center mt-2"
        style={{ fontFamily: "'Simplifica', sans-serif", fontWeight: 'normal' }}
      >
        científico de tu juego
      </p>
    </div>
  );
}
```

## Specifications

### Animation Details
*   **Fade-In Duration:** 500ms (recommend using `animate-in fade-in` or equivalent).
*   **Fade-Out Duration:** If using a transition-aware unmount, use 500ms.
*   **Exit Strategy:** The current implementation uses a simple unmount after 1500ms. For a smoother "fade-out" effect, you can use Tailwind classes like `animate-out fade-out fill-mode-forwards` on a state change before unmounting.

### Timing
*   **Initial Delay:** 1500ms (1.5 seconds) is the standard wait time before the application content is revealed.

### Responsive Design
*   **Mobile Support:** Uses `w-64 h-64` (256px) for the logo to avoid overcrowding small screens.
*   **Desktop Support:** Scales up to `md:w-80 md:h-80` (320px) for a more prominent presence on larger monitors.
*   **Layout:** Uses `flex flex-col` to maintain vertical hierarchy between logo and text.

## Usage in Projects
To integrate, place the `<SplashScreen />` at the root of your layout (e.g., `src/app/layout.tsx` for Next.js) so it covers the entire application loading state.
