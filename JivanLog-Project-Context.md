# JivanLog — Claude Project Context

## App Overview
- **Name:** JivanLog
- **Type:** Single-file React PWA (index.html)
- **Current version:** v4.64 (cache c80 / `jivanlog-v80`)
- **URL:** https://git-kummah.github.io/jivanlog/
- **Firebase:** AIzaSyDylLKmasm2VzN87Za-JmaF7HAq_1NBdbc (Realtime DB + Auth)
- **Stack:** React 18 + Babel in-browser, Firebase 10.12.2, Chart.js 4.4.1
- **Deployed:** GitHub Pages (git-kummah/jivanlog repo)
- **Developer:** Mahesh Kumar, Mumbai. Hetzner VPS: 65.108.213.157

## Purpose & Design Philosophy
Core goals center on reliable **offline-first data integrity** and a clean,
responsive UI with meaningful visual feedback. Mahesh wants the app usable
regardless of connection quality — **write locally first, sync when possible,
never silently lose data.** As of v4.64 this is enforced architecturally: the
device (a full local mirror) is the source of truth, not the network.

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
  settings:   {foodCategories[], liquidTypes[], liquidNotes{}, liquidSubTypes{},
               liquidIcons{}, exerciseTypes[], medicalPresets[], medications[],
               medicationIcons{}, ...}
  defaults:   (same structure — draft config)
  theme:      "light"|"dark"|"system"
  dayRolloverMin: number (minutes after midnight; default 90 = 1:30am)
  dailyBackup: {date, savedAt, count, entries:[...]}   ← NEW in v4.64
```

## localStorage keys (per-device durability)
| Key | Purpose |
|---|---|
| `jivanlog-mirror-{uid}` | **Full mirror of ALL entries** — durable source of truth, offline view + recovery (NEW v4.64) |
| `jivanlog-offlineQ-{uid}` | Pending unsynced writes; cleared only on confirmed server write |
| `jivanlog-dailyBackup-{uid}` | Small snapshot of TODAY's entries, overwritten daily (NEW v4.64) |
| `jivanlog-todayCache-{uid}-{date}` | Today's entries fast-path cache |
| `jivanlog-settingsCache-{uid}` / `jivanlog-defaultsCache-{uid}` | Config for offline cold boot |
| `jivanlog-authUser` | Cached identity {uid,displayName,email,photoURL} for offline login (NEW v4.64) |
| `jivanlog-rolloverMin` | Day-rollover offset for offline-correct `today()` |
| `jivanlog-lastBackup-{uid}` | Date flag for once-per-day auto CSV download |
| `jivanlog-lastRemoteBackup-{uid}` | Date flag for once-per-day backend dailyBackup write (NEW v4.64) |

## Offline-First Architecture (rebuilt in v4.64/c80)
This is the definitive design. It replaces the v4.60 queue-and-flush approach,
which still lost data because it trusted Firebase's optimistic echo and used
collection-level `.set()`.

**Principle: the device is the source of truth, not the network.**

1. **Full local mirror** (`jivanlog-mirror-{uid}`): every entry, all history,
   on disk. Boot hydrates from the mirror (not today-only), so offline shows
   everything and a write can never clobber unseen historical data.
2. **All writes are local-first.** `addEntry` / `addEntryDirect` /
   `updateEntry` / `deleteEntry` write the mirror + today cache + daily backup
   **before** any network attempt, then push to the offline queue, then (if
   online) flush. A failed/killed Firebase write cannot cause loss.
3. **The real-time entries listener is READ-ONLY.** It never writes to Firebase
   and never clears the queue. (The old listener cleared the queue when
   Firebase's optimistic echo made a pending write "appear" synced — that was
   the lift-bug data-loss path.) When offline/unconfirmed it shows mirror+queue
   and ignores the (empty/non-authoritative) server snapshot.
4. **Queue clears only on CONFIRMED server writes**, per-entry.
   `flushOfflineQueue` does `.update(updates)` (additive, never `.set()`),
   races it against a 12s timeout so a mid-flush disconnect can't hang, and on
   resolve removes **exactly the ids it sent** (entries added during the flush
   survive). The `.update()` promise resolves only on server ack while online.
5. **Anti-wipe guard:** if Firebase returns an empty/glitched snapshot while a
   healthy mirror exists, the listener refuses to blank the mirror or screen.
   Only a deliberate clear (gated by `deliberateClearRef`) lets an empty
   through; the clear handlers also clear the mirror/queue/today cache
   explicitly so the guard doesn't fight a real "Clear all".
6. **All collection-level `.set()` on `/entries` is eliminated.** Adds/edits use
   `.update()`; deletes use targeted `.remove()` on the specific key.

### Sync status icons (deliberate UX priority, not cosmetic)
- 📵 offline · ⏳ pending · 💾 saving · ✓ synced (`#4ade80`)
- Header shows a "Sync N" button when the queue is non-empty (manual flush).

### Daily backups (Ask: "small daily file overwritten daily, in case of setbacks")
- **Local:** `jivanlog-dailyBackup-{uid}` = today's entries, refreshed on every
  write, overwritten when the date changes.
- **Backend:** `users/{uid}/dailyBackup` written once per day from authoritative
  server data, in a **separate node** a bad `/entries` write can't destroy.
- **Restore:** Settings → 🛟 Data Safety → ♻️ Restore from daily backup. Reads
  backend (or local, whichever has more entries) and `.update()`s them back into
  `/entries` — additive only, never deletes. Requires connectivity.

### Offline login (long-standing unsolved item — addressed in v4.64)
- On successful online sign-in, identity is cached (`jivanlog-authUser`).
- On boot, if `onAuthStateChanged` doesn't yield a real user within ~4s **and**
  we're offline **and** a cached identity exists, the app opens an **offline
  session** (synthetic user `{...,_offline:true}`, `offlineAuth=true`): full
  mirrored history is visible, new entries queue locally, an "📵 Offline mode"
  banner shows.
- When connectivity + real auth return, the real user replaces the offline one
  and the queue flushes automatically. **Safety does not depend on perfect
  auto-reconciliation** — the queue is durable, so even delayed sync loses
  nothing; worst case it flushes on the next clean online boot.
- Explicit sign-out clears the cached identity (`clearCachedAuthUser`) so an
  offline session can't resurrect a signed-out account.
- **Deeper root cause still open:** App Check enforcement on Authentication may
  force a network round-trip even for local IndexedDB session restore. v4.64
  works regardless, but disabling enforcement (Firebase Console → App Check →
  Authentication) would let the real session restore cleanly offline too. This
  is a console-only change.

## Critical Technical Rules
1. **Device is source of truth.** Write durable local copies (mirror, today
   cache, daily backup) BEFORE any network call, in every write path.
2. **Never `.set()` the `/entries` collection.** Adds/edits → `.update()`;
   deletes → targeted `.remove()` on the sanitized key. Collection `.set()` was
   the catastrophic full-history-wipe bug.
3. **The entries listener is read-only** — never writes, never clears the queue.
4. **Queue clears only on confirmed server write**, by exact id, per-entry.
5. **Firebase keys** cannot contain `. # $ [ ] /` — sanitize IDs with
   `.replace(/[\s.#$\[\]/]/g,"_")`.
6. **Date format:** always `YYYY-MM-DD` internally — `normDate()` converts all
   formats. `today()` uses local-time offset arithmetic minus `DAY_ROLLOVER_MIN`,
   never `toISOString()` (UTC), to avoid the early-morning misdating bug.
7. **Version bump:** increment `APP_VERSION` AND the SW cache string on **every**
   build — no exceptions. Stale SW cache hides UI changes from users.
8. **`addEntry` always overwrites the passed ID** with a fresh `genId()`.
   Duplicating entries uses `addEntryDirect`, which preserves the entry as-is.
9. **Read before edit; verify before build** — read the exact current source,
   then run a real Babel/JSX compile check (not just grep) before shipping.

## Date Formats Handled
| Input | Example | Converts to |
|---|---|---|
| YYYY-MM-DD | 2026-03-01 | passthrough ✓ |
| DD-MM-YY | 08-02-26 | 2026-02-08 |
| DD-MM-YYYY | 08-02-2026 | 2026-02-08 |
| DD Mon YYYY | 1 Mar 2026 | 2026-03-01 |

## Feature List
- **Home:** Entry forms with config-note auto-fill, Today's Log with icons
- **Manage:** ◀ date ▶ navigation + calendar picker, inline edit/delete, entry
  count, duplicate (📋) flow. Defaults to today's date.
- **Reports:** View (daily summary) + Compare (multi-date) + Trends (Chart.js)
- **Trends:** Sugar/Weight/BP, 6 ranges, 3 agg modes (avg/first/last)
- **Settings:** Theme, 🌙 Day Rollover, 🛟 Data Safety (Restore), config tabs
  (Food/Drinks/Exercise/Medical/Meds), A→Z sort + manual reorder, Apply▶,
  Backup (CSV import/export, clear/reset)
- **Icons:** pickIcon(), ICON_MAP, EmojiPicker with search, IconBtn
- **Import/Export:** CSV, multi-format date parsing, Firebase `.update()` for
  imports; import also refreshes the local mirror
- **Themes:** Light/Dark/System with full token set
- **Offline-first:** see dedicated section above

## Version History (key milestones)
| Version | Key Change |
|---|---|
| v4.19 c28 | Last pre-icon baseline — all core features working |
| v4.36 c52 | Fixed missing `value=` on icon-decorated options |
| v4.38 c54 | Import pipeline fixed (water/drinks→liquid, Detail1\|\|T fallback) |
| v4.51 c67 | Firebase key sanitization (dots in IDs broke imports) |
| v4.52–4.54 | Date parser (DD-MM-YY/DD-MM-YYYY), normDate on load, export YYYY-MM-DD |
| v4.60 c76 | Offline queue (localStorage), sync status icons, duplicate-entry, Manage defaults to today |
| v4.61 c77 | Fixed 3 regressions: UTC misdating (`today()`), offline entries lost on refresh (optimistic-echo queue clear), offline sign-in hang (timeouts) |
| v4.62 c78 | Configurable Day Rollover (Settings → General), `dayRolloverMin`, localStorage-cached for offline boot |
| v4.63 c79 | (Built, superseded by v4.64 before deploy.) `.set()`→`.update()` on adds; `.remove()` for deletes; cache-before-write in addEntry/persistEntries |
| v4.64 c80 | **Offline-first rebuild.** Full local mirror (all history) as source of truth; read-only entries listener; queue clears only on confirmed per-entry server write (fixes the lift/optimistic-echo data loss); anti-wipe guard against empty/glitched snapshots; daily backups (local + separate backend node) overwritten daily; ♻️ Restore button; **offline login** via cached identity with "📵 Offline mode" banner; all collection-level `.set()` on /entries eliminated |

> **Version-history maintenance:** GitHub commit history is the canonical record.
> This table is a quick-glance summary; descriptive commit messages suffice.

## Build & Verify Process (in-chat)
1. Read the actual current source (fetch live from
   `raw.githubusercontent.com/git-kummah/jivanlog/main/index.html`).
2. Make surgical edits with file tools.
3. **Verify with a real Babel/JSX compile** (extract `<script type="text/babel">`
   block, run `@babel/core` + `@babel/preset-react` transform), plus
   brace/bracket balance and a leftover-bug scan (no collection `.set()`, no
   stray `clearOfflineQ`). Grep alone is insufficient.
4. Bump `APP_VERSION` AND the SW cache string.
5. Deliver `index.html` + `sw.js` as files; summarize what changed and why.
6. Update this doc's version reference + history when a build ships.

## Deployment Flow
Edit in chat → Mahesh uploads `index.html`/`sw.js`/`manifest.json`/icon to the
GitHub repo via the website (directly into `main`) → `Run-Backup.bat` runs
`JivanLog-Backup.ps1`, pulls live files from `raw.githubusercontent.com`, and
snapshots a versioned backup under `D:\OneDrive\JIvanLog\backups\vX.XX_cNN\`.
GitHub Pages serves from `main` (no staging branch). `D:\OneDrive\JIvanLog` is
NOT a git clone — confirm folder location at session start.

## Working Style & Patterns
- **In-chat development only** — no external Claude Code/VS Code step.
- **Surgical, targeted edits** over broad rewrites (v4.64 was a deliberate
  exception: a coordinated multi-path rebuild to close a data-loss class).
- **Strict version discipline:** unique `APP_VERSION` + cache string per build.
- **Data integrity and visual feedback are deliberate UX priorities**, not
  polish — sync indicators and backups exist because data loss is unacceptable.
- Communication: direct and suggestion-oriented; treat Mahesh's real-world
  testing results as ground truth about current app state.

## Pending / Open Items
1. **Multi-device conflict resolution** for simultaneous edits of the *same*
   entry — still out of scope. Current model is last-write-wins via `.update()`
   keyed by id. Low-risk given single-user usage; revisit if it becomes real.
2. **App Check enforcement check** (Firebase Console → App Check →
   Authentication): confirm/rule out whether enforcement forces a network
   round-trip on local session restore. v4.64 makes offline login work
   regardless; disabling enforcement would also let the *real* Firebase session
   restore cleanly offline.
3. **Recovery of the 26 Jun 2026 loss:** the missing entries (lunch, evening
   tea, BP/HR/coffee/sugar readings) were never persisted to Firebase or
   localStorage, so they can't be auto-recovered — re-enter manually. The v4.64
   daily backup + mirror prevent a recurrence and make one-tap restore possible
   going forward.

## Files in This Knowledge Base
| File | Description |
|---|---|
| index.html | Current production source (**v4.64/c80**) — replace whenever a newer build ships; keep only the current build |
| sw.js | Current service worker (cache **jivanlog-v80**) |
| manifest.json | PWA manifest |
| sugar_diary_import.csv | Historical diary data (Jan–Mar 2026, 1324 rows) |
| jivanlog-config-2026-03-05.csv | App config snapshot |
| jivanlog-manual-v2.docx | User manual (v2, describes v4.19 — predates offline-first work) |
| jivanlog-security-guide.docx | Firebase security guide (note: the two-branch main/gh-pages split it describes was never implemented; Pages serves from main) |
