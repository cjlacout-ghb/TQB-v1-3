// @vitest-environment jsdom

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import GameCard from '@/components/GameCard';
import { GameData } from '@/lib/types';
import { LanguageProvider } from '@/contexts/LanguageContext';

const renderWithContext = (ui: React.ReactElement) => {
    return render(
        React.createElement(LanguageProvider, null, ui)
    );
};

describe('Unit Tests: GameCard Responsive Layout & Long Team Names (FASE 11)', () => {
    const mockUpdate = vi.fn();
    const mockSwap = vi.fn();
    const mockToggleLock = vi.fn();

    const longTeamGame: GameData = {
        id: 'game-long-names-1',
        teamAId: 'team-a-1',
        teamBId: 'team-b-1',
        teamAName: 'Selección Nacional de Softbol Femenino de la República Argentina',
        teamBName: 'Asociación Deportiva de Softbol de la República Dominicana',
        runsA: 5,
        runsB: 3,
        inningsABatting: '7',
        inningsADefense: '7',
        inningsBBatting: '7',
        inningsBDefense: '7',
        earnedRunsA: 2,
        earnedRunsB: 1,
        isLocked: true,
        groupId: 'A',
    };

    it('renders header title with break-words and min-w-0 to allow multiline wrapping for long team names', () => {
        renderWithContext(
            React.createElement(GameCard, {
                game: longTeamGame,
                gameNumber: 1,
                errors: {},
                onUpdate: mockUpdate,
                onSwap: mockSwap,
                onToggleLock: mockToggleLock,
            })
        );

        const heading = screen.getByRole('heading', { level: 3 });
        expect(heading).toBeDefined();
        expect(heading.textContent).toContain('Selección Nacional de Softbol Femenino de la República Argentina');
        expect(heading.textContent).toContain('vs');
        expect(heading.textContent).toContain('Asociación Deportiva de Softbol de la República Dominicana');

        // Check CSS classes that enable multiline text wrapping without word-clipping or border overflow
        expect(heading.className).toContain('break-words');
        expect(heading.className).toContain('min-w-0');
    });

    it('ensures the status badge ("Fijado") is visible, preserved, and flex-wrapped for long team names', () => {
        renderWithContext(
            React.createElement(GameCard, {
                game: longTeamGame,
                gameNumber: 1,
                errors: {},
                onUpdate: mockUpdate,
                onSwap: mockSwap,
                onToggleLock: mockToggleLock,
            })
        );

        const badge = screen.getByText(/fijado/i);
        expect(badge).toBeDefined();
        expect(badge.className).toContain('flex-shrink-0');

        const parentContainer = badge.parentElement;
        expect(parentContainer).not.toBeNull();
        expect(parentContainer?.className).toContain('flex-wrap');
    });

    it('ensures the "En juego" badge is visible and flex-wrapped for unfixed games with long team names', () => {
        const inPlayGame: GameData = {
            ...longTeamGame,
            isLocked: false,
        };

        renderWithContext(
            React.createElement(GameCard, {
                game: inPlayGame,
                gameNumber: 2,
                showInPlayBadge: true,
                errors: {},
                onUpdate: mockUpdate,
                onSwap: mockSwap,
                onToggleLock: mockToggleLock,
            })
        );

        const inPlayBadge = screen.getByText(/en juego/i);
        expect(inPlayBadge).toBeDefined();
        expect(inPlayBadge.className).toContain('flex-shrink-0');

        const parentContainer = inPlayBadge.parentElement;
        expect(parentContainer?.className).toContain('flex-wrap');
    });

    it('verifies column team headers receive break-words and min-w-0 to prevent column overflow', () => {
        renderWithContext(
            React.createElement(GameCard, {
                game: longTeamGame,
                gameNumber: 1,
                errors: {},
                onUpdate: mockUpdate,
                onSwap: mockSwap,
                onToggleLock: mockToggleLock,
            })
        );

        const teamASpans = screen.getAllByText('Selección Nacional de Softbol Femenino de la República Argentina');
        const teamBSpans = screen.getAllByText('Asociación Deportiva de Softbol de la República Dominicana');

        teamASpans.forEach(span => {
            expect(span.className).toContain('break-words');
            expect(span.className).toContain('min-w-0');
        });

        teamBSpans.forEach(span => {
            expect(span.className).toContain('break-words');
            expect(span.className).toContain('min-w-0');
        });
    });
});
