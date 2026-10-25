# Mississippi State Athletics Web Application — System Architecture & Context

## 1. Project Overview & Operational Philosophy
This repository hosts a mobile-first multi-sport web application for **Mississippi State University Athletics** hosted statically via **GitHub Pages**. 

The core architectural principle is **zero manual score maintenance via a modular hydration pattern**:
* **Baseline Schedules (`data.js`):** Hardcoded baseline fallback schedules, metadata, and seasonal dates (Fall 2026 and Spring 2027) reside statically.
* **Live API Fetcher (`fetcher.js`):** Queries public ESPN API endpoints at runtime to pull live scores, completed game results, TV broadcast channels, game states, and team records.
* **Centralized Merger (`endschedule.js`):** Combines and overrides baseline data with live fetched metadata into a unified reference set (`getUnifiedSchedule()` and `getSportRecords()`) consumed cleanly across all pages.

---

## 2. Global Site Configuration & Setup

### Analytics & State
* **Google Analytics:** Property ID `G-8695308WQ8`. Included in the `<head>` of all HTML pages.
* **Dyslexia Font Mode ("Kate Button"):** Global font toggle persisted across sessions via `localStorage.getItem('dyslexiaMode') === 'enabled'`. Applies the `dyslexia-font` CSS class to `document.documentElement` and `document.body`.

### Global Shared Scripts & Architecture Pipeline
* **`nav.js`:** Manages the mobile slide-out navigation drawer across all pages (`index.html`, `schedules.html`, `grid.html`, `away.html`, `visit.html`).
* **`data.js`:** Exports `masterDataset`, containing the baseline hardcoded schedule and metadata fallback for Mississippi State sports (Football, Men's Basketball, Women's Basketball, Baseball, Softball) covering Fall 2026 through Spring 2027.
* **`fetcher.js`:** Handles concurrent API requests to ESPN endpoints for all sports, parsing score objects, broadcast networks, game completion statuses, and calculating overall/SEC W/L records.
* **`endschedule.js`:** The core store/merger layer. Merges `data.js` with live updates from `fetcher.js`, handles chronological sorting, caches the dataset in memory, and exposes `getUnifiedSchedule()` and `getSportRecords()`.

---

## 3. Page Architecture & Detailed Specifications

### 1. `index.html` (Weekly Game Center & Live Prioritization)
* **Purpose:** Show upcoming football games for the current week, with live games dynamically prioritized at the top.
# Bully's CFB Board: Game Intensity & Prioritization Algorithm

This document outlines the algorithmic logic used to calculate live game intensity scores, handle upset alerts, suppress meaningless blowouts, and sort games on Bully's CFB Board.

---

## 1. Matchup Base Tiers (`base`)
Every matchup is assigned a foundational prestige score to ensure high-profile games naturally take precedence when game states are comparable:

1. **SEC vs. SEC**: `1200` points *(Highest priority)*
2. **Ranked vs. Ranked** (Top 25): `1000` points
3. **Ranked vs. Anyone Else**: `800` points
4. **Power 4 vs. Power 4** (SEC, Big Ten, Big 12, ACC inter/non-conference): `500` points
5. **All Other Matchups**: `200` points

---

## 2. Margin Bonus (`marginBonus`)
For competitive games, a tighter score gap yields additional points:
* Calculated only when the absolute score margin ($\text{margin}$) is **16 points or fewer**.
* Formula: $\text{Math.round}((16 - \text{margin}) \times 6.25)$
* Maximum bonus: `100` points (for a tie game).

---

## 3. Clock Progression Factor (`timeScore`)
As games progress deeper into quarters, tension increases, adding weight to the overall score:
* **1st Quarter**: Up to `25` points (scaled linearly by elapsed time)
* **2nd Quarter**: `25` to `75` points
* **3rd Quarter**: `100` to `200` points
* **4th Quarter**: `300` to `600` points
* **Overtime ($> 4$th Period)**: Fixed at `700` points

---

## 4. Upset Alerts & Late-Game Thriller Boosts (`upsetBonus`)
To ensure games featuring elite teams in jeopardy stay prominently featured:
* **Trailing 10+ Points**: Triggers a major flat bonus (`900` points for Top 10 teams, `500` points for Top 25 teams).
* **Trailing by 1 to 9 Points**: Triggers a solid upset alert bonus (`500` points for Top 10 teams, `300` points for Top 25 teams).
* **Late-Game Top 10 Thriller**: If a **Top 10 team** is in the **3rd or 4th quarter** and is either trailing or holding a lead of **7 points or less**, they receive a guaranteed boost (`650+` points) to lock them into "Great Game" status.

---

## 5. Blowout Suppression Filter
To prevent lopsided games from artificially climbing the board as the clock winds down:
* If the score margin is **greater than 16 points** and **no active upset alert** is present, the clock progression factor is bypassed. 
* Instead, the game returns a heavily suppressed baseline score (`10%` of its base tier), instantly dropping it into the **Snoozefest (0–2)** category.

---

## 6. Normalization & Display Scale (`0–10`)
The final internal priority score is mapped to an integer value from **0 to 10** for the UI gauge:
* **0–2**: Snoozefest (Red)
* **3–5**: Watchable (Yellow)
* **6–8**: Great Game (Green)
* **9–10**: TURN TV ON NOW! (Bright Lime/Gold)
* 

### 2. `schedules.html` (Multi-Sport Schedule, TV, & Record Tracker)
* **Purpose:** Display comprehensive schedules for Mississippi State sports (Football, Men's Basketball, Women's Basketball, Baseball, Softball) across the Fall 2026 and Spring 2027 seasons.
* **Key Features & Display Rules:**
  * **Filter Behavior:** "All Sports" view displays upcoming/future games from today onward. Selecting a specific sport displays the full season timeline (past results + future games).
  * **Upcoming Games:** Displays date, opponent, home/away indicator, and TV broadcast channel.
  * **Completed Games:** Automatically displays the final score and W/L result badge.
  * **Record Banners:** Dynamically calculates and displays both the overall record and SEC record for the selected sport using the unified store.

### 3. `grid.html` (Saturday Master Game Matrix)
* **Purpose:** Provide a high-density, minimal-scrolling view of all live games and completed games happening on Saturdays, capturing everything going on across college sports on a given Saturday.
# College Football Game Sorting & Priority Rules

## 1. Sorting Hierarchy Overview
Games (both live and completed) are ordered according to the following strict tier-based sequence:
1. **SEC Games** (Highest priority)
2. **Top 25 Matchups** (Ranked #1 through #25 in numerical order)
3. **Non-Ranked Conferences** (Ordered by conference hierarchy)

---

## 2. Detailed Priority Tiers

### Tier 1: SEC Teams
* **Condition:** Any game involving an SEC team (`conferenceId: 8`).
* **Priority Value:** `1`

### Tier 2: Top 25 Ranked Teams
* **Condition:** Any game featuring a team with a Top 25 ranking ($1 \le \text{Rank} \le 25$).
* **Ordering:** Sorted dynamically by their highest ranking (e.g., #1 matches appear before #2, #2 before #3, up to #25).
* **Priority Value:** `2 + Rank` (Values range from `3` to `27`)

### Tier 3: Non-Ranked Conferences
For unranked matchups outside the SEC, games are grouped and ordered by conference ID sequence:

| Order | Conference Name | Conference ID | Conf Key Tag |
| :---: | :--- | :---: | :---: |
| **1** | Big Ten | `5` | `BTN` |
| **2** | Big 12 | `4` | `B12` |
| **3** | ACC | `1` | `ACC` |
| **4** | AAC (AC) | `151` | `AAC` |
| **5** | MAC | `15` | `MAC` |
| **6** | Conference USA (CUSA) | `12` | `CUSA` |
| **7** | Mountain West (MW) | `17` | `MWC` |
| **8** | Pac-12 | `9` | `PAC12` |
| **9** | Sun Belt (SBC) | `37` | `SBC` 

---

## 3. Secondary Sort Rule
* **Tie-Breaker:** If two games fall within the exact same priority tier, they are sorted chronologically by their **game start time** (earliest first).
* 


### 4. `away.html` (Geographic Away Game Distance Calculator)
* **Purpose:** Allow users to input a ZIP code to calculate and display all away games sorted by straight-line mile distance (shortest distance first).
* **Key Features:**
  * **Default ZIP Code:** `33813` (Lakeland, FL).
  * **Scope:** Includes all away games across all MSU sports for Fall 2026 and Spring 2027.
  * **Calculation:** Computes approximate geodesic/straight-line distance from the entered origin ZIP code to each opposing venue location.

### 5. `visit.html` (Starkville Trip Planner & Crossover Calculator)
* **Purpose:** Allow a user to input the number of days they plan to visit Starkville to discover upcoming home games across all sports falling within that window.
* **Key Metrics Returned:**
  * **Total Games:** Total number of home sporting events occurring during the specified day span.
  * **Crossover Sports:** Number of distinct sports playing during the trip (e.g., a 5-day visit capturing 2 baseball games and 1 men's basketball game outputs **3 total games** and **2 crossover sports**).
  * 
