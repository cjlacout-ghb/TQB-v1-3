// English User Manual Content
import { UserManualSection } from '../lib/types';

export const userManualEN: UserManualSection[] = [
    {
        id: 'introduction',
        title: 'Introduction',
        content: `
The **TQB Calculator** is a tool designed to calculate softball tournament standings using the **WBSC (World Baseball Softball Confederation) Tournament Regulations Rule C11** tie-breaking criteria.

This application helps tournament officials and coaches accurately determine team rankings when multiple teams have the same win-loss record.

### Features
- Calculate and display tournament standings based on official WBSC Rule C11.
- **Auto-Save**: Data is automatically saved to your device. Close the browser at any time and resume exactly where you left off.
- Generate professional PDF reports.
- Support round-robin tournament formats (up to 8 teams).
    `,
    },
    {
        id: 'data-persistence',
        title: 'Data Persistence & Privacy',
        content: `
### Where is data saved?
Data is stored locally in your **browser's storage (localStorage)**. This means:
- **No Server**: Your tournament data is never sent to a server. Privacy is 100% maintained.
- **Persistence**: Data remains on your device even if you close the browser or restart your computer/mobile device.

### Data Loss Scenarios
Your data will be permanently cleared in the following cases:
1. **Incognito Mode**: Data is deleted once you close your private/incognito tab or window.
2. **Clearing Browser Data**: If you manually clear your browser's "Site Data" or "Cache".
3. **Switching Devices/Browsers**: Data is local to the specific browser and device where it was entered. It will not appear on a different computer or a different browser (e.g., moving from Chrome to Safari).
4. **New Tournament**: Clicking **"New Tournament"** in the app manually clears the current data.
    `,
    },
    {
        id: 'getting-started',
        title: 'Getting Started',
        content: `
### Welcome Screen
1. **Continue Tournament**: Automatically resumes your last session with all previously entered data.
2. **New Tournament**: Clears all current data to start a completely new tournament calculation (Step 1).

### Step 1: Enter Team Names
1. Enter the names of all teams in your tournament.
2. Click **"Add Team"** to add more teams (minimum 3, maximum 8).
3. Click the **trash icon** to remove a team.
4. Once you proceed to the next screen, team names cannot be edited.

### Tips
- Use official team names for accurate record-keeping
- Double-check spelling before proceeding
- You can also upload a file (CSV or TXT) with all data pre-filled
    `,
    },
    {
        id: 'csv-upload',
        title: 'File Upload Guide',
        content: `
### File Format (CSV/TXT)

Upload a CSV or TXT file to automatically fill in all team and game data. The file must have the following columns:

| Column | Description |
|--------|-------------|
| Team_A | Name of the first team |
| Team_B | Name of the second team |
| Runs_A | Runs scored by Team A |
| Runs_B | Runs scored by Team B |
| Earned_Runs_A | Earned runs scored by Team A |
| Earned_Runs_B | Earned runs scored by Team B |
| Innings_A_Batting | Innings Team A was at bat |
| Innings_A_Defense | Innings Team A was on defense |
| Innings_B_Batting | Innings Team B was at bat |
| Innings_B_Defense | Innings Team B was on defense |

### Sample File Content

\`\`\`
Team_A,Team_B,Runs_A,Runs_B,Earned_Runs_A,Earned_Runs_B,Innings_A_Batting,Innings_A_Defense,Innings_B_Batting,Innings_B_Defense
Tigers,Eagles,5,3,4,2,7,6.2,6.2,7
Eagles,Sharks,2,8,1,6,7,7,7,7
\`\`\`

### How to Upload
1. **Upload File**: (Step 1) Drop your CSV or TXT file into the upload area.
2. **Verify Data**: (Step 2) The app automatically moves to Step 2. All imported game data is pre-filled.
3. **Edit (Optional)**: If needed, you can correct any values (runs, innings) directly on this screen.
4. **Calculate**: Click **"Calculate Rankings"** at the bottom of the screen to see the results.
    `,
    },
    {
        id: 'entering-games',
        title: 'Entering Game Results',
        content: `
### Auto-Generated Matchups

The system automatically generates all possible matchups in a round-robin format:
- 4 teams = 6 games
- 5 teams = 10 games
- 6 teams = 15 games
- 7 teams = 21 games
- 8 teams = 28 games

### For Each Game, Enter:

**Runs Scored**
- Enter the total runs scored by each team
- Must be a whole number (0 or greater)

**Innings Format**
The innings field uses a special decimal format:
- **Whole innings**: 7, 6, 5, etc.
- **Innings + 1 out**: 7.1 (7 complete innings + 1 out)
- **Innings + 2 outs**: 7.2 (7 complete innings + 2 outs)

**Why this format?**
Softball counts outs per inning (3 outs = 1 complete inning). If a game ends mid-inning, you need to record the partial innings.

**Example**: If a game ends after Team A makes 2 outs in the 7th inning, enter "6.2" (6 complete innings + 2 outs = 6⅔ innings).

### Softball-Specific Rules

To ensure data integrity, the calculator enforces several softball regulatory constraints:

**1. Home/Visitor Sides (Swap Sides)**
- Clicking **"Swap Sides"** toggles which team is the Home team and which is the Visitor.
- This is important because Home/Visitor status affects inning constraints.

**2. Synchronized Innings**
- When you enter **Innings at Bat** for Team A, the **Innings on Defense** for Team B is automatically updated to the same value.
- This ensures consistency across the game record.

**3. Home Team Inning Constraints**
- **Home Team Wins**: If the Home team is winning, they must have **fewer** innings at bat than the Visitor (since the bottom of the last inning is not completed).
- **Home Team Loses**: If the Home team loses, they must have **exactly the same** innings at bat as the Visitor.
    `,
    },
    {
        id: 'tie-breaking',
        title: 'Understanding Tie-Breaking Criteria',
        content: `
### WBSC Rule C11 Tie-Breaking Hierarchy

When multiple teams have the same win-loss record, the following criteria are applied **in order**:

---

**1. Win-Loss Record and Head-to-Head Results**
Teams are first sorted by their overall record. For teams with identical records:
- **2 teams**: The winner of their direct matchup ranks higher.
- **3+ teams**: The team with the best record in games among ONLY the tied teams ranks higher.
- If circular (A beat B, B beat C, C beat A), proceed to TQB.

---

**2. Team Quality Balance (TQB)**

**Formula:**
\`\`\`
TQB = (Runs Scored ÷ Innings at Bat) - (Runs Allowed ÷ Innings on Defense)
\`\`\`

**What it measures:**
- The difference between offensive production and defensive performance
- A higher TQB indicates better overall team quality
- Positive values mean the team scores more runs per inning than they allow

---

**3. Earned Runs TQB (ER-TQB)**

Only used if TQB doesn't resolve ties.

**Formula:**
\`\`\`
ER-TQB = (Earned Runs Scored ÷ Innings at Bat) - (Earned Runs Allowed ÷ Innings on Defense)
\`\`\`

**What it measures:**
- Similar to TQB but uses earned runs (excludes runs scored due to errors)
- Provides a more "pure" measure of team performance

---

**4. Batting Average**
If ER-TQB doesn't resolve ties, compare batting averages among tied teams.
*Note: This requires manual review*

---

**5. Coin Toss**
As a last resort, ties are broken by coin toss.
*Note: This requires manual execution*
    `,
    },
    {
        id: 'viewing-results',
        title: 'Viewing Results',
        content: `
### Rankings Screen

The rankings display shows:
- **Rank Position**: #1, #2, #3, etc.
- **Team Name**: The team's name
- **W-L Record**: Wins and losses
- **TQB/ER-TQB Value**: Calculated balance value (to 4 decimal places)

### Understanding the Values

- **Positive TQB**: Team scores more runs per inning than they allow (good!)
- **Negative TQB**: Team allows more runs per inning than they score
- **Zero TQB**: Perfectly balanced offense and defense

### Tie Resolution Messages

The screen will indicate how ties were resolved:
- "Ties resolved using Head-to-Head Results"
- "Ties resolved using TQB (Team Quality Balance)"
- "Ties resolved using ER-TQB (Earned Runs Team Quality Balance)"
- "Manual review needed for Batting Average or Coin Toss"
    `,
    },
    {
        id: 'exporting',
        title: 'Exporting Results',
        content: `
### Export to PDF

On the final rankings screen, click **"Export to PDF"** to generate a printable report.

**Before exporting:**
1. Enter a **Tournament Name** (e.g., "2026 Regional Championship")
2. Optionally adjust the date (defaults to today)
3. Click **"Generate PDF"**

**The PDF includes:**
- Tournament name and date
- WBSC Rule C11 reference
- Final standings table with all statistics
- Tie-breaking method used
- Game results summary
- Formula reference
    `,
    },
    {
        id: 'example',
        title: 'Example Walkthrough',
        content: `
### Complete Example with 4 Teams

**Teams:** Tigers, Eagles, Sharks, Lions

**Game Results:**

| Game | Score | Innings |
|------|-------|---------|
| Tigers vs Eagles | 5-3 | 7.0 each |
| Tigers vs Sharks | 4-4 | 7.0 each |
| Tigers vs Lions | 6-2 | 7.0 each |
| Eagles vs Sharks | 2-8 | 7.0 each |
| Eagles vs Lions | 5-5 | 7.0 each |
| Sharks vs Lions | 3-1 | 7.0 each |

**Win-Loss Records:**
- Tigers: 2-0-1 (2 wins, 1 tie)
- Sharks: 2-0-1 (2 wins, 1 tie)
- Lions: 0-2-1 (1 tie)
- Eagles: 0-2-1 (1 tie)

**Head-to-Head (Tigers vs Sharks):** Tied 4-4

**TQB Calculation:**
Since head-to-head is tied, calculate TQB:

*Tigers:*
- Runs Scored: 5+4+6 = 15
- Runs Allowed: 3+4+2 = 9
- TQB = (15÷21) - (9÷21) = 0.7143 - 0.4286 = **+0.2857**

*Sharks:*
- Runs Scored: 4+8+3 = 15
- Runs Allowed: 4+2+1 = 7
- TQB = (15÷21) - (7÷21) = 0.7143 - 0.3333 = **+0.3810**

**Final Rankings:**
1. Sharks (TQB: +0.3810)
2. Tigers (TQB: +0.2857)
3. Eagles
4. Lions
    `,
    },
    {
        id: 'troubleshooting',
        title: 'Troubleshooting',
        content: `
### Common Issues

**"Invalid innings format"**
- Use only whole numbers or .1 or .2 decimals
- Valid: 7, 7.1, 7.2, 6, 6.1, 6.2
- Invalid: 7.3, 7.5, 6.33, etc.

**"Winning home team must have fewer innings at bat..."**
- According to softball rules, if the home team wins, they usually do not finish their last half-inning at bat.
- Adjust the **Innings at Bat** for the home team to be less than the visitor.

**"Losing home team must have exactly the same innings..."**
- If the home team loses, they must have completed the same number of offensive opportunities as the visiting team.
- Ensure both teams have the same **Innings at Bat** value.

**"Missing required fields"**
- All runs and innings fields must be filled 
- Check each game for empty inputs

**"Team name already exists"**
- Each team must have a unique name
- Check for duplicate entries

**File upload errors**
- Ensure all 10 columns are present
- Check for missing commas or extra columns
- Verify innings format in your spreadsheet

### Starting Over

Click **"Start New Calculation"** on any results screen to return to the beginning and enter new data. All current data will be cleared.
    `,
    },
    {
        id: 'official-rule-c11',
        title: 'Official Reference & Disclaimer',
        content: `
### WBSC Tournament Regulations - Rule C11

All ties shall be settled in the following sequential order:
1. **Head-to-Head Results**: Winners of direct matchups rank higher.
2. **Team Quality Balance (TQB)**: (Runs Scored / Innings at Bat) – (Runs Allowed / Innings on Defense).
3. **Earned Runs TQB (ER-TQB)**: (Earned Runs Scored / Innings at Bat) – (Earned Runs Allowed / Innings on Defense).
4. **Highest Batting Average**: Comparison among tied teams.
5. **Coin Toss**: As a last resort.

### The Waterfall Rule
Tie-breaking criteria are applied in sequential order. Once a tie moves to a subsequent step (like TQB), the calculation is based ONLY on the games played between the teams currently involved in that specific tie.

### About WBSC Rule C11
This calculator implements the official procedures from the **WBSC (World Baseball Softball Confederation)** Tournament Regulations.

### Disclaimer
While this calculator implements official formulas, always verify results with official tournament documentation. Visit [wbsc.org](https://www.wbsc.org) for official rules.

### Version
TQB Calculator v1.2
    `,
    },
];
