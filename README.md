# ULM Offensive Intelligence — Grantham historical sample fix

## What changed

- Main team analytics no longer use 2025 UAB defense as the historical sample.
- `2025 Grantham · OK State` uses the exact 292-play `play_feed-94.csv` sample from Todd Grantham's 2025 Oklahoma State defense.
- `2026 UAB` uses only 2026 rows from the existing live UAB play feed (`play_feed (18).csv` / fallback names already used by the app).
- `50 / 50 Scheme + Current` uses the existing true season-balanced math: 50% influence from Grantham/Oklahoma State 2025 and 50% from UAB 2026. No plays are replicated.
- Player Intelligence remains UAB-specific. Its 2025/2026 player history continues to use the original UAB play feed and UAB player PFF tables, not Oklahoma State defenders.
- Missed-tackle player context and player coverage structure also remain isolated to UAB player data.

## Source audit

### `play_feed-94.csv`

292 rows, all 2025 Oklahoma State defense:

- UT Martin: 60
- Oregon: 68
- Tulsa: 80
- Baylor: 84

The older UAB/Oklahoma State Grantham scheme workspace contained the exact same 292 PFF play IDs.

### `ALL_COMBINED.csv`

338 manual chart rows:

- Oklahoma State vs UT Martin: 60
- Oklahoma State at Oregon: 69
- Oklahoma State vs Tulsa: 80
- Oklahoma State vs Baylor: 84
- UAB at Illinois: 45

292 Oklahoma State rows match `play_feed-94.csv` one-for-one by game + drive + drive-play. The only unmatched Oklahoma State manual row is:

- `2502 Oklahoma State D @ Oregon, Play 016`
- no Drive # / Drive Play #

That orphan manual row is intentionally **not** added to the PFF analytics sample, so the historical analytics remain the exact 292 PFF plays.

## Deployment

Replace the current app's `index.html` with the `index.html` in this ZIP and redeploy.

No Supabase upload is required for `play_feed-94.csv`; the exact 292-play Grantham sample is embedded in the HTML so the historical sample cannot silently change or disappear.

The app still expects the existing UAB live folder and current `play_feed (18).csv` for 2026 UAB data, roster, depth chart and player tables.
