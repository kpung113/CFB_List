# Mississippi State Athletics Web Application — System Architecture & Context

## 1. Project Overview & Operational Philosophy
This repository hosts a mobile-first multi-sport web application for **Mississippi State University Athletics** hosted statically via **GitHub Pages**. 

The core architectural principle is **zero manual score maintenance**:
* Baseline schedules, metadata, and seasonal dates (Fall 2026 and Spring 2027) reside statically in `data.js`.
* Live scores, completed game results, broadcast channels, rankings, and status indicators are fetched at runtime via public ESPN API endpoints.

---

## 2. Global Site Configuration & Setup

### Analytics & State
* **Google Analytics:** Property ID `G-8695308WQ8`. Included in the `<head>` of all HTML pages.
* **Dyslexia Font Mode ("Kate Button"):** Global font toggle persisted across sessions via `localStorage.getItem('dyslexiaMode') === 'enabled'`. Applies the `dyslexia-font` CSS class to `document.documentElement` and `document.body`.

### Global Shared Scripts
* **`nav.js`:** Manages the mobile slide-out navigation drawer across all pages (`index.html`, `schedules.html`, `grid.html`, `away.html`, `visit.html`).
* **`data.js`:** Exports `masterDataset`, containing full schedules and metadata for Mississippi State sports (Football, Men's Basketball, Women's Basketball, Baseball, Softball) covering Fall 2026 through Spring 2027.

---

## 3. Page Architecture & Detailed Specifications

### 1. `index.html` (Weekly Game Center & Live Prioritization)
* **Purpose:** Show upcoming football games for the current week, with live games dynamically prioritized at the top.
* **Live Game Prioritization Criteria:**
  * **Game State:** Active live games (especially 4th quarter or close scores) take top priority.
  * **Conference Context:** SEC matchups are prioritized.
  * **Competitiveness:** Margin of score (one-score games / tie games).
  * **Rankings:** Presence of ranked teams (Top 25).

### 2. `schedules.html` (Multi-Sport Schedule, TV, & Record Tracker)
* **Purpose:** Display comprehensive schedules for Mississippi State sports (Football, Men's Basketball, Women's Basketball, Baseball, Softball) across the Fall 2026 and Spring 2027 seasons.
* **Key Features & Display Rules:**
  * **Upcoming Games:** Displays date, opponent, home/away indicator, and TV broadcast channel.
  * **Completed Games:** Automatically displays the final score and W/L result badge.
  * **Record Banners:** Dynamically calculates and displays both the overall record and SEC record for the selected sport.

### 3. `grid.html` (Saturday Master Game Matrix)
* **Purpose:** Provide a high-density, minimal-scrolling view of all live games and completed games happening on Saturdays, capturing everything going on across college sports on a given Saturday.
* **Sorting & Ordering Rules:**
  * SEC games prioritized.
  * Top 25 ranked matchups featured prominently.
  * Specific conference sorting order hierarchy to optimize game-day scanning on mobile screens.

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
    
