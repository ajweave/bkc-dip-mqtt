# Consolidated TODO — bkc-dip-mqtt spec conformance & HA correctness

Merged from `code_review.hy3.md` and `code_review.laguna-xs-2.1.md`. Every item was
verified against the current `master` source. Requirement being satisfied:
**every Home Assistant entity must reflect the unit's current value AND be
controllable from HA.**

Verification specs: `CT_600X_20005.pdf` (Appendix A Preset p.7, B System p.9-13,
E Unit p.24, R Zone Adjustment p.57-59) and `BKC_DIP_20010.pdf` (frame/command
format p.25-32).

Severity: CRITICAL = corrupts on-wire commands or leaves HA entities
non-functional; HIGH = wrong value shown / broken control path; MEDIUM = spec
deviation, dead/wrong code, missing query; LOW = cosmetic / best practice.

Convention decision (from user): **Volume is handled internally in dB (-80..0,
2 dB steps) per spec; Home Assistant exposes 0-100%. The bridge converts at the
boundary in both directions.**

---

## CRITICAL

### C-1. Source/Input IDs do not follow Appendix A Note 3
- Current: `SystemSettings.getInputs()` (system_settings.js:30-60) prepends
  FM=`00`/AM=`01` then loops `i=1..16` assigning `format2(i)` — so Input1=`01`
  (collides with AM), no `Dedicated`, phantom inputs 10-16, and every label is
  shifted. `server.js:96-104` "IN N" fallback maps `IN N -> format2(N)`.
- Why wrong: Note 3 (p.7) is `0=FM,1=AM,2=Dedicated,3=In1,4=In2,5=In3,6=In4,
  7=In5,8=In6,9=In7,A=In8,B=In9`. Only 12 sources exist. `id 01` is duplicated;
  `IN 7` currently selects In5.
- Fix: Replace loop with the fixed Note-3 12-entry list as the single source of
  truth for both discovery options and title->id lookup. Fix "IN N" fallback to
  `format2((N+2))` (In1->03 .. In9->0B). Keep FM/AM at 00/01. Drop the "Zone X
  IN Dedicated" generation. `PresetParameters.SOURCE_INPUT='02'` (parameter id)
  is already correct.

### C-2. Appendix R (Zone Adjustment) parameter IDs are wrong
- Current: `zone_adjustment_parameters.js` uses base `0x70` for Room EQ
  (`0x70+zoneNum` .. `0x73+zoneNum`) and `0x6C + zoneNum*0x13` / `0x74` / `0x7F`
  for Notch 1/2/3. These land in the Appendix B System range, not Appendix R.
- Why wrong: Appendix R (p.57-58) is contiguous from `00`. Zone A: Bass Gain
  `00`, Bass Freq `06`, Treble Gain `0C`, Treble Freq `12`, Notch1 Gain `18`,
  Notch1 Freq `1E`, Notch1 Width `24`, Notch2 Gain `2A`, Notch3 Gain `3C`,
  Notch3 Width `4D`. Zone stride = `0x06` for Room EQ family; notch gain zone
  stride = `1` (`18,19,1A,1B,1C,1D`). Layout:
  ```
  Room EQ Bass Gain   00..05   Bass Freq   06..0B
  Room EQ Treble Gain 0C..11   Treble Freq 12..17
  Notch1 Gain 18..1D  Freq 1E..23  Width 24..29
  Notch2 Gain 2A..2F  Freq 30..35  Width 36..3B
  Notch3 Gain 3C..41  Freq 42..47  Width 48..4D
  ```
- Fix: Recompute every id from the table above. Notch N gain base =
  `0x18 + (N-1)*0x12`; freq = gain+6; width = gain+12; then `+zoneNum` per zone.

### C-3. Appendix R value encodings are wrong
- Current (zone_adjustment_parameters.js): Room EQ gain `num-12` / clamp `0x18`;
  Bass Freq `num*100+20`; Treble Freq `num*1000+2000` / set clamp `0x18`; Notch
  gain `num-12` / clamp `0x19`; Notch freq `num*100+20` / clamp `0x8C`.
- Why wrong (Appendix R Notes p.59):
  - Note 1 Room EQ Gain: `0=-12 .. 18h=0 .. 30h=+12`, 0.5 dB step. Decode
    `hex-0x18` (in half-dB: `(hex-0x18)/2`); encode clamp `0..0x30`.
  - Note 2 Bass Freq: `0=20Hz`, step 5, `38h=300Hz`. Decode `20+num*5`.
  - Note 3 Treble Freq: `0=2.0kHz`, step 0.1kHz, `8Ch=16.0kHz`. Decode
    `2000+num*100` (Hz); encode clamp `0..0x8C`.
  - Note 4 Notch Gain: `1h=-18 .. 25h=0`. Decode `hex-0x25`; clamp `0..0x25`.
  - Note 5 Notch Freq: `0=20Hz`, step 2, `8Ch=300Hz`. Decode `20+num*2`.
  - Note 6 Notch Width: 0-6 Q-index (opaque; document it).
- Fix: Apply the offsets/steps above in getters and setters.

### C-4. Most declared HA entities are never published and have no command handler
- Current: `home_assistant.js` declares ~25 entities/zone + 3 system, but
  `server.js` message handler (60-136) only dispatches input/volume/power-state/
  bass/treble/loudness; `publishZonePreset` (233-245) only publishes those;
  `discover()` (201-210) sends only `G,F4`,`G,S` (no `G,H`). `ZoneAdjParameters`
  is required (16) but never instantiated. `system` pseudo-zone has no backing.
- Why wrong: state_topic never published -> HA "unknown"; command_topic never
  subscribed -> not controllable. ~20 of ~25 entities are dead.
- Fix: (1) `discover()` sends `G,H` after `G,S`. (2) `onReceive` handles
  `R`/`U` with spec starting `H`: build/keep a `ZoneAdjParameters` per zone,
  `process(parts)`, publish each room-eq/notch `/get`. (3) Extend message
  handler to dispatch room-eq/*, notch/*, tuner/*, left-level, right-level,
  *-max-level (and system) to the setters, then re-read. (4) Wire or drop the
  system pseudo-zone (flasher/rs-232/name).

### C-5. `system_settings.js` Room EQ / Notch methods duplicate & corrupt data
- Current: system_settings.js:71-282 defines get/setRoomEq* and get/setNotch*
  with bases `0x00..0x03+zoneNum` and `0x6C+zoneNum*0x13`. Never called (live
  path is zone_adjustment_parameters.js) but `0x00+zoneNum` is Appendix B
  "Input N Title".
- Why wrong: Room EQ/Notch belong in Appendix R only; these would corrupt input
  titles if ever wired.
- Fix: Delete get/setRoomEq* and get/setNotch* from system_settings.js. Keep
  Room EQ/Notch only in the corrected zone_adjustment_parameters.js.

---

## HIGH

### H-1. Volume: internal dB vs HA percent (convert at boundary)
- Current: HA volume declared `min:0,max:100,step:1,'%'` (home_assistant.js:
  68-71) but `publishZonePreset` publishes `getVolumeDb()` (dB) and
  `setVolumeDb` consumes a dB string. Mismatch: dB never in 0-100.
- Decision: keep internal dB (-80..0, 2 dB steps) per spec; HA uses 0-100%.
- Fix: Add boundary conversion. Publish `dbToPercent(db)` to `/volume/get`;
  in the handler convert incoming `%` via `percentToDb(pct)` before
  `setVolumeDb`. Percent maps linearly onto the 0x00..0x28 (0..40) hex range
  (equivalently `db = pct/100*80 - 80`, snapped to 2 dB). HA config stays
  `0-100 %`.

### H-2. `setPowerState` sends a malformed trailing GET
- Current: preset_parameters.js:27-28 sends `S,Z<zone>,24=<v>` then
  `G,Z<zone>,24=<v>`.
- Why wrong: GET form is `G,Z<zone>` with no `24=` suffix; unit ignores it. The
  `R,Z…,24=` reply after the SET is the real refresh.
- Fix: Delete the second `driver.send` line.

### H-3. `getInput()` can publish a raw hex id -> HA "unknown"
- Current: preset_parameters.js:46-54 returns raw `inputId` when lookup misses;
  HA `select` state must equal an option (a title).
- Fix: Resolved by C-1's correct map; also ensure `getInput` only ever returns a
  title present in the options list.

---

## MEDIUM

### M-1. `discover()` never queries Appendix R (`G,H`) or tuner/level params
- Covered operationally by C-4; tracked separately for the query side.

### M-2. Room EQ Gain HA `step` is 1 but spec resolution is 0.5 dB
- Current: home_assistant.js:124 (and treble/notch gain) `step:1`, range -12..12.
- Fix: `step: 0.5` on Room EQ / Notch gain numbers (depends on C-3 encoding).

### M-3. Checksum validation on received frames is disabled
- Current: server.js:257-277 extracts but never verifies cs16 (branch commented
  out). net.js has `//todo bounds check` on the 4096-byte buffer.
- Fix: Re-enable `DIP.calculateChecksum` verification; reject bad frames; add
  the bounds check in net.js.

### M-4. `dbVolumeToBk` snapping is wrong for negative odd dB
- Current: preset_parameters.js:78 `db = db + (db % 2)` rounds away from zero
  (-1 -> -2, 1 -> 2) rather than to nearest even.
- Fix: `db = Math.round(db/2)*2;` (folds into H-1's conversion work).

### M-5. Empty stub modules `lib/tuner.js` and `lib/model.js`
- Current: both 0 bytes; `tuner.js` never required.
- Fix: Remove (or implement).

### M-6. Missing recommended HA fields
- `entity_category` (config/diagnostic) and `enabled_by_default` absent on all
  entities. Best practice for the large entity set.

---

## LOW

### L-1. Debug `console.log` left in production paths
- server.js:28 "Audiophile version!!!!", per-frame logs, every setter logs.
  Gate behind a debug flag.

### L-2. Typo `"parameer"` in server.js:135 -> `"parameter"`.

### L-3. 9 kHz AM / 100 kHz FM variants never exposed via HA
- system_settings.js:315-378 correct vs spec but unwired; only 10 kHz AM /
  200 kHz FM (USA) surfaced. Confirm region.

### L-4. Notch Width entity is an opaque 0-6 Q-index
- No unit / doesn't convey actual Q (21.0..3.0). Document in name or add a
  mapping sensor.

---

## Implementation order
1. C-1 (source ids) + H-3
2. C-2 + C-3 + M-2 (Appendix R ids + encodings + step)
3. C-5 (delete dead Room EQ/Notch from system_settings.js)
4. H-1 + M-4 (volume dB<->% conversion)
5. H-2 (drop bogus GET)
6. C-4 + M-1 (HA wiring: G,H query, receive handler, command dispatch, system)
7. M-3 (checksum), M-5 (stubs), M-6 (HA fields)
8. L-1..L-4 (hygiene)

Note: tests in `test/index.js` currently lock in the buggy Appendix R ids
(e.g. asserting `0x70` base). They must be updated to the corrected ids as part
of C-2/C-3.
