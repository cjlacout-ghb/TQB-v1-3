'use client';

import React, { useState, useRef, useEffect, useLayoutEffect, useCallback, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import {
    computeTooltipPosition,
    Rect,
    TooltipSize,
    ViewportSize,
} from '@/lib/tooltipPosition';

export interface TooltipProps {
    text: string | null | undefined;
    children?: ReactNode;
    position?: 'top' | 'bottom' | 'left' | 'right';
    delayMs?: number;
    disabled?: boolean;
    className?: string;
}

export function Tooltip({
    text,
    children,
    position = 'bottom',
    delayMs = 250,
    disabled = false,
    className = 'inline-flex max-w-full',
}: TooltipProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const [posState, setPosState] = useState<{ top: number; left: number; maxWidth: number } | null>(null);

    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const triggerRef = useRef<HTMLDivElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);
    const isTouchRef = useRef(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const updatePosition = useCallback(() => {
        if (!triggerRef.current || typeof window === 'undefined') return;

        const triggerDomRect = triggerRef.current.getBoundingClientRect();
        const targetRect: Rect = {
            top: triggerDomRect.top,
            left: triggerDomRect.left,
            width: triggerDomRect.width,
            height: triggerDomRect.height,
            bottom: triggerDomRect.bottom,
            right: triggerDomRect.right,
        };

        const tooltipEl = tooltipRef.current;
        let tooltipSize: TooltipSize = { width: 180, height: 36 };

        if (tooltipEl) {
            const ttDomRect = tooltipEl.getBoundingClientRect();
            tooltipSize = {
                width: ttDomRect.width || tooltipEl.offsetWidth || 180,
                height: ttDomRect.height || tooltipEl.offsetHeight || 36,
            };
        }

        const viewport: ViewportSize = {
            width: window.innerWidth,
            height: window.innerHeight,
        };

        const res = computeTooltipPosition(targetRect, tooltipSize, viewport, position);
        setPosState({ top: res.top, left: res.left, maxWidth: res.maxWidth });
    }, [position]);

    const showTooltip = useCallback(() => {
        if (!text || disabled || isTouchRef.current) return;
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
            setIsVisible(true);
        }, delayMs);
    }, [text, disabled, delayMs]);

    const hideTooltip = useCallback(() => {
        if (timerRef.current) clearTimeout(timerRef.current);
        setIsVisible(false);
        setPosState(null);
    }, []);

    // Update position after render/layout when tooltip becomes visible
    const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

    useIsomorphicLayoutEffect(() => {
        if (isVisible) {
            updatePosition();
        }
    }, [isVisible, updatePosition]);

    useEffect(() => {
        if (isVisible) {
            const handleScrollOrResize = () => {
                updatePosition();
            };
            const handleKeyDown = (e: KeyboardEvent) => {
                if (e.key === 'Escape') hideTooltip();
            };

            // Use capture phase for scroll so internal scroll containers are caught
            window.addEventListener('scroll', handleScrollOrResize, true);
            window.addEventListener('resize', handleScrollOrResize);
            window.addEventListener('keydown', handleKeyDown);

            return () => {
                window.removeEventListener('scroll', handleScrollOrResize, true);
                window.removeEventListener('resize', handleScrollOrResize);
                window.removeEventListener('keydown', handleKeyDown);
            };
        }
    }, [isVisible, updatePosition, hideTooltip]);

    useEffect(() => {
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, []);

    const handleTouchStart = () => {
        isTouchRef.current = true;
        hideTooltip();
    };

    if (!text || disabled) {
        return <>{children}</>;
    }

    const portalContent = isVisible && isMounted && typeof document !== 'undefined' ? (
        createPortal(
            <div
                ref={tooltipRef}
                role="tooltip"
                style={{
                    position: 'fixed',
                    top: posState ? `${posState.top}px` : '-9999px',
                    left: posState ? `${posState.left}px` : '-9999px',
                    maxWidth: posState ? `${posState.maxWidth}px` : 'calc(100vw - 16px)',
                    opacity: posState ? 1 : 0,
                }}
                className="z-[9999] px-3 py-1.5 text-xs font-medium text-white bg-dark-900/95 border border-dark-500 rounded-lg shadow-2xl backdrop-blur-sm pointer-events-none transition-opacity duration-150 animate-fade-in w-max min-w-[60px] whitespace-normal break-words text-center leading-normal"
            >
                {text}
            </div>,
            document.body
        )
    ) : null;

    return (
        <div
            ref={triggerRef}
            className={className}
            onMouseEnter={showTooltip}
            onMouseLeave={hideTooltip}
            onFocus={showTooltip}
            onBlur={hideTooltip}
            onTouchStart={handleTouchStart}
        >
            {children}
            {portalContent}
        </div>
    );
}

export default Tooltip;
