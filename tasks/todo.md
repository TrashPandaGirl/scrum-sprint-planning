# UX lint fixes (branch ux-lint-fixes)
- [x] type="button" on all buttons
- [x] Visible keyboard focus: drop inline `outline:none`, add global :focus-visible ring
- [x] a11y: teamName aria-label, fileInput aria-hidden, thumbnail svg aria-hidden, title-only hints get aria-describedby
- [x] High contrast: delete-sprint button + toasts consistent
- [x] Emoji UI icons -> inline SVG (theme, clipboard x2, trash, folder, gear, close, modal headings); update README
- [x] npm test, re-lint, screenshots (light/dark/high contrast)
Skipped on purpose: 55 inline styles (refactor risk), width/left transitions, hairline+shadow, system font, copy emoji in wizard/toasts (German copy)
