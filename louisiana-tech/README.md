# Louisiana Tech · Week 7

October 17, 2026, from the existing Command Center schedule.

Depth chart: Ourlads posting updated 10/10/2026 9:08 AM ET. `depth-chart.json` is a local snapshot, not a PFF dataset or full official roster.

`upload-manifest.json` specifies proposed public Supabase Storage paths and filenames for the next upload. No folders, tables, files or permissions were created in Supabase. Edit storageBase and files to match the actual uploads; file values can be strings or arrays of candidate names. Reload checks this manifest and then each dataset independently. Missing files stay pending; prior opponents are never used as fallbacks. Play feeds must identify LATU in the appropriate offense/defense field and the 2026 season. The existing project uses LATU in its PFF feeds.

Expected uploads:

- plays: `play_feed.csv`
- internalLanguage: `ALL_GAMES_COMBINED.csv`
- playerIntel: `player_intelligence.csv`
- playerRush: `pff-pass-rush.csv`
- playerRun: `pff-run-defense.csv`
- playerCoverage: `pff-player-coverage.csv`
- tackling: `pff-tackling.csv`
- coverageDistribution: `pff-coverage-distribution.csv`
- runConcepts: `pff-run-concepts.csv`
- coverage: `pff-coverage.csv`
- pressure: `pff-pressure.csv`
- personnel: `pff-personnel.csv`
- fronts: `pff-fronts.csv`
- Roster: `roster.json` (array or {players: [...]})
