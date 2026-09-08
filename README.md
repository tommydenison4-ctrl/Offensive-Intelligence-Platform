ULM Offensive Intelligence — Grantham Fix v3

Changes in v3:
- 2026 UAB Player Intelligence now calculates coverage targets from PFF pff_PASSCOVERAGE1 on targeted pass plays.
- Completions allowed, completion percentage, yards allowed and TD allowed are calculated from those target rows.
- Pass breakups remain sourced from pff_PASSBREAKUP and interceptions from pff_INTERCEPTION.
- DB and LB cards now expose coverage involvement (targets/completions/PBU/INT) instead of hiding it.
- Player overview panels show the expanded coverage stat line.
- Coverage leaderboards now follow the selected Player Intelligence season instead of always using the historical summary.
- Game logs now include targets, completions, yards allowed and TD allowed.
- The Grantham 2025 Oklahoma State scheme fix from prior builds is retained.

Deployment:
Replace the live repo index.html with this index.html. The source_audit folder is documentation only and is not required for the app to run.
