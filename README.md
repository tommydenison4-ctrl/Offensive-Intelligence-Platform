# ULM Offensive Intelligence v22 — Blitz Layout Repair

This fixes the v21 visual failure.

The issue:
Blitz Intelligence was inserted as a single grid item inside the Pressure 12-column layout, so the browser squeezed the entire report into one narrow column.

Fixed:
- Blitz Intelligence spans the full Pressure page width
- origin cards use the full available width
- player and combination tables use normal two-column layout
- exact-player combination table spans full width
- responsive tables scroll horizontally instead of collapsing
- headline KPIs added for pass blitz calls, pressure plays, pressure rate and sacks
- origin counts explicitly labeled as rusher participations because multiple rushers can appear on one play

No Supabase changes required.


Version v23_BLITZ_ALIGNMENT
- Replaces the word-only blitz prototype with a full defensive alignment field.
- Keeps the front on the field for context and highlights the actual extra rush origins from filtered BLITZDOG plays.
- Adds alignment-based blitz origin table, player table, and combo tables.


## v29 Hash Intelligence
Added a dedicated Hash Intelligence page comparing Left / Middle / Right hash.

Includes raw counts, within-hash percentages, YPP and median YPP for: overall performance, run/pass, front, box count, personnel, coverage, shell, man/zone, pressure state, rush count, run concept, A/B/C/D point of attack, target depth, target direction, target relation to hash, target position, route/pattern, formation group/name, motion/shift, RB alignment, TE alignment, down, distance and field zone.

Page filters: Run/Pass, Down, Distance, Field Zone and Personnel.


## v30 Player Profiles
Player Intelligence drawers now include:
- Overview with Top 3 Games preview
- Top 3 Games tab
- Game Log tab
- Deployment tab
- Coach Notes
- Season skill profile from player_intelligence.csv

Top-game ranking uses explicit play-feed defender events and is position-weighted. It is not represented as a PFF per-game grade.


## v31 Hash Filters Only
Removed the standalone Hash Intelligence page.

Hash filtering is now built into the existing analytics reports:
- Dashboard
- Personnel & Fronts
- Run Defense
- Pass Defense
- Coverage
- Pressure
- Situations
- Field Heat Maps
- Structure Response

Each report recalculates its existing metrics/tables/visuals from All Hashes, Left Hash, Middle, or Right Hash.


## v32 Football Reports
- Removed the visible custom player impact score.
- Added Missed Tackle Report to Player Intelligence.
- Added comprehensive Formation Performance to Structure Response.
- Added Route Defense to Pass Defense using PFF ROUTE_THROWN, route group and target position.
- Existing hash filters recalculate Formation and Route reports.


## v33 Missed Tackles Page
Moved Missed Tackle Report out of Player Intelligence.

Standalone left-nav page:
- team missed-tackle summary
- defender-by-defender MT table
- run/pass MT split
- explosive plays on MT
- YPP / median on MT plays

Player Intelligence is clean again.


## v34 Leaders Tab
Moved all leaderboards out of Player Intelligence.

New standalone Leaders page:
- Pass-Rush Leaders
- Tackle Leaders
- Coverage Leaders
- small player headshots
- clickable rows that open the full player profile

Player Intelligence now contains only roster/profile content.


## v35 ULM Formations
- Formation Performance moved into its own Formations tab.
- Uses the taught 20-name PFF→ULM formation translation map.
- ULM name is primary; raw PFF name is secondary reference only.
- Unmapped PFF formations remain unchanged rather than guessed.
- Filters: ULM Formation, Personnel, Motion, Down, Field Zone, Hash.


## v36 Historical Player Identity Fix
Fixed cross-season jersey-number collisions.

Historical stats now follow this rule:
1. Current roster player name must directly match a name in the 2025 historical player dataset.
2. Only after that match is verified may the historical jersey number be used to find that player's play-feed events.
3. A current player with no verified 2025 name match gets no historical stats, no Top 3 Games, and no Game Log.
4. Leaders and Missed Tackles exclude unverified current-roster identities.

This prevents a 2026 player from inheriting a different 2025 player's statistics simply because they share a number.


## v37 Structure Trim + Weighted Heat Map
Structure Response:
- removed everything below the user's marked line
- removed Back Location
- removed TE Surface
- removed Formation × Front × Coverage × Box
- kept Structure Family and Motion Response
- made kept tables full-width to prevent clipping

Field Heat Maps:
- heat color now reflects the selected performance metric, not target volume
- Heat Weight selector: YPP / Completion % / Explosive %
- higher metric value = stronger maroon shading
- every populated zone still shows target context
- TD and INT are listed inside each populated zone
- lower report tables receive wider scroll-safe table sizing


## v38 QB Run + Field Zone Field
- Field Zone Strip replaced with a full-field visual scaled to report yard-line ranges.
- Situations hash filter remains active.
- Pass Defense Route Defense now keeps only the full-width By Route report.
- By Route Group removed.
- By Target Position removed.
- Added standalone QB Run Success tab.
- QB Run Success splits explicit Designed Runs from explicit Scrambles.
- QB Run page includes Run Type and Hash filters.


## v39 QB Run + P & 10
- Corrected designed QB run identification: RUNPASS=R and BALLCARRIER=QB.
- 60 designed QB runs in the bundled feed.
- 45 explicit scrambles.
- Designed Run Concept report uses designed runs only.
- P & 10 is the first offensive play of a drive/possession, 1st-and-10.
- 161 P & 10 plays in the bundled feed.
- Added P & 10 to Down/Distance report rows.
- Added shared Down & Distance filter, including P & 10, across major analytics pages.


## v40 field + coverage layout
- Restyled the Situations field-zone visual to read more like an actual football field.
- Added turf striping, yard lines, yard numbers and maroon end zones with subtle ULM branding.
- Moved Coverage filters down into a dedicated filter panel placed directly above the Target Location field so they sit closer to the main visual.


## v41 Print Position Filters
Fixed the blank Player Profile Pack picker.

Cause:
- print picker was still grouping players as QB/RB/WR/TE/OL from the earlier defensive-app template.

Now:
- All Defense / DL / LB / DB print filters
- defensive players populate correctly
- Select Visible Position selects the currently filtered position group
- Select All Defense selects all defensive roster players
- search works inside the selected position


## v42 clean coach/player UI
- removed Historical identity notice
- removed Player Intelligence explanatory subtitle
- removed extra Shared Source / Advantage Data KPI boxes
- removed roster/source instruction card
- trimmed print modal helper copy
- removed leader-page instructional note
