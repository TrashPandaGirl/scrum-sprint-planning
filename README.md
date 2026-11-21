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
- Row 1: editable team name (22px/600, borderless, bottom border `--border2`), save indicator, and on the right the theme toggle (half-circle/sun/moon icon cycles System→Hell→Dunkel) and contrast toggle (◑).
- Row 2: sprint navigation (‹ Sprint N › on `--bg2`), **▶ Sprint starten** / **⏹ Sprint beenden**, status badge, **+ Nächster Sprint** — the only filled button in the bar (`.btn-primary`, `--brand`).
- Row 3: **↓ Speichern** (JSON download), clipboard-icon copy button, **↑ Laden ▾** menu (Datei / Zwischenablage, last-file hint), Planning Sheet, and right-aligned **Sprint löschen** (`.btn-delete`, red-framed, 12px/600). All secondary (outlined).

### Tab „Sprint"
1. Section „Nächste Sprint-Kapazitäten": grid (`repeat(auto-fit,minmax(130px,1fr))`, gap 10px) of `.sprint-info` cards (bg `--surface`, radius 8px, padding 12px 14px). Cards: Sprint Nr., Notizen (span 2, textarea min-height 60px, vertical resize).
2. „Letzter Sprint · Sprint N" summary bar (only if a previous sprint exists with SP data): `X SP geplant | Y SP abgeschlossen (green) | Z SP offen (amber)`.
3. Story Points card: Geplant input, **Abgeschlossen (SP)** input (same size as Geplant; disabled while Offen, editable while Aktiv, read-only once Beendet; a visible hint below says which and what to do), goal status text shown only once the sprint has started (`NN% erreicht · Y von X SP`, green ≥80, amber ≥60, else red).
4. Sprint-Ziele: checklist of goals (add/edit/check/delete), `done/total erreicht (pct%)`.
5. „Sprint KPIs" header + metric cards (team capacity, workdays, etc.). Arbeitstage card contains Start/Ende date inputs; Team-Kapazität card contains Einheit selector (Stunden/Personentage).
6. Capacity detail per member: avatar (pastel from palette), bar colored by utilization (≥70 green, ≥40 amber, else red).
7. Abwesenheiten: one team × days table (`renderMemberAbsences`). Rows = members (sticky name column), columns = sprint days with a divider before each Monday; last column "Tage" = available / possible workdays; footer "Anwesend" = people present per day (amber below half the team). Click cycles available → half (½) → absent (✕); mouse/pen drag along a row paints that state across every day passed; touch only taps (so scrolling never edits); arrow keys move focus (roving tabindex), Enter/Space cycle. Holidays (blue, name in header), weekends (muted) and a member's non-working days (hatched) are not editable. On narrow screens the table scrolls inside its own container with a right edge shadow. Legend chips above.

### Tab „Team"
Member list (name, role, focus %, weekly hours, workdays Mo–So checkboxes, optional per-member meeting hours overriding sprint default), **Meetings** default hours per sprint, roles list (add/rename/delete).

### Tab „Velocity" (hidden if module off)
Metrics: Ø 3 Sprints, Ø 5 Sprints (with adjusted Ø), Höchstwert, Trend. Inline SVG chart: bars per sprint, dashed red Ø3 line, adjusted-SP diamonds. Editable history table (sprint label, SP, adjusted SP); auto-sorted numerically when all labels contain numbers. Starts empty.

### Tab „Einstellungen"
**Darstellung** (first section, saved per device in `localStorage` key `sprintplanner-palette`, mode in `sprintplanner-theme`):
- **Modus:** System / Hell / Dunkel (same setting as the top-bar toggle).
- **Farbschema:** 12 presets from the Wiener Stadtwerke design system (websafe / CI / light): Wien IT (default, = the stylesheet's own palette), Wiener Stadtwerke, Wien Energie, Wiener Netze, Wiener Linien, Wiener Lokalbahnen, WIPARK, Bestattung Wien, Friedhöfe Wien, GWSG, immOH!, BF Wien. Not included on purpose: Bestattungsmuseum, EPOSA, Service Treff, Nextbox.
- **Eigene Farben:** Akzentfarbe + Hintergrund-Ton (color pickers).
- Tokens are derived by `derivePalette()` and written into one `<style id="paletteVars">`: `--brand` = accent (darkened to 4.5:1 on white if needed), `--text`/`--accent-label` = accent darkened to 7:1, `--text2/3`, borders, `--bg2/--bg3/--surface` tinted from the accent, `--page` from the background tint. Dark mode: lighter variant from the CI color at ≥ 4.5:1 on `#1e1e1c`. High contrast and the status colors (green/amber/red, day cells) are never changed.

Module toggles (see State), KPI toggles, setup wizard, reset.

### Overlays
- Confirm modal (title, body, OK label) — used for end sprint, delete sprint, reopen.
- Onboarding modal (first visit), setup wizard (step-by-step options with progress).
- Toasts: bottom-center, large, icon circle (✓ success `#9FE1CB`, ✕ error `#F09595`, ℹ info `#B5D4F4`), 3s, animate in (translateY 14px + scale .94 → 1).
- Drag-and-drop overlay for JSON files.

## Interactions & Behavior
- **Sprint lifecycle:** `open` (Offen) → `running` (Aktiv, badge „● Aktiv" green) → `ended` (badge „✓ Sprint beendet"). Ending asks confirmation and upserts `{sprint: nr, sp: completedSP}` into velocity history. Ended sprints can be reopened.
- **+ Nächster Sprint:** saves current, creates sprint nr+1 starting on the current sprint's end date with the same length in days (default 13 days if no start), carries over unit/meeting hours.
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
- **Commitment recommendation** (hero of the Story Points section, `commitmentRecommendation(avgVel)`): capacity ratio = Σ available gross hours (after holidays and absences) ÷ Σ gross hours of a full sprint of the same length (member workdays only, no holidays, no absences). Target = Ø velocity of the last 3 sprints × ratio; the range shown is round(target × 0.9)–round(target). States: no velocity history or velocity module off → shows the capacity % only; no workdays/members → error text; the planned value is rated "im Bereich" (green), "über" (amber) or "unter" (neutral, framed as buffer) and drawn as a marker on the range scale.
- **Velocity forecast (Monte Carlo)** (`velocityForecast(history, ratio, planned)`, inside the commitment card): 10,000 runs; each run draws one of the last 6 sprints' SP (SP > 0) at random and scales it by this sprint's capacity ratio. Shows the probability of reaching the planned SP and the SP reached with 50 / 85 / 95 % certainty, plus one column per possible outcome: height = SP (zero baseline), share of runs on top, SP below, columns ≥ plan in brand color, dashed „Plan N“ line. Seeded PRNG (from the history and the ratio) so numbers stay stable across re-renders. Needs ≥ 3 sprints of history; hidden when the velocity module is off. With a one-sprint horizon it reproduces the spread of the sampled sprints, so probabilities move in steps of about 1/n.
- **Backlog forecast (Monte Carlo)** (Velocity tab, `backlogForecast(history, backlog, firstRatio)` + `forecastSprintEnd(k)`): 10,000 runs; each run draws past sprints' SP (last 6, SP > 0) until the remaining backlog is done. The first simulated sprint is the current one, scaled by its capacity ratio; later sprints assume full capacity. Sprint end dates follow „+ Nächster Sprint" (start on the previous end, same length). Shows sprints/dates for 50 / 85 / 95 % certainty, the probability of finishing by an optional target date, and a cumulative bar chart per sprint (bars ≥ 85 % in brand color, dashed 85 % line, target sprint outlined). States: < 3 sprints of history, no backlog entered, > 52 sprints (error).
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
  backlog: { sp, target:'YYYY-MM-DD'|'' },   // Backlog-Prognose inputs
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

Keyboard focus: a global `:focus-visible` ring (2px `--blue`, offset 2px); do not add inline `outline:none`. All `<button>`s have `type="button"`.

Color system (added in the redesign): `--page` is the page background and `--bg` the white card surface (light `#eef4f6`/`#ffffff`, dark `#131312`/`#1e1e1c`); `--brand` (`#00788d` light, `#2fb6cb` dark) drives primary buttons, active tab, focus borders and the 4px top stripe; accent hues `--acc-blue/teal/violet/amber/coral/green` tint the KPI cards (top border 3px + 11% background) and the section-label markers (Story Points violet, Sprint-Ziele green, Abwesenheiten amber, Team-Kapazität teal, KPIs blue). Cards: 1px border + soft shadow. Top bar: team name + save status + theme/contrast toggles in row 1; sprint controls in row 2; Speichern, copy, Laden, Planning Sheet and Sprint löschen in row 3.

High contrast also: 2px solid black borders on cards/inputs/buttons/tabs, body weight 500, active tab black/white.

Day cells (always light bg, dark text): available `#EAF3DE`/border `#97C459`/text `#3B6D11`; half `#FAEEDA`/`#EF9F27`/`#854F0B`; absent `#FCEBEB`/`#F09595`/`#A32D2D`; holiday `--blue-bg`/`--blue`.

Avatar palette: `#9FE1CB #B5D4F4 #F4C0D1 #FAC775 #CED0F6 #C0DD97 #F5C4B3`.

- Radius: 8px (`--radius`), 12px (`--radius-lg`), pills 999px.
- Typography: system stack (`-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`), base 14px/1.5. Section labels 11px/600 uppercase, letter-spacing .08em. Field labels 11px/600 uppercase .06em. Inputs 13px.
- Cards: bg `--bg`, 0.5px border `--border`, padding 16px 20px, margin-bottom 12px.
- Spacing: grid gaps 10px; section gaps ~20px.

## Assets
No images. UI icons (theme, clipboard, trash, folder, gear, close) are inline SVG symbols from a sprite at the top of `<body>` (stroke `currentColor`, class `.ico`, `aria-hidden`; icon-only buttons carry an `aria-label`). Remaining glyphs are plain Unicode (◑ ▶ ✓ × ‹ ›); decorative emoji only appear inside German copy (wizard options, toasts). External libs via CDN: html2canvas 1.4.1, jsPDF 2.5.1 (PDF planning sheet).

## Files
- `scrum-sprint-planner.html` — complete source (CSS in `<style>`, markup, JS in `<script>`). Key functions: `getAustrianHolidays`, `memberSprintCapacity`, `teamTotalCapacity`, `recalc`, `toggleSprintStarted`, `confirmEndSprint`, `syncSprintToVelocity`, `newSprint`, `deleteSprint`, `applyModules`, `renderVelocityChart`, `exportFile`/`handleImport`, `saveToLocal`/`loadFromLocal`.

## Tests
Unit tests for the holiday and capacity calculations live in `tests/` and run with `npm test` (Node's built-in test runner, no dependencies). `tests/load-calc.js` extracts the pure functions directly from `scrum-sprint-planner.html`, so the tests always cover the shipped code and the app stays a single file.
