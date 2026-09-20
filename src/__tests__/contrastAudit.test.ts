import { describe, it, expect } from 'vitest';

/**
 * Calculates relative luminance according to WCAG 2.1 specification
 * https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
 */
function getRelativeLuminance(r: number, g: number, b: number): number {
    const sRGB = [r, g, b].map(v => {
        const val = v / 255;
        return val <= 0.04045 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
}

/**
 * Calculates WCAG 2.1 contrast ratio between two hex colors or RGB values
 */
function getContrastRatio(
    fg: { r: number; g: number; b: number },
    bg: { r: number; g: number; b: number }
): number {
    const l1 = getRelativeLuminance(fg.r, fg.g, fg.b);
    const l2 = getRelativeLuminance(bg.r, bg.g, bg.b);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Blends foreground color with opacity over background color
 */
function blendOver(
    fg: { r: number; g: number; b: number; a: number },
    bg: { r: number; g: number; b: number }
): { r: number; g: number; b: number } {
    return {
        r: Math.round(fg.a * fg.r + (1 - fg.a) * bg.r),
        g: Math.round(fg.a * fg.g + (1 - fg.a) * bg.g),
        b: Math.round(fg.a * fg.b + (1 - fg.a) * bg.b),
    };
}

describe('Unit Tests: Color Contrast Audit for Badges and Padlock (FASE 10b Task 6)', () => {
    // Theme colors from tailwind.config.ts & globals.css
    const cardBg = { r: 26, g: 26, b: 46 }; // dark-800 (#1A1A2E)

    // Crimson family for "Fijado" / Padlock
    const crimson400 = { r: 251, g: 113, b: 133 }; // #FB7185
    const crimson500 = { r: 225, g: 29, b: 72 };   // #E11D48

    // Gold family for "En juego"
    const gold400 = { r: 250, g: 204, b: 21 };   // #FACC15
    const gold500 = { r: 234, g: 179, b: 8 };    // #EAB308

    it('verifies "Fijado" badge text contrast meets WCAG AA (>= 4.5:1)', () => {
        // bg-crimson-500/10 over card bg (#1A1A2E)
        const badgeBg = blendOver({ ...crimson500, a: 0.1 }, cardBg);
        const ratio = getContrastRatio(crimson400, badgeBg);

        // Expected ratio ~ 5.93:1
        expect(ratio).toBeGreaterThanOrEqual(4.5);
        expect(ratio).toBeCloseTo(5.93, 1);
    });

    it('verifies closed padlock icon contrast meets WCAG AA UI control requirement (>= 3.0:1)', () => {
        // bg-crimson-500/20 over card bg (#1A1A2E)
        const padlockBtnBg = blendOver({ ...crimson500, a: 0.2 }, cardBg);
        const ratio = getContrastRatio(crimson400, padlockBtnBg);

        // Expected ratio ~ 5.39:1
        expect(ratio).toBeGreaterThanOrEqual(3.0);
        expect(ratio).toBeCloseTo(5.39, 1);
    });

    it('verifies "En juego" badge text contrast meets WCAG AA (>= 4.5:1)', () => {
        // bg-gold-500/10 over card bg (#1A1A2E)
        const badgeBg = blendOver({ ...gold500, a: 0.1 }, cardBg);
        const ratio = getContrastRatio(gold400, badgeBg);

        // Expected ratio ~ 9.30:1
        expect(ratio).toBeGreaterThanOrEqual(4.5);
        expect(ratio).toBeCloseTo(9.30, 1);
    });
});
