# JivanLog — Confirmatory Audit — Rev 2
**Audited version:** v5.29 (cache jivanlog-v128), live at git-kummah/jivanlog
**Rev 1 date:** 28 August 2026 — produced without access to the original `jivanlog-audit-v4.69.md`; several items marked unverifiable.
**Rev 2 date:** 29 August 2026 — the original audit document was re-added to the project. Every item previously marked unverifiable was re-checked against its exact original wording, and one Rev 1 mislabeling was corrected.
**Method (unchanged from Rev 1):** every item checked against the actual live compiled source, fetched fresh from GitHub — not from memory. Rules findings (R1–R5) verified against the live Firebase rules text pasted in this conversation, not re-fetched (rules aren't publicly readable via URL).

## Changelog: Rev 1 → Rev 2

**Correction:**
- **S9 was mislabeled in Rev 1.** I had attached "S9" to the CSP long-poll transport fix (the multi-day stuck-sync saga). The actual original S9 finding was **"No Content-Security-Policy at all — add a meta CSP tag."** That's a different, earlier, simpler finding. It is separately confirmed fixed (a real CSP meta tag exists, with extensive content). The long-poll fix and the App Check removal remain accurately described in Rev 1's Security Impact section — only the S9 *label* was wrong, not the underlying analysis.

**Newly verified — CONFIRMED FIXED** (previously marked unverifiable, now checked against exact original text):
C5, C7, S6, S7, S9 (corrected), S10, S11, O9 (every named sub-item individually), E9, E13, E14.

**Newly verified — CONFIRMED STILL OPEN** (previously marked unverifiable, now checked against exact original text; genuine gaps, not previously known):
**O8**, **E7 (second half — weekly summary)**, **E10 (partial)**, **E11 (partial)**, **E12 (partial)**, **C3**.

**Unchanged from Rev 1:** everything else — including **B8** and **S3**, both still open exactly as originally reported.

Rows below are marked **[REV2-NEW]** where the finding text or status is new in this revision, **[REV2-CORRECTED]** for the S9 relabeling, and unmarked where Rev 1's row stands as originally written.

---

## Summary Table (Rev 2 — supersedes Rev 1's table)

| # | Category | Finding / Enhancement / Additional | Fix Implemented | My View |
|---|---|---|---|---|
| B1–B7, B9, B10 | Defect | *(unchanged from Rev 1 — all confirmed fixed; see Rev 1 detail, reproduced in full below)* | | |
| B8 | Defect (Medium) | Silent save failures across all five forms — tapping Save with a required field empty does nothing | **Not implemented.** | **Still open, confirmed unchanged.** |
| O1–O7 | Optimization | *(unchanged from Rev 1 — all confirmed fixed)* | | |
| O8 | Optimization (Low) | **[REV2-NEW]** Google Fonts loaded via `@import` inside a React-rendered `<style>` — blocks rendering, costs a round trip, isn't in the SW cache so offline typography silently falls back to system-ui | **Not implemented.** `@import url('...fonts.googleapis.com...')` still sits inside a rendered `<style>` block; font URL absent from the SW asset list | **Confirmed still open, both halves of the original finding.** |
| O9 | Optimization (Low) | Dead code: `saveEntries`/`persistEntries`, `deliberateClearRef`, `clearOfflineQ`, `WATER_TYPES`/`WTYP` duplication, `d30`, `nk`, `clearAll` prop, `HomePage`'s unused `isOnline` prop, `window._jivanUid` | **[REV2-NEW]** Every single named item checked individually — **all confirmed removed or fixed.** `window._jivanUid`'s fix is explicitly labeled "O9" in its own comment. | **Confirmed fixed, thoroughly** — checked each named sub-item rather than trusting a single grep. |
| C1–C2, C4, C6 | Compliance | *(unchanged from Rev 1 — all confirmed fixed)* | | |
| C3 | Compliance | **[REV2-NEW]** User manual materially out of date (§3.4 "deletion permanent" false, undocumented Trends/rollover/admin-gate/offline-queue/duplicate-entry, backup format claim wrong) | **Not implemented.** Manual is still the v2/v4.19 (March 2026) document; app is now v5.29 — roughly 10 major versions and dozens of features further on | **Confirmed still open.** This is a documentation task, not a code fix — flagged separately in the fix plan below. |
| C5 | Compliance | **[REV2-NEW]** Same entry renders differently in different places — `ManageRow`'s medical branch dropped its icon; `EditEntry`'s exercise select had none while every other select did | **Fixed.** Both now call `pickIcon(...)` consistently | **Confirmed fixed**, checked both specific call sites named in the original finding. |
| C7 | Compliance | **[REV2-NEW]** Emoji-only nav buttons unlabelled on touch (zero `aria-label`s) | **Fixed.** All 4 main nav buttons plus the account button carry explicit `aria-label`; a bonus `aria-current="page"` was added too | **Confirmed fixed, and exceeds the ask.** |
| S1–S3, S8 | Security | *(unchanged from Rev 1 — S1/S2/S8 fixed, S3 still open)* | | |
| S3 | Security (process) | Rules not version-controlled — no diff, no rollback | **Not implemented** — live 404 confirmed again this revision | **Still open, confirmed unchanged.** |
| S6 | Security (Medium) | **[REV2-NEW]** "Lock session" was React state only — a refresh cleared it, and it was never more than a curtain | **Fixed, and exceeds the ask.** A genuine 4-digit PIN (setup/confirm/unlock modes) was built, plus the lock state persists across refresh via a localStorage flag | **Confirmed fixed** — the stronger of the two options the original finding offered. |
| S7 | Security (Medium) | **[REV2-NEW]** Sign-out left all health data on the device (mirror, queue, backups, caches) | **Fixed.** `signOutAndWipe()` exists, explicitly labeled "S7" in its own comment, with a clear confirm dialog describing exactly what it removes | **Confirmed fixed**, and the confirm-dialog wording is appropriately specific about what's being wiped. |
| S9 | Security (Low) | **[REV2-CORRECTED]** No Content-Security-Policy at all — a meta CSP restricting `script-src` would meaningfully limit an injected script | **Fixed.** A substantial CSP meta tag exists | **Confirmed fixed.** *(This is the corrected finding — see changelog. The long-poll/App Check work from Rev 1 remains separately accurate, just not under this ID.)* |
| S10 | Security (Info) | **[REV2-NEW]** XSS surface was clean — zero `dangerouslySetInnerHTML` | **Still holds** — zero occurrences, no regression | **Confirmed, no change needed then or now.** |
| S11 | Security (Info) | **[REV2-NEW]** Leftover `console.log("Import persisted:", …)` | **Fixed, and exceeded** — that specific line is gone, and in fact **zero** `console.log` calls exist anywhere in the app now (only appropriate `console.warn` for genuine storage/error reporting remains) | **Confirmed fixed, more thoroughly than asked.** |
| E1–E6, E8 | Enhancement | *(unchanged from Rev 1 — all confirmed fixed)* | | |
| E7 | Enhancement (Medium) | Out-of-range highlighting for Sugar/BP, **plus a weekly summary** | **Partially fixed.** Highlighting exists (confirmed Rev 1). **[REV2-NEW]** No weekly summary of any kind found | **Genuinely partial** — Rev 1 marked this fully done without checking the second half; corrected here. |
| E9 | Enhancement (Low) | **[REV2-NEW]** Auto-backup was daily and produced two files (CSV + JSON) — "730 files a year in Downloads is noise" | **Fixed, both halves.** Now gated to once every 7 days (`daysSince < 7`), and only a single `.json` file is produced | **Confirmed fixed.** |
| E10 | Enhancement — UI (Low) | **[REV2-NEW]** Base font size too small across much of the UI (0.62–0.72rem observed); 0.8rem should be the floor | **Partially fixed.** Many areas now sit at 0.8rem+, but **0.72rem remains the single most common font size in the app** (69 occurrences) | **Genuinely partial** — real improvement, but the stated floor isn't consistently held. |
| E11 | Enhancement — UI (Low) | **[REV2-NEW]** Tap targets (▲▼ reorder, `.ibtn` icons) were ~24px against a 44px accepted minimum | **Partially fixed.** `.ibtn` now specifies `min-width/height: 36px` — a real improvement (50% larger) — but still short of the 44px standard named in the finding | **Genuinely partial.** |
| E12 | Enhancement — UI (Low) | **[REV2-NEW]** No `aria-label` on emoji buttons (see C7, since fixed); no `inputMode="decimal"` / `min="0"` on numeric fields | **Partially fixed.** `inputMode="decimal"` now appears 6 times (up from 1). `min="0"` has **zero** occurrences anywhere | **Genuinely partial** — one half done, the other untouched. |
| E13 | Enhancement — UI (Low) | **[REV2-NEW]** `theme-color` meta tag was static dark regardless of theme | **Fixed**, explicitly labeled "E13" in its own comment — updates dynamically to match the active theme | **Confirmed fixed.** |
| E14 | Enhancement — UI (Low) | **[REV2-NEW]** Manifest was SVG-icon-only, unreliable for install prompts on some Android versions; needed PNG 192/512 plus `scope`/`id` | **Fixed, completely.** Manifest now has both PNG sizes plus SVG, `"scope": "./"`, and `"id": "./index.html"` | **Confirmed fixed**, exactly matching every element the finding named. |
| E15 | Enhancement — UI (Low) | **[REV2-NEW]** 23 `alert()` and 17 `confirm()` calls; replace non-destructive `alert()`s with toasts, keep hard confirms for destructive actions | **Fixed, with one deliberate, documented exception.** 22 of 23 `alert()`s replaced; the one remaining is explicitly commented ("isn't worth the plumbing. Left as `alert()`") for a single download-failure edge case. `confirm()` count grew to 25, appropriately — new destructive actions (device wipe, rename cascade, template deletion) were added since the original audit and correctly got their own confirms | **Confirmed substantially fixed**, with a reasonable, explicitly-justified exception rather than an oversight. |
| E16 | Enhancement — UI (Low) | **[REV2-NEW]** No sticky date header on Today's Log once the day's list gets long | **Fixed.** `position: "sticky", top: 0` confirmed on the header sitting directly above Today's Log | **Confirmed fixed.** |
| N1a–N8 | Additional | *(unchanged from Rev 1 — all confirmed fixed)* | | |
| R1–R5 | Rules | *(unchanged from Rev 1 — all confirmed, R4/R5 not independently re-verified this session, reported done)* | | |
| RM items | Deferred by design | *(unchanged from Rev 1 — correctly deferred, not gaps)* | | |

**For the full text of every unmarked row** (B1–B7/B9/B10, O1–O7, C1/C2/C4/C6, S1/S2/S8, E1–E6/E8, N1a–N8, R1–R5, RM), see Rev 1, reproduced in full below for a single-document reference. Nothing in those rows changed in Rev 2.

---

## Updated Open-Items List (Rev 2 — this supersedes Rev 1's implicit "just B8 and S3")

| ID | Gap | Size | Notes |
|---|---|---|---|
| B8 | Silent save failures on missing fields | Small | `showToast()` already exists app-wide |
| S3 | Rules never committed to repo | Small | Have the rules text from this session; just needs packaging + your upload |
| O8 | Fonts still `@import` in render, not cached | Small–Medium | |
| E7 | No weekly summary (highlighting-only) | Medium | Genuinely new UI, not a tweak |
| E10 | Font floor not consistently applied | Medium | Touches many style blocks across the app |
| E11 | Tap targets short of 44px (currently 36px) | Small | |
| E12 | No `min="0"` on numeric fields | Small | |
| C3 | Manual ~10 versions out of date | Large | Documentation, not code — separate workstream |

---

## Full Rev 1 Text (unchanged rows, reproduced for reference)


---

## Rev 2 Addendum — Detail on Newly-Verified Items

### Corrections

**S9 relabeling.** Rev 1 attached "S9" to the CSP long-poll fix — that was my own error, made while working without the original document. The real S9 is a simpler, earlier finding ("add a CSP at all"), separately and correctly confirmed fixed. The substantive analysis of the long-poll bug and the App Check removal in Rev 1's Security Impact Assessment doesn't change — only the ID attached to it was wrong.

### Newly confirmed fixed

**C5, C7** (icon consistency, nav accessibility) and **S6, S7** (lock screen, sign-out wipe) are all confirmed fixed to a high standard — S6 in particular exceeds what was asked, building an actual PIN rather than just persisting a flag. **S10/S11** hold clean, with S11 exceeded (all debug logging removed, not just the one flagged line). **O9**'s entire dead-code list was checked item-by-item rather than trusted from a single grep — every named symptom (`saveEntries`, `deliberateClearRef`, `clearOfflineQ`, the `WATER_TYPES`/`WTYP` duplication, `d30`, the stale `nk`, the `clearAll` prop, `HomePage`'s unused `isOnline` prop, and `window._jivanUid`) is genuinely gone or fixed. **E9, E13, E14** are all confirmed fixed exactly as specified.

### Newly confirmed still open

**O8** (Google Fonts loading strategy) is untouched — still an `@import` inside a rendered `<style>` tag, still absent from the service worker's cache, so the original bug (render-blocking, no offline font caching) stands exactly as described.

**E7** was marked "confirmed" in Rev 1 on the strength of the out-of-range highlighting alone — I didn't check the second half of that same finding ("plus a weekly summary") at the time, which was an oversight in Rev 1's own rigor. No weekly summary of any kind exists. Corrected here.

**E10, E11, E12** are all genuinely partial. Each shows real, measurable improvement — font sizes did move up in many places, tap targets did grow from ~24px to 36px, `inputMode="decimal"` was added in six places — but none fully reaches the bar the original finding named (0.8rem floor, 44px minimum, and `min="0"` respectively). These read as "addressed, not finished" rather than either "done" or "ignored."

**C3** (manual staleness) is unambiguous: the manual is still the v2/v4.19 document from March 2026, and the app has moved through roughly ten major versions and dozens of features since. This is a documentation task, not a code defect, and is treated separately in the fix plan below.


---

## Detailed Report

### 1. Original findings vs. fixes — intent vs. reality

The defect list (B1–B10) is the area I could verify most rigorously, since almost every fix carries an explicit code comment naming the finding ID and describing the original bug in the fixer's own words — not just my inference. **9 of 10 are genuinely, correctly fixed.** The one exception, **B8** (silent save failures on missing required fields), is still exactly the original bug: every entry form's `save()` function does a bare `if (!requiredField) return;` with no toast, no highlight, nothing. This one is worth flagging as a near-term priority less because it's important and more because it's *cheap* — the app already has a working `showToast()` mechanism used everywhere else; wiring it into five `save()` functions is a small, low-risk fix that's been sitting open since the original audit.

The optimization list (O1–O7) is uniformly strong, and **O5/O6 in particular exceeded what was asked.** The roadmap flagged the mirror rework as needing XHigh effort specifically because it touches the app's core durability guarantees — the same guarantees that exist *because* of the original catastrophic data-loss incident. What's actually live is a genuine IndexedDB migration with upsert-only semantics, not a localStorage patch — and the upsert-only design is *why* O6 (tombstone-dropping) is also resolved, since nothing is ever wholesale-rewritten anymore. This is the kind of fix that's easy to describe as "done" without actually being structurally sound, and I specifically checked that the caching (`reportCache` for O2, `_iconCache` for O4) is genuinely read from rather than a declared-but-unused variable — given this exact project's history with C4 (a "natural key" that was computed but never wired up), that specific failure mode felt worth checking for deliberately rather than assuming good faith.

I could not verify O8, O9, C5, or C7 — I don't have the original wording for these and didn't want to guess. If you still have the original audit document saved somewhere, it'd be worth re-adding to this project's files so a future audit doesn't hit the same wall.

### 2. Enhancements — intent vs. reality

E1–E7 are all confirmed implemented, matching their described intent closely. Two are worth calling out specifically:

- **E2** (connectivity status) shipped a *more* granular model than asked — 5 states instead of 3 — which is a reasonable interpretation given how much of this project's history has been about connectivity being genuinely hard to characterize accurately.
- **E7** (out-of-range highlighting for Sugar/BP) is explicitly documented in its own comment as "a rough visual cue," not a clinical threshold claim. For a personal health-tracking app, I think that's the right level of epistemic caution to build in — a highlight that looked more authoritative than a simple range check actually is would be a subtle but real problem in a health context.

E9–E16 remain unverifiable against the original spec text. I spot-checked adjacent territory (accessibility attributes, font sizing) and found *some* presence of both, but without the original bar to measure against, I can't respons­ibly call these done or not-done.

### 3. Additional fixes and enhancements — intent vs. reality

The N1–N8 roadmap items are the most thoroughly and consistently documented set in the whole codebase — every single one has an explicit, often multi-line comment naming the item and explaining its reasoning, not just its mechanics. **All 8 are confirmed implemented**, and N7 in particular I verified at the data level, not just the comment level: the specific items the roadmap named as missing from the old factory defaults (Heart Rate, LogJam, Cilnep/Nexovas, Morning Drink) are genuinely present in the live `FD` table today.

Beyond the original roadmap, this session's own work — the entries-listener stall recovery, the connectivity-gate removal, the CSP root-cause fix, the Babel pre-compilation, the App Check removal, C4, and the v5.29 layout reorder — is work I have the highest confidence in, since I tested each one directly at the time rather than relying on a comment written by a prior session. All are confirmed working as intended, with the CSP fix in particular now having your own real-world usage as evidence it's holding.

### 4. Security Impact Assessment

This is the part of the audit that deserves the most careful reasoning rather than a quick "looks fine" pass, so I've gone through every change from this session individually rather than treating them as a group.

**App Check removal (S9) — the highest-stakes change, and the one I want to be most precise about.** App Check's actual job was verifying a request came from a real browser running the real app — not verifying identity (that's `auth.uid === $uid`'s job) and not authorizing specific data shapes (that's `.validate`'s job). The one place that distinction mattered was `pendingRequests/$uid`, where *any* signed-in Google account — not just approved users — could write, and nothing but App Check stood in front of that. That gap is now closed at the rules level (verified against your live rules text earlier this session): the write must include an email matching the caller's own token, every field is capped, and `$other: false` rejects anything not explicitly listed. Every *other* write path in the app was already governed by `auth.uid === $uid`, which App Check was never protecting in the first place — a user can always write garbage to their own data via the real app regardless of App Check. So the specific risk App Check covered is genuinely closed, not just believed to be closed.

What's honest to say plainly: this does remove one layer of defense-in-depth. Before, an attacker needed a valid reCAPTCHA token *and* to satisfy the rules; now they only need to satisfy the rules. The rules are solid, but "one solid layer" isn't the same claim as "two layers." That's the trade you made — consciously, after discussion — in exchange for removing a third-party dependency that had already caused one full outage by sitting in front of every database operation. I think it's a good trade for a single-user app; I don't think it's a *free* one, and I want the record to reflect that distinction accurately rather than round it up to "no impact."

**CSP changes.** Three categories:
- **Genuine reductions in attack surface:** `'unsafe-eval'` removed (no code path compiles or evaluates at runtime anymore since the Babel pre-compile), and `www.google.com`/`recaptcha.google.com` removed (App Check's script surface, gone with App Check itself).
- **A necessary widening:** `script-src` now includes `*.firebasedatabase.app` and `*.firebaseio.com`, required for Firebase's long-poll fallback transport to function at all. I consider the incremental risk here low — these are Firebase's own infrastructure domains, not user- or third-party-controlled — but it is technically a widening, and I want that stated rather than glossed over.
- **A pre-existing, unchanged weakness:** `'unsafe-inline'` remains in both `script-src` and `style-src`. This significantly limits how much XSS protection this CSP actually provides in practice — but it predates every change made this session and appears to stem from the single-file architecture itself (inline styles and handlers are pervasive throughout). Not a regression from anything audited here, but worth naming as a standing limitation rather than letting the CSP's presence imply more protection than it currently delivers.

**Connectivity-gate removal (v5.24) and entries-listener re-attach logic.** Both are security-neutral. The gate removal changes *when* a write is attempted client-side, never *whether* it's authorized — Firebase's server-side rules enforce authorization identically regardless of what the client believes about its own connectivity. The listener re-attach logic only affects the read path's reliability, governed by the same unchanged `auth.uid === $uid` read rules.

**C4 (CSV dedup) and the v5.29 layout reorder.** Both security-neutral — pure client-side logic and pure visual changes respectively, with no new data exposure, no new write path, and no change to what's sent to or read from Firebase.

**S3 (rules never committed to the repo) — a process gap worth its own line.** This isn't a flaw in the rules themselves (I directly verified R1 and R3 against live rules text this session, and they're sound). It's that there's no version-controlled, diffable copy of them anywhere outside the Firebase Console. A future accidental change made directly in the Console — a typo, a well-intentioned tweak that doesn't get tested — would have no history and no easy way to confirm what changed or roll it back. This is cheap to fix and meaningfully reduces the risk of an undetected future misconfiguration; I'd treat it as a real, if quiet, security-process gap.

**One opportunistic finding, not a vulnerability:** the `admins/$uid` write rule blocks *everyone*, including the superadmin, from writing their own admin record — this is the source of the recurring harmless `permission_denied` warning seen in the console throughout this session. It's over-restrictive, not under-restrictive, so it's not a security issue — just a known, low-priority correctness item, already mentioned earlier this session.

**Net assessment:** Nothing audited this session introduced a genuine new vulnerability. The one change with a real, honest trade-off (App Check removal) was a discussed, deliberate decision with its specific covered risk verified closed at the rules level — not an oversight. The one standing weakness worth taking seriously (`'unsafe-inline'` in the CSP) predates this session entirely and reflects the architecture's shape rather than a recent decision. The one process gap worth closing (S3) is cheap and independent of everything else here.
