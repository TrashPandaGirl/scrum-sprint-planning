# Handoff: Scrum Sprint Planner

## Overview
German-language sprint-planning tool for a single Scrum team: capacity calculation (hours or person-days) from members, workdays, absences and Austrian public holidays; story-point commitment/completion; sprint goals; velocity history with chart; JSON save/load; PDF planning sheet. Persona/owner: Jana (Scrum Master).

## About the Design Files
`scrum-sprint-planner.html` is a **working single-file HTML app** (vanilla JS, no build step). It is the reference for look *and* behavior, and it **must always stay one self-contained file** — do not split it into separate HTML/CSS/JS files or modules.
If the UI is ever ported to a framework (React/Vue/Svelte etc.), recreate it using that codebase's patterns and reuse the pure calculation functions (holidays, capacity, velocity) nearly verbatim.
UI copy must stay German.

## Fidelity
**High-fidelity.** Colors, spacing, type, interactions and copy are final. Recreate pixel-accurately.

## Screens / Views
Single page, max-width 980px, padding 24px 20px. Top bar + 4 tabs.

### Top bar
- Row 1: editable team name (22px/500, borderless, bottom border `--border2`, focus `--blue`), theme toggle (🌓/☀️/🌙 cycles System→Hell→Dunkel), contrast toggle (◑), sprint navigation (‹ Sprint N ›), sprint status badge, **▶ Sprint starten** button, **+ Nächster Sprint** (bg `#006274`, text `#eefcff`), **↑ Laden ▾** menu (Datei / Zwischenablage, last-file hint), save indicator.
- Row 2: **↓ Speichern** (primary, JSON download), 📋 copy-to-clipboard, 🗑 delete sprint (right-aligned, red-framed, 12px/600).

### Tab „Sprint"
1. Section „Nächste Sprint-Kapazitäten": grid (`repeat(auto-fit,minmax(130px,1fr))`, gap 10px) of `.sprint-info` cards (bg `--surface`, radius 8px, padding 12px 14px). Cards: Sprint Nr., Notizen (span 2, textarea min-height 60px, vertical resize).
2. „Letzter Sprint · Sprint N" summary bar (only if a previous sprint exists with SP data): `X SP geplant | Y SP abgeschlossen (green) | Z SP offen (amber)`.
3. Story Points card: Geplant input, Abgeschlossen input (**locked unless sprint status = Aktiv**; opacity .45 when open, .85 when ended, `not-allowed` cursor, tooltip explains), goal status text (`NN% erreicht · Y von X SP`, green ≥80, amber ≥60, else red).
4. Sprint-Ziele: checklist of goals (add/edit/check/delete), `done/total erreicht (pct%)`.
5. „Sprint KPIs" header + metric cards (team capacity, workdays, etc.). Arbeitstage card contains Start/Ende date inputs; Team-Kapazität card contains Einheit selector (Stunden/Personentage).
6. Capacity detail per member: avatar (pastel from palette), bar colored by utilization (≥70 green, ≥40 amber, else red).
7. Abwesenheiten pro Mitglied: accordion per member; day grid cells click-cycle available → half → absent; holidays fixed (blue), weekends muted. Legend chips above.

### Tab „Team"
Member list (name, role, focus %, weekly hours, workdays Mo–So checkboxes, optional per-member meeting hours overriding sprint default), **Meetings** default hours per sprint, roles list (add/rename/delete).

### Tab „Velocity" (hidden if module off)
Metrics: Ø 3 Sprints, Ø 5 Sprints (with adjusted Ø), Höchstwert, Trend. Inline SVG chart: bars per sprint, dashed red Ø3 line, adjusted-SP diamonds. Editable history table (sprint label, SP, adjusted SP); auto-sorted numerically when all labels contain numbers. Starts empty.

### Tab „Einstellungen"
Module toggles (see State), KPI toggles, setup wizard, reset.

### Overlays
- Confirm modal (title, body, OK label) — used for end sprint, delete sprint, reopen.
- Onboarding modal (first visit), setup wizard (step-by-step options with progress).
- Toasts: bottom-center, large, icon circle (✓ success `#9FE1CB`, ✕ error `#F09595`, ℹ info `#B5D4F4`), 3s, animate in (translateY 14px + scale .94 → 1).
- Drag-and-drop overlay for JSON files.

## Interactions & Behavior
- **Sprint lifecycle:** `open` (Offen) → `running` (Aktiv, badge „● Aktiv" green) → `ended` (badge „✓ Sprint beendet"). Ending asks confirmation and upserts `{sprint: nr, sp: completedSP}` into velocity history. Ended sprints can be reopened.
- **+ Nächster Sprint:** saves current, creates sprint nr+1 starting the Monday after current end, 14 days long, carries over unit/meeting hours.
- **Delete sprint:** confirm („Endgültig löschen"); not allowed when only one sprint exists.
- **Live recalculation** on every input change (`recalc()`), debounced autosave to localStorage (400ms).
- **Save indicator** states: saved / exported / error; „unexported changes" flag cleared after JSON export.
- **Modules** hide/show related UI everywhere (`mod(key)`).

### Capacity formula
- Daily rate = weeklyHours / number of workDays.
- Theoretical max = Σ daily rate over sprint days that are member workdays and not holidays.
- Actual (brutto) = same, minus absences (half day = 0.5).
- Meeting deduction = meetingHours × (actual ÷ theoretical max), i.e. meetings shrink proportionally with absence.
- Net = max(0, actual − meeting deduction) × focus%. In „days" unit: net ÷ daily rate.
- Holidays: Austrian public holidays computed per year (Easter-based movable feasts included) — `getAustrianHolidays(year)`.

## State Management
```js
state = {
  teamName, currentSprintIdx,
  sprints: [{ nr, start:'YYYY-MM-DD', end, unit:'days'|'hours', meetingHours,
              committedSP, completedSP, goals:[{id,text,done}], notes,
              dayStates:{ 'YYYY-MM-DD:memberId':'half'|'absent' },
              status:'open'|'running'|'ended' }],
  members: [{ id, name, role, focus, workDays:[1..5], weeklyHours, meetingHours|null }],
  roles: [string], velocity: [{ sprint, sp, adjustedSp }],
  kpis: { goal, commit },
  modules: { storyPoints, velocity, adjustedVelocity, sprintGoals, absences, capacity, notes, planningSheet }
}
```
Legacy `sprint.started` boolean is migrated to `status`.

localStorage keys: app state (`STORAGE_KEY`, `{savedAt, data}`), `sprintplanner-theme`, `sprintplanner-contrast`, `sprintplanner-lastfile`, `sprintplanner-onboarded`, `sprintplanner-wizard-seen`.

Persistence is local-only; sharing is via JSON file or clipboard. No backend required.

## Design Tokens
CSS custom properties on `:root`; theme via `data-theme="light|dark"` (absent = follow system); `data-contrast="high"` overrides all themes.

| Token | Light | Dark | High contrast |
|---|---|---|---|
| --bg | #eefcff | #1e1e1c | #ffffff |
| --bg2 | #ddf6fb | #2a2a28 | #ffffff |
| --bg3 | #cfeef5 | #323230 | #f0f0f0 |
| --surface | #eefcff | #2a2a28 | #ffffff |
| --field | #ffffff | #1e1e1c | #ffffff |
| --text | #006274 | #f0efe8 | #000000 |
| --text2 | #3d8593 | #a0a09a | #000000 |
| --text3 | #7aaeb8 | #6a6a64 | #1a1a1a |
| --accent-label | #006274 | #7fd0de | #000000 |
| --border | rgba(0,98,116,.16) | rgba(255,255,255,.10) | #000 |
| --border2 | rgba(0,98,116,.28) | rgba(255,255,255,.18) | #000 |
| --green | #1D9E75 | = | #006b3c |
| --amber | #BA7517 | = | #8a4b00 |
| --red | #E24B4A | = | #c20000 |
| --blue | #378ADD | = | #004a99 |
| --blue-bg | #E6F1FB | #0c2a45 | #dceaff |

High contrast also: 2px solid black borders on cards/inputs/buttons/tabs, body weight 500, active tab black/white.

Day cells (always light bg, dark text): available `#EAF3DE`/border `#97C459`/text `#3B6D11`; half `#FAEEDA`/`#EF9F27`/`#854F0B`; absent `#FCEBEB`/`#F09595`/`#A32D2D`; holiday `--blue-bg`/`--blue`.

Avatar palette: `#9FE1CB #B5D4F4 #F4C0D1 #FAC775 #CED0F6 #C0DD97 #F5C4B3`.

- Radius: 8px (`--radius`), 12px (`--radius-lg`), pills 999px.
- Typography: system stack (`-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`), base 14px/1.5. Section labels 11px/600 uppercase, letter-spacing .08em. Field labels 11px/600 uppercase .06em. Inputs 13px.
- Cards: bg `--bg`, 0.5px border `--border`, padding 16px 20px, margin-bottom 12px.
- Spacing: grid gaps 10px; section gaps ~20px.

## Assets
No images. Icons are Unicode glyphs/emoji (🌓 ☀️ 🌙 ◑ 📋 🗑 ▶ ✓ ✕ ℹ). External libs via CDN: html2canvas 1.4.1, jsPDF 2.5.1 (PDF planning sheet).

## Files
- `scrum-sprint-planner.html` — complete source (CSS in `<style>`, markup, JS in `<script>`). Key functions: `getAustrianHolidays`, `memberSprintCapacity`, `teamTotalCapacity`, `recalc`, `toggleSprintStarted`, `confirmEndSprint`, `syncSprintToVelocity`, `newSprint`, `deleteSprint`, `applyModules`, `renderVelocityChart`, `exportFile`/`handleImport`, `saveToLocal`/`loadFromLocal`.

## Tests
Unit tests for the holiday and capacity calculations live in `tests/` and run with `npm test` (Node's built-in test runner, no dependencies). `tests/load-calc.js` extracts the pure functions directly from `scrum-sprint-planner.html`, so the tests always cover the shipped code and the app stays a single file.
