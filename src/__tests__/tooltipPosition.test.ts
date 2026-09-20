import { describe, it, expect } from 'vitest';
import { computeTooltipPosition, Rect, TooltipSize, ViewportSize } from '@/lib/tooltipPosition';

describe('Unit Tests: computeTooltipPosition (FASE 10c)', () => {
    const defaultViewport: ViewportSize = { width: 1024, height: 768 };
    const defaultTooltipSize: TooltipSize = { width: 160, height: 32 };

    it('positions tooltip below target and horizontally centered when space permits', () => {
        const target: Rect = { top: 100, left: 200, width: 100, height: 40, bottom: 140, right: 300 };
        const res = computeTooltipPosition(target, defaultTooltipSize, defaultViewport, 'bottom', 8, 8);

        // top = target.bottom (140) + gap (8) = 148
        expect(res.top).toBe(148);
        // left = target.left (200) + target.width/2 (50) - tooltipWidth/2 (80) = 170
        expect(res.left).toBe(170);
        expect(res.placedPosition).toBe('bottom');
    });

    it('flips position from bottom to top when target is near the bottom edge', () => {
        const target: Rect = { top: 720, left: 200, width: 100, height: 40, bottom: 760, right: 300 };
        const res = computeTooltipPosition(target, defaultTooltipSize, defaultViewport, 'bottom', 8, 8);

        // Flips to top: top = target.top (720) - height (32) - gap (8) = 680
        expect(res.top).toBe(680);
        expect(res.placedPosition).toBe('top');
    });

    it('flips position from top to bottom when target is near the top edge', () => {
        const target: Rect = { top: 10, left: 200, width: 100, height: 40, bottom: 50, right: 300 };
        const res = computeTooltipPosition(target, defaultTooltipSize, defaultViewport, 'top', 8, 8);

        // Flips to bottom: top = target.bottom (50) + gap (8) = 58
        expect(res.top).toBe(58);
        expect(res.placedPosition).toBe('bottom');
    });

    it('clamps horizontal position when target is near the left edge', () => {
        const target: Rect = { top: 100, left: 0, width: 20, height: 20, bottom: 120, right: 20 };
        const res = computeTooltipPosition(target, defaultTooltipSize, defaultViewport, 'bottom', 8, 8);

        // Centered left would be 10 - 80 = -70 -> clamped to margin (8)
        expect(res.left).toBe(8);
        expect(res.top).toBe(128);
    });

    it('clamps horizontal position when target is near the right edge', () => {
        const target: Rect = { top: 100, left: 1000, width: 20, height: 20, bottom: 120, right: 1020 };
        const res = computeTooltipPosition(target, defaultTooltipSize, defaultViewport, 'bottom', 8, 8);

        // Centered left would be 1010 - 80 = 930 -> right edge is 930 + 160 = 1090 > 1024 - 8 (1016)
        // Clamped to 1024 - 8 - 160 = 856
        expect(res.left).toBe(856);
    });

    it('handles mobile viewport of 320px correctly with safe bounds', () => {
        const mobileViewport: ViewportSize = { width: 320, height: 568 };
        const largeTooltipSize: TooltipSize = { width: 350, height: 40 };
        const target: Rect = { top: 200, left: 100, width: 120, height: 40, bottom: 240, right: 220 };

        const res = computeTooltipPosition(target, largeTooltipSize, mobileViewport, 'bottom', 8, 8);

        // Max available width on 320px screen with 8px margin is 304px
        expect(res.maxWidth).toBe(304);
        // Left clamped to margin (8)
        expect(res.left).toBe(8);
        expect(res.top).toBe(248);
    });

    it('respects left/right position preference when requested and space is available', () => {
        const target: Rect = { top: 200, left: 400, width: 100, height: 40, bottom: 240, right: 500 };

        const resLeft = computeTooltipPosition(target, defaultTooltipSize, defaultViewport, 'left', 8, 8);
        // left = target.left (400) - tooltipWidth (160) - gap (8) = 232
        expect(resLeft.left).toBe(232);
        expect(resLeft.placedPosition).toBe('left');

        const resRight = computeTooltipPosition(target, defaultTooltipSize, defaultViewport, 'right', 8, 8);
        // left = target.right (500) + gap (8) = 508
        expect(resRight.left).toBe(508);
        expect(resRight.placedPosition).toBe('right');
    });
});
