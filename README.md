# TQB Softball Tie-Breaker Calculator

A web application that calculates softball tournament standings using the **WBSC (World Baseball Softball Confederation) Tournament Regulations Rule C11** tie-breaking criteria.

![Next.js](https://img.shields.io/badge/Next.js-15+-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4+-38B2AC?style=flat-square&logo=tailwind-css)

## Features

- **Multi-screen workflow**: Team entry → Game results → TQB Rankings → (optional) ER-TQB
- **Round-robin matchup generation**: Automatically creates all pairings for up to 8 teams
- **Complete tie-breaking hierarchy**:
  1. Win-Loss Record
  2. Head-to-Head Results
  3. TQB (Team Quality Balance)
  4. ER-TQB (Earned Runs TQB)
  5. Manual review indicators for Batting Average / Coin Toss
- **CSV upload**: Pre-fill all team and game data from a spreadsheet
- **PDF export**: Generate professional tournament reports
- **Bilingual user manual**: English and Spanish support
- **Dark theme UI**: Modern, accessible design with purple/green accents

## Getting Started

### Prerequisites

- Node.js 18.0 or higher
- npm or yarn

### Installation

1. Clone or navigate to the project directory:
   ```bash
   cd TQB_v1-1-0
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
src/
├── app/
│   ├── globals.css       # Tailwind CSS + custom styles
│   ├── layout.tsx        # Root layout with fonts & SEO
│   └── page.tsx          # Main app component (state management)
├── components/
│   ├── Header.tsx        # Navigation bar
│   ├── StepIndicator.tsx # Progress indicator
│   ├── screens/
│   │   ├── TeamEntry.tsx       # Screen 1: Enter teams
│   │   ├── GameEntry.tsx       # Screen 2: Enter game results
│   │   ├── TQBRankings.tsx     # Screen 3: TQB results
│   │   ├── EarnedRunsEntry.tsx # Screen 4: Enter earned runs
│   │   └── ERTQBRankings.tsx   # Screen 5: ER-TQB results
│   └── modals/
│       ├── UserManualModal.tsx # Bilingual help documentation
│       └── PDFExportModal.tsx  # PDF generation dialog
├── data/
│   ├── userManualEN.ts   # English manual content
│   └── userManualES.ts   # Spanish manual content
└── lib/
    ├── types.ts          # TypeScript interfaces
    ├── calculations.ts   # TQB/ER-TQB logic
    ├── csvParser.ts      # CSV import parsing
    └── pdfGenerator.ts   # PDF generation
```

## CSV Upload Format

Upload a CSV file with the following columns:

| Column | Description |
|--------|-------------|
| `Team_A` | Name of the first team |
| `Team_B` | Name of the second team |
| `Runs_A` | Total runs scored by Team A |
| `Runs_B` | Total runs scored by Team B |
| `Earned_Runs_A` | Earned runs by Team A |
| `Earned_Runs_B` | Earned runs by Team B |
| `Innings_A_Batting` | Innings Team A was at bat |
| `Innings_A_Defense` | Innings Team A was on defense |
| `Innings_B_Batting` | Innings Team B was at bat |
| `Innings_B_Defense` | Innings Team B was on defense |

### Example CSV

```csv
Team_A,Team_B,Runs_A,Runs_B,Earned_Runs_A,Earned_Runs_B,Innings_A_Batting,Innings_A_Defense,Innings_B_Batting,Innings_B_Defense
Tigers,Eagles,5,3,4,2,7,7,7,7
Eagles,Sharks,2,8,1,6,7,6.2,6.2,7
Tigers,Sharks,4,5,3,4,7,6.2,6.2,7
```

### Innings Format

- Whole innings: `7`, `6`, `5`
- Innings + 1 out: `7.1` (7⅓ innings)
- Innings + 2 outs: `7.2` (7⅔ innings)

## Tie-Breaking Logic (WBSC Rule C11)

### TQB Formula

```
TQB = (Runs Scored ÷ Innings at Bat) - (Runs Allowed ÷ Innings on Defense)
```

### ER-TQB Formula

```
ER-TQB = (Earned Runs Scored ÷ Innings at Bat) - (Earned Runs Allowed ÷ Innings on Defense)
```

### Hierarchy

1. **Win-Loss Record**: Teams sorted by total wins
2. **Head-to-Head**: For tied teams, check direct matchup results
3. **TQB**: Compare Team Quality Balance values
4. **ER-TQB**: If TQB doesn't resolve ties, use earned runs
5. **Batting Average**: Manual review required
6. **Coin Toss**: Manual execution required

## Dependencies

| Package | Purpose |
|---------|---------|
| `next` | React framework with App Router |
| `react`, `react-dom` | UI library |
| `tailwindcss` | Utility-first CSS |
| `jspdf` + `jspdf-autotable` | PDF generation |
| `lucide-react` | Icon library |

## Browser Support

- Chrome 90+
- Firefox 90+
- Safari 14+
- Edge 90+

## Responsive Design

- Mobile: 375px+
- Tablet: 768px+
- Desktop: 1024px+

## Accessibility

- Semantic HTML structure
- ARIA labels for interactive elements
- Keyboard navigation support
- Focus states for form inputs
- WCAG AA color contrast

## License

This project is for educational and tournament management purposes.

## References

- [WBSC Tournament Regulations](https://www.wbsc.org)
- Rule C11: Tie-Breaking Procedures

---

**TQB Calculator v1.1.0** • Built with Next.js, TypeScript, and Tailwind CSS
