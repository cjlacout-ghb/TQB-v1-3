export interface Rect {
    top: number;
    left: number;
    width: number;
    height: number;
    bottom: number;
    right: number;
}

export interface TooltipSize {
    width: number;
    height: number;
}

export interface ViewportSize {
    width: number;
    height: number;
}

export interface TooltipPositionResult {
    top: number;
    left: number;
    maxWidth: number;
    placedPosition: 'top' | 'bottom' | 'left' | 'right';
}

/**
 * Pure calculation function for tooltip positioning.
 * Computes viewport-relative top/left coordinates, max-width clamping,
 * and auto-flipping (top/bottom) when space is constrained.
 */
export function computeTooltipPosition(
    targetRect: Rect,
    tooltipSize: TooltipSize,
    viewport: ViewportSize,
    preferredPosition: 'top' | 'bottom' | 'left' | 'right' = 'bottom',
    gap: number = 8,
    margin: number = 8
): TooltipPositionResult {
    const maxAvailableWidth = Math.max(120, viewport.width - margin * 2);
    const effectiveWidth = Math.min(tooltipSize.width, maxAvailableWidth);
    const effectiveHeight = tooltipSize.height;

    let placement = preferredPosition;

    // Flip vertically if insufficient space for preferred placement
    if (placement === 'bottom') {
        const spaceBelow = viewport.height - targetRect.bottom - gap;
        if (spaceBelow < effectiveHeight && targetRect.top - gap >= effectiveHeight) {
            placement = 'top';
        }
    } else if (placement === 'top') {
        const spaceAbove = targetRect.top - gap;
        if (spaceAbove < effectiveHeight && viewport.height - targetRect.bottom - gap >= effectiveHeight) {
            placement = 'bottom';
        }
    }

    let top = 0;
    let left = 0;

    if (placement === 'bottom') {
        top = targetRect.bottom + gap;
        left = targetRect.left + targetRect.width / 2 - effectiveWidth / 2;
    } else if (placement === 'top') {
        top = targetRect.top - effectiveHeight - gap;
        left = targetRect.left + targetRect.width / 2 - effectiveWidth / 2;
    } else if (placement === 'left') {
        top = targetRect.top + targetRect.height / 2 - effectiveHeight / 2;
        left = targetRect.left - effectiveWidth - gap;
    } else if (placement === 'right') {
        top = targetRect.top + targetRect.height / 2 - effectiveHeight / 2;
        left = targetRect.right + gap;
    }

    // Clamp vertical position within viewport bounds
    if (top < margin) {
        top = margin;
    } else if (top + effectiveHeight > viewport.height - margin) {
        top = Math.max(margin, viewport.height - margin - effectiveHeight);
    }

    // Clamp horizontal position within viewport bounds
    if (left < margin) {
        left = margin;
    } else if (left + effectiveWidth > viewport.width - margin) {
        left = Math.max(margin, viewport.width - margin - effectiveWidth);
    }

    return {
        top: Math.round(top),
        left: Math.round(left),
        maxWidth: Math.round(maxAvailableWidth),
        placedPosition: placement,
    };
}
