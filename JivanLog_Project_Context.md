# JivanLog — Claude Project Context

## App Overview
- **Name:** JivanLog
- **Type:** Single-file React PWA (index.html)
- **Current version:** v4.62 (cache c78)
- **URL:** https://git-kummah.github.io/jivanlog/
- **Firebase:** AIzaSyDylLKmasm2VzN87Za-JmaF7HAq_1NBdbc (Realtime DB + Auth)
- **Stack:** React 18 + Babel in-browser, Firebase 10.12.2, Chart.js 4.4.1
- **Deployed:** GitHub Pages (git-kummah/jivanlog repo)
- **Developer:** Mahesh Kumar, Mumbai. Hetzner VPS: 65.108.213.157

## Purpose & Design Philosophy
Core goals center on reliable **offline-first data integrity** and a clean,
responsive UI with meaningful visual feedback. Mahesh wants the app usable
regardless of connection quality — write locally first, sync when possible,
never silently lose data.

## Entry Types
| Type | Key Fields |
|---|---|
| meal | mealType, food, foodSubType, qty, unit, notes |
| liquid | liquidType, liquidSubType, ml, notes |
| exercise | exType, subType, dist, time, count, notes |
| medical | readingType, value, unit, notes |
| medication | med, timing, notes |

## Data Structures (Firebase)
```
users/{uid}/
  entries/{id}: {id, date, timestamp, type, ...fields}
  settings: {foodCategories[], liquidTypes[], liquidNotes{}, liquidSubTypes{},
             liquidIcons{}, exerciseTypes[], medicalPresets[], medications[],
             medicationIcons{}, ...}
  defaults: (same structure — draft config)
  theme: "light"|"dark"|"system"
```

## Offline Sync Architecture (built as of v4.60/c76)
This was implemented to fix the root issue of **silent entry discard on
reconnect/refresh** when entries were added offline.

- **Offline queue:** `localStorage` key `jivanlog-offlineQ-{uid}` holds
  entries written while offline.
- **Flush triggers (three independent paths):**
  1. On successful Firebase write
  2. On `window.addEventListener("online")` firing
  3. On merge with the Firebase real-time listener when it fires
- **Sync status icons** (deliberate UX priority, not cosmetic):
  - 📵 offline
  - ⏳ pending
  - 💾 saving
  - ✓ synced (color: dark green `#4ade80`)

**Open question / not yet confirmed in this design:** conflict behavior when
the *same* entry is edited on two devices while one was offline. Current
architecture is queue-and-flush, which implies last-write-wins by default —
this has not been explicitly decided or tested. Revisit if multi-device
simultaneous editing becomes a real scenario (currently believed low-risk
given Mahesh's actual usage pattern — confirm before assuming).

## Critical Technical Rules
1. **Firebase keys:** cannot contain `. # $ [ ] /` — always sanitize IDs with
   `.replace(/[\s.#$\[\]/]/g,"_")`
2. **Date format:** always `YYYY-MM-DD` internally — `normDate()` global
   helper converts all formats
3. **Import:** use Firebase `.update()` for new entries (not `.set()`) —
   avoids overwriting all data
4. **Entry IDs:** `rawId || [date,time,type,subtype,detail1,rowIndex].join("|").sanitized`
5. **Version bump:** always increment `APP_VERSION` AND the service worker
   cache string on **every** build — no exceptions, even for minor changes.
   Reusing version/cache values across distinct builds is a hard rule
   violation. Service worker cache version bumps are required for UI changes
   to actually become visible to users (a stale cache was the root cause of
   a duplicate-button-not-appearing bug previously).
6. **`addEntry` always overwrites the passed ID** with a fresh `genId()` —
   duplicating entries requires the separate `addEntryDirect` callback,
   which preserves the entry as-is. Do not assume `addEntry` is ID-safe for
   copy/duplicate flows.
7. **Read before edit:** always read the exact current code before any change
8. **Verify before build:** run Python checks after every change

## Date Formats Handled
| Input format | Example | Converts to |
|---|---|---|
| YYYY-MM-DD | 2026-03-01 | passthrough ✓ |
| DD-MM-YY | 08-02-26 | 2026-02-08 |
| DD-MM-YYYY | 08-02-2026 | 2026-02-08 |
| DD Mon YYYY | 1 Mar 2026 | 2026-03-01 |

## Feature List (as of v4.60)
- **Home:** Entry forms with config notes auto-fill, Today's Log with icons
- **Manage:** ◀ date ▶ navigation + calendar picker, inline edit/delete, entry
  count. **Defaults to today's date** (not most recent entry date — changed
  deliberately).
- **Duplicate entry (📋 button, Manage screen):** creates a copy, opens it in
  an inline edit form labeled "📋 Duplicating", saves on confirm, and cleanly
  deletes the copy on cancel via `onDelete(e.id)` inside `onCancel`.
- **Reports:** View (daily summary) + Compare (multi-date) + Trends (Chart.js)
- **Trends:** Sugar/Weight/BP, 6 ranges (7d/30d/90d/12w/25w/all), 3 agg modes
  (avg/first/last)
- **Settings:** Config tabs (Food/Drinks/Exercise/Medical/Meds), A→Z sort +
  manual reorder, Apply▶
- **Icons:** pickIcon(), ICON_MAP (~90 rules), EmojiPicker with search, IconBtn
- **Import/Export:** CSV with multi-format date parsing, Firebase `.update()`
  for imports
- **Themes:** Light/Dark/System with full token set
- **Offline sync:** see dedicated section above

## Version History (key milestones)
| Version | Key Change |
|---|---|
| v4.19 c28 | Last pre-icon baseline — all core features working |
| v4.20-v4.36 | Icon system, sort buttons, trends panel, TLE icons |
| v4.36 c52 | Fixed missing `value=` on icon-decorated options (root cause of many bugs) |
| v4.37 c53 | TLE icons for liquid/medical/medication, sort buttons all 5 config tabs |
| v4.38 c54 | Import pipeline fixed (water/drinks→liquid, Detail1\|\|T fallback) |
| v4.47 c63 | ◀ date ▶ navigation in Manage + Reports calendar pickers |
| v4.51 c67 | Firebase key sanitization (dots in IDs were breaking all imports) |
| v4.52 c68 | Comprehensive date format parser (DD-MM-YY, DD-MM-YYYY support) |
| v4.53 c69 | Date normalisation on Firebase load |
| v4.54 c70 | Global normDate helper, export always YYYY-MM-DD, import uses normDate |
| v4.60 c76 | Offline queue (localStorage), sync status icons, duplicate-entry feature, Manage defaults to today |
| v4.61 c77 | Fixed 3 regressions found in real-world testing of v4.60's offline work: (1) `today()` used `toISOString()` (UTC) instead of local date — misdated entries made between local midnight and 5:30am IST to the previous day; (2) offline entries could be silently lost on refresh — the entries listener treated Firebase's optimistic local echo of a still-pending offline write as proof of sync and cleared the offline queue before the write actually reached the server; now queue clearing is gated on confirmed `.info/connected` status; (3) sign-in could hang indefinitely offline (stuck on "Signing in…") — added an offline check before attempting `signInWithPopup`, a 15s timeout on the sign-in attempt, and a 6s safety timeout on the auth boot check. Root cause of (3) not fully confirmed — see Pending/Open Items. |
| v4.62 c78 | Added configurable day-rollover time (Settings → General → 🌙 Day Rollover). Default stays 1:30am (was hardcoded local-midnight as of v4.61). New Firebase path `users/{uid}/dayRolloverMin` (minutes after midnight), immediate-effect like Theme (no Apply▶ needed), cached to localStorage (`jivanlog-rolloverMin`) so it's correct on offline boot before Firebase loads. |

> **Note on version history maintenance:** GitHub's commit history is the
> canonical version record going forward. This table does not need exhaustive
> per-version upkeep — only the current source file needs to stay in project
> knowledge so future sessions start from the correct baseline. Descriptive
> commit messages are sufficient; this table is a quick-glance summary only.

## Build Process
```bash
# 1. Edit jl-v4.html
# 2. Bump APP_VERSION="vX.XX" in code
# 3. Create folder structure:
mkdir "JL vX.XXcNN"
cp jl-v4.html "JL vX.XXcNN/index.html"
cp manifest.json icon.svg "JL vX.XXcNN/"
# 4. Write new sw.js with bumped CACHE=jivanlog-vNN
# 5. Zip and deploy:
zip -r JL4_vX.XX_cNN.zip "JL vX.XXcNN/"
# 6. Git push to github.com/git-kummah/jivanlog
```

## Working Style & Patterns
- **Strict version discipline:** every zip delivery (`JL4_vX.XX_cYY.zip`)
  must have a unique `APP_VERSION` and cache string. No exceptions.
- **Surgical, targeted edits** preferred over broad rewrites.
- **Communication style:** direct and suggestion-oriented (e.g. "can I
  suggest" rather than silently changing approach).
- **Data integrity and visual feedback** are deliberate UX priorities, not
  afterthoughts — sync state indicators exist because data loss is
  unacceptable, not for polish.

## Pending / Open Items
1. Conflict resolution for simultaneous multi-device edits on the same
   entry — not yet explicitly designed (see Offline Sync Architecture note
   above).
2. (Previously listed "offline data sync" issue is now resolved as of
   v4.60/c76 — superseded by this document.)
3. v4.61/c77 fixed the symptom of sign-in hanging offline (timeout +
   offline check, see Version History), but the deeper question of why a
   previously-signed-in session didn't restore from persisted auth state
   while offline is still open. Leading hypothesis: App Check enforcement
   is turned on for Authentication in the Firebase Console, which would
   require a network round-trip even for what should be a local
   IndexedDB-based session restore. Check Firebase Console → App Check →
   APIs → Authentication enforcement status to confirm or rule this out.

## Tools & Resources
- React (single-file HTML architecture), Firebase Realtime Database
- GitHub Pages for deployment; GitHub commit history as the canonical
  version record
- `localStorage` for offline queue persistence
- Service worker with versioned cache strings for PWA offline support

## Files in This Knowledge Base
| File | Description |
|---|---|
| index.html | Current production source (v4.62/c78) — **replace this whenever a newer build ships; keep only the current build here, not old versions** |
| sw.js | Current service worker (cache jivanlog-v78) |
| manifest.json | PWA manifest |
| sugar_diary_import.csv | Historical diary data (Jan-Mar 2026, 1324 rows) |
| jivanlog-config-2026-03-05.csv | App config snapshot |
| jivanlog-manual-v2.docx | User manual v2 |
| jivanlog-security-guide.docx | Security guide |

## Working mode: everything happens in this chat/Project

All JivanLog work — design discussion, debugging, AND actual implementation
(reading source, making edits, producing the buildable output) — happens
directly in this chat/Project. There is no separate Claude Code (VS Code)
step anymore; do not write instructions for Mahesh to paste elsewhere.

When a fix or feature is needed:
- Read the actual current source file from the Project's files/uploads —
  never assume code structure from this doc's descriptions.
- Make the edit directly using file tools here.
- Verify (syntax/structure checks) before presenting the result.
- Bump APP_VERSION and the service worker cache string — every build, no
  exceptions (see Critical Technical Rules above).
- Deliver the updated index.html / sw.js as files, and summarize what
  changed and why.
- Update this Project Context doc's version reference and version-history
  table when a new build ships, since it's the baseline future sessions
  start from.

If Mahesh reports results from testing a deployed build, treat that as
ground truth about current app state — it reflects the real, possibly
more-current, source.
