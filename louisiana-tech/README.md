# Louisiana Tech · Week 7

This opponent entry reads the weekly public Supabase files from:

Offensive Intelligence/Louisiana Tech/Current/

The play feed is play_feed-5.csv. It is filtered to the 2026 Louisiana Tech offensive team code LATC in pff_OFFTEAM. The five game breakdown files are loaded independently under their exact uploaded names from upload-manifest.json. The app keeps the regular opponent entries and their previous weeks intact; Louisiana Tech is opened from its opponent button or with ?opponent=LT.

The offensive depth chart is loaded from depth-chart.json in that folder, with the checked-in Louisiana Tech depth-chart snapshot as a fallback. Only its offensive unit is shown. The roster file is read when present; player appearances are matched by jersey number.

The supplied breakdown sheets each contain play identity, down, distance and field position. Their formation, concept, front and protection columns are currently blank, so the app displays those as uncharted and does not invent tendencies. Upload a newly charted file with the same filename to fill those fields.
