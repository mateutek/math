# Tutorial: kid tour and parent page

Date: 2026-10-04

## Goal

Two things a first-time visitor is missing today:

1. **Kids** do not know what the frame around the games does: materials, the
   four tabs, the side panels, settings.
2. **Parents** have nowhere to read what the app teaches, how the rewards work,
   what Tests are for and how privacy is handled.

Kids get a short guided tour. Parents get a static page. No answers are shown in
either (kid-facing screens never show answers).

## Decisions

- Kid tour uses **driver.js** (framework-agnostic, ~5 KB gzip, no deps). The app
  is Vue 3, so React tour libraries are out.
- The tour stays on the Play page and points at things. It does not navigate and
  does not explain sub-pages (village, individual games, theory articles).
- Read aloud uses the browser's built-in `speechSynthesis`. No new dependency.
- The parent explainer is a page, not a tour: it is reading material, not
  pointing at buttons.

## 1. Kid tour

### Offer

- `ClassPicker.start()` saves the class and pushes `/graj`. When the class was
  `null` before that (first-ever pick) and `tourSeen` is not set, the Play page
  opens a small dialog (reka-ui Dialog, already installed):
  "Want me to show you around?" with **Yes** and **Skip**.
- Either answer sets `localStorage.tourSeen = '1'`. The offer never comes back.
- Changing the class later from Settings does not offer the tour again.

### Replay

- The Settings sheet header gets a round **?** button (lucide `CircleHelp`,
  `aria-label` "Show the tour") next to the title. It closes the sheet, goes to
  `/graj` if the kid is elsewhere, and starts the tour.

### Steps

On `/graj`, in this order. One short sentence each, all through `t()` (PL + EN).

| # | Element | Text (EN draft) |
|---|---------|-----------------|
| 1 | Class chip | Your class. The games match it. |
| 2 | First game group | Pick a game and solve the problems. |
| 3 | Materials counter (header) | Good answers earn materials. |
| 4 | Village tab | Build your village with them. |
| 5 | Play tab | All the games are here. |
| 6 | Theory tab | Stuck? See how it works. |
| 7 | Tests tab | Practice sheets to print, with a parent. |
| 8 | Side column (Next goal / Rewards) | What you are saving for, and what this game pays. |
| 9 | Settings gear | Change class, language or theme, or replay this tour. |

### Phone vs desktop

- Elements get `data-tour="<step>"` attributes. Where the two layouts render
  different elements (top nav vs bottom bar), both carry the same attribute.
- When a step starts, the tour picks the first matching element that is
  visible (`el.offsetParent !== null` or a non-zero client rect). Steps with no
  visible element are dropped before the tour starts (step 8 on phones).
- On phones Theory and Tests live behind the "more" button in the bottom bar;
  steps 6 and 7 collapse into one step on that button:
  "Theory and Tests are in here."

### Look

- driver.js popover restyled with the app's tokens (`--k-*` CSS variables) so it
  follows day and night themes. Large Next / Back buttons, a close X, progress
  "3 / 9". Escape and the overlay click close it.

## 2. Read aloud

- Every step's popover has a speaker button that reads the step text with
  `speechSynthesis`, voice picked by `settings.lang` (`pl-PL` / `en-US`).
- For classes 0 to 3 each step reads itself automatically when it opens.
- Speech is cancelled on step change and on close.
- If `speechSynthesis` is missing or `getVoices()` has no voice for the language,
  the speaker button is not rendered and auto-read is skipped. Text still works.

## 3. Parent page

- Route `/dla-rodzicow` (name `parents`), lazy-loaded `src/pages/Parents.vue`,
  laid out like `Privacy.vue`.
- Sections:
  1. What the app is for, in two sentences.
  2. What each class practises: the same list the class picker builds, for all
     classes (reuse the logic from `ClassPicker.vue`, moved into a small shared
     function if needed).
  3. How rewards work: good answers earn materials, materials build the village.
  4. Tests: printable practice sheets from the Tests tab.
  5. Privacy: one line plus a link to `/prywatnosc`.
- Linked from:
  - under the Start button on the class picker: "Parent? Read how it works"
  - a row in the Settings sheet
  - the footer, next to the Conrivo link
- The first-run router guard (`src/router/index.js`) lets `parents` through, the
  same way it lets `privacy` through, so a parent can read it before a class is
  picked.

## 4. Files

New:
- `src/data/tourSteps.js`: the step list as plain data (`{ key, text, phoneKey? }`),
  no DOM or driver.js imports, so node can load it.
- `src/composables/useTour.js`: visible-element picking, driver.js setup,
  speech, `tourSeen` flag, `startTour()` export. Reads `tourSteps.js`.
- `src/data/tourSteps.check.js`: self-check (see Testing).
- `src/pages/Parents.vue`

Edited:
- `src/pages/ClassPicker.vue`: mark first pick for the offer, parent link.
- `src/pages/Play.vue`: show the offer dialog.
- `src/components/SettingsSheet.vue`: ? button, parent page row.
- `src/App.vue`: footer link, `data-tour` attributes on tabs, materials, gear.
- `src/router/index.js`: new route, guard exception.
- `src/i18n.js`: step strings, offer dialog, parent page, link labels (PL + EN).
- `package.json`: add `driver.js`; add the new check to `npm run check`.

## 5. Testing

- `tourSteps.check.js` (plain node asserts, like the other `*.check.js`):
  every step has a non-empty PL and EN string; every step has a `data-tour` key;
  no two steps share a key except the phone-collapsed Theory/Tests pair.
- Manual pass in the browser at phone (375px) and desktop (1280px) widths: offer
  appears once on first pick, Skip and Yes both stop it reappearing, ? replays,
  every step highlights a visible element, read aloud auto-plays for class 2 and
  not for class 5, day and night themes both readable.
- Parent page reachable before a class is picked.

## Out of scope

- Tours of sub-pages (village, individual games, theory, tests).
- A mascot guide.
- A parent dashboard or parent-only answers.
