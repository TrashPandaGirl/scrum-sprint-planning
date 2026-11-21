# Lessons
- `scrum-sprint-planner.html` must stay a single self-contained file. Never split it into `index.html`/`styles.css`/modules, even though the README's suggested prompt proposes it. Test the code by extracting it from the HTML (see `tests/load-calc.js`).
- When replacing inputs' inline `outline:none`, don't add `aria-hidden` to a hidden-but-focusable `<input type=file>`; the linter flags it as critical. `display:none` plus `tabindex="-1"` is enough.
