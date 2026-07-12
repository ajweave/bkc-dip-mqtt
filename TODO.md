# System Settings Implementation Plan

## Overview
Implement all BKC-DIP system parameters as Home Assistant devices and services.

## Current State
- Input titles (01-0F) - Partially implemented
- Volume levels (20-2F) - Implemented for presets
- Video sources (30-3F) - Partially implemented

## Missing System Settings (from Appendix B)

### 1. Tuner Settings (40-44)
| ID | Name | Description | HA Entity |
|----|------|-------------|-----------|
| 40 | AM Frequency (10kHz) | AM frequency, USA step | `sensor.zone.am_frequency` |
| 41 | AM Frequency (9kHz) | AM frequency, international | `sensor.zone.am_frequency_9khz` |
| 42 | FM Frequency (200kHz) | FM frequency, USA step | `sensor.zone.fm_frequency` |
| 43 | FM Frequency (100kHz) | FM frequency, international | `sensor.zone.fm_frequency_100khz` |
| 44 | FM Mode | 0=Mono, 1=Stereo | `select.zone.fm_mode` |

### 2. Tuner Level Settings (50-5B)
| ID | Name | Description | HA Entity |
|----|------|-------------|-----------|
| 50-55 | Tuner Level | Zone A-F tuner level | `number.zone.tuner_level` |
| 56-5B | Tuner Max Level | Zone A-F tuner max level | `number.zone.tuner_max_level` |

### 3. Tuner Assignment (60-65)
| ID | Name | Description | HA Entity |
|----|------|-------------|-----------|
| 60-65 | Tuner Assignment | Zone A-F tuner assignment | `select.zone.tuner_assignment` |

### 4. Mode Settings (66-6B)
| ID | Name | Description | HA Entity |
|----|------|-------------|-----------|
| 66-6B | Mode | Zone A-F mode settings | `select.zone.mode` |

### 5. Page/Event Selection (6C-71)
| ID | Name | Description | HA Entity |
|----|------|-------------|-----------|
| 6C-71 | Page/Event | Zone A-F page/event selection | `select.zone.page_event` |

### 6. Level Controls (72-83)
| ID | Name | Description | HA Entity |
|----|------|-------------|-----------|
| 72-83 | Left/Right Level | Zone A-F left/right level control | `number.zone.left_level`, `number.zone.right_level` |

### 7. Max Level Controls (84-95)
| ID | Name | Description | HA Entity |
|----|------|-------------|-----------|
| 84-95 | Left/Right Max | Zone A-F left/right max level | `number.zone.left_max`, `number.zone.right_max` |

### 8. Control Outputs (96-A7)
| ID | Name | Description | HA Entity |
|----|------|-------------|-----------|
| 96-9B | Control Out | Zone A-F control out selection | `select.zone.control_out` |
| 9C-A1 | Control Out Selected | Zone A-F control out selected | `sensor.zone.control_out_selected` |
| A2-A7 | Common Control 1 | Common control 1 out select | `select.common_control_1` |
| A8-AD | Common Control 2 | Common control 2 out select | `select.common_control_2` |

### 9. Code Set IDs (AE-BF)
| ID | Name | Description | HA Entity |
|----|------|-------------|-----------|
| AE-BF | Group Code Set | Group a-z code set IDs | `sensor.group_code_set` |

### 10. Rear Remote Inputs (C0-C5)
| ID | Name | Description | HA Entity |
|----|------|-------------|-----------|
| C0-C5 | Rear Remote | Zone A-F rear remote setting | `select.zone.rear_remote` |

### 11. Other Settings (CA-CB, CC-CF, D0-D5)
| ID | Name | Description | HA Entity |
|----|------|-------------|-----------|
| CA | Flasher Out | Flasher output setting | `switch.flascher_out` |
| CB | RS-232 Control Out | RS-232 control output | `select.rs232_control` |
| CC-CF | Page/Event Actions | Page/event actions | `switch.page_event_action` |
| D0-D5 | System Settings | Various system settings | `sensor.system_settings` |

## Appendix R: Zone Adjustment Parameters (From CT_600X_20005.pdf)

### Zone A Room EQ Settings (H00-H17)
| ID | Name | Description | HA Entity |
|----|------|-------------|-----------|
| H00 | Room EQ Bass Gain | Zone A Room EQ Bass Gain | `number.zone_a.room_eq_bass_gain` |
| H01 | Room EQ Bass Frequency | Zone A Room EQ Bass Frequency | `sensor.zone_a.room_eq_bass_freq` |
| H02 | Room EQ Treble Gain | Zone A Room EQ Treble Gain | `number.zone_a.room_eq_treble_gain` |
| H03 | Room EQ Treble Frequency | Zone A Room EQ Treble Frequency | `sensor.zone_a.room_eq_treble_freq` |

### Zone B Room EQ Settings (H18-H2F)
| ID | Name | Description | HA Entity |
|----|------|-------------|-----------|
| H18 | Room EQ Bass Gain | Zone B Room EQ Bass Gain | `number.zone_b.room_eq_bass_gain` |
| H19 | Room EQ Bass Frequency | Zone B Room EQ Bass Frequency | `sensor.zone_b.room_eq_bass_freq` |
| H1A | Room EQ Treble Gain | Zone B Room EQ Treble Gain | `number.zone_b.room_eq_treble_gain` |
| H1B | Room EQ Treble Frequency | Zone B Room EQ Treble Frequency | `sensor.zone_b.room_eq_treble_freq` |

### Zone C Room EQ Settings (H20-H37)
| ID | Name | Description | HA Entity |
|----|------|-------------|-----------|
| H20 | Room EQ Bass Gain | Zone C Room EQ Bass Gain | `number.zone_c.room_eq_bass_gain` |
| H21 | Room EQ Bass Frequency | Zone C Room EQ Bass Frequency | `sensor.zone_c.room_eq_bass_freq` |
| H22 | Room EQ Treble Gain | Zone C Room EQ Treble Gain | `number.zone_c.room_eq_treble_gain` |
| H23 | Room EQ Treble Frequency | Zone C Room EQ Treble Frequency | `sensor.zone_c.room_eq_treble_freq` |

### Zone D Room EQ Settings (H24-H3B)
| ID | Name | Description | HA Entity |
|----|------|-------------|-----------|
| H24 | Room EQ Bass Gain | Zone D Room EQ Bass Gain | `number.zone_d.room_eq_bass_gain` |
| H25 | Room EQ Bass Frequency | Zone D Room EQ Bass Frequency | `sensor.zone_d.room_eq_bass_freq` |
| H26 | Room EQ Treble Gain | Zone D Room EQ Treble Gain | `number.zone_d.room_eq_treble_gain` |
| H27 | Room EQ Treble Frequency | Zone D Room EQ Treble Frequency | `sensor.zone_d.room_eq_treble_freq` |

### Zone E Room EQ Settings (H3C-H53)
| ID | Name | Description | HA Entity |
|----|------|-------------|-----------|
| H3C | Room EQ Bass Gain | Zone E Room EQ Bass Gain | `number.zone_e.room_eq_bass_gain` |
| H3D | Room EQ Bass Frequency | Zone E Room EQ Bass Frequency | `sensor.zone_e.room_eq_bass_freq` |
| H3E | Room EQ Treble Gain | Zone E Room EQ Treble Gain | `number.zone_e.room_eq_treble_gain` |
| H3F | Room EQ Treble Frequency | Zone E Room EQ Treble Frequency | `sensor.zone_e.room_eq_treble_freq` |

### Zone F Room EQ Settings (H54-H6B)
| ID | Name | Description | HA Entity |
|----|------|-------------|-----------|
| H54 | Room EQ Bass Gain | Zone F Room EQ Bass Gain | `number.zone_f.room_eq_bass_gain` |
| H55 | Room EQ Bass Frequency | Zone F Room EQ Bass Frequency | `sensor.zone_f.room_eq_bass_freq` |
| H56 | Room EQ Treble Gain | Zone F Room EQ Treble Gain | `number.zone_f.room_eq_treble_gain` |
| H57 | Room EQ Treble Frequency | Zone F Room EQ Treble Frequency | `sensor.zone_f.room_eq_treble_freq` |

### Zone A Notch Filter Settings (H6C-H7F)
| ID | Name | Description | HA Entity |
|----|------|-------------|-----------|
| H6C | Notch 1 Gain | Zone A Notch 1 Gain | `number.zone_a.notch1_gain` |
| H6D | Notch 1 Frequency | Zone A Notch 1 Frequency | `sensor.zone_a.notch1_freq` |
| H6E | Notch 1 Width | Zone A Notch 1 Width | `number.zone_a.notch1_width` |
| H6F | Notch 2 Gain | Zone A Notch 2 Gain | `number.zone_a.notch2_gain` |
| H70 | Notch 2 Frequency | Zone A Notch 2 Frequency | `sensor.zone_a.notch2_freq` |
| H71 | Notch 2 Width | Zone A Notch 2 Width | `number.zone_a.notch2_width` |
| H72 | Notch 3 Gain | Zone A Notch 3 Gain | `number.zone_a.notch3_gain` |
| H73 | Notch 3 Frequency | Zone A Notch 3 Frequency | `sensor.zone_a.notch3_freq` |
| H74 | Notch 3 Width | Zone A Notch 3 Width | `number.zone_a.notch3_width` |

### Zone B Notch Filter Settings (H75-H87)
| ID | Name | Description | HA Entity |
|----|------|-------------|-----------|
| H75 | Notch 1 Gain | Zone B Notch 1 Gain | `number.zone_b.notch1_gain` |
| H76 | Notch 1 Frequency | Zone B Notch 1 Frequency | `sensor.zone_b.notch1_freq` |
| H77 | Notch 1 Width | Zone B Notch 1 Width | `number.zone_b.notch1_width` |
| H78 | Notch 2 Gain | Zone B Notch 2 Gain | `number.zone_b.notch2_gain` |
| H79 | Notch 2 Frequency | Zone B Notch 2 Frequency | `sensor.zone_b.notch2_freq` |
| H7A | Notch 2 Width | Zone B Notch 2 Width | `number.zone_b.notch2_width` |
| H7B | Notch 3 Gain | Zone B Notch 3 Gain | `number.zone_b.notch3_gain` |
| H7C | Notch 3 Frequency | Zone B Notch 3 Frequency | `sensor.zone_b.notch3_freq` |
| H7D | Notch 3 Width | Zone B Notch 3 Width | `number.zone_b.notch3_width` |

### Zone C Notch Filter Settings (H7E-H90)
| ID | Name | Description | HA Entity |
|----|------|-------------|-----------|
| H7E | Notch 1 Gain | Zone C Notch 1 Gain | `number.zone_c.notch1_gain` |
| H7F | Notch 1 Frequency | Zone C Notch 1 Frequency | `sensor.zone_c.notch1_freq` |
| H80 | Notch 1 Width | Zone C Notch 1 Width | `number.zone_c.notch1_width` |
| H81 | Notch 2 Gain | Zone C Notch 2 Gain | `number.zone_c.notch2_gain` |
| H82 | Notch 2 Frequency | Zone C Notch 2 Frequency | `sensor.zone_c.notch2_freq` |
| H83 | Notch 2 Width | Zone C Notch 2 Width | `number.zone_c.notch2_width` |
| H84 | Notch 3 Gain | Zone C Notch 3 Gain | `number.zone_c.notch3_gain` |
| H85 | Notch 3 Frequency | Zone C Notch 3 Frequency | `sensor.zone_c.notch3_freq` |
| H86 | Notch 3 Width | Zone C Notch 3 Width | `number.zone_c.notch3_width` |

### Zone D Notch Filter Settings (H87-H99)
| ID | Name | Description | HA Entity |
|----|------|-------------|-----------|
| H87 | Notch 1 Gain | Zone D Notch 1 Gain | `number.zone_d.notch1_gain` |
| H88 | Notch 1 Frequency | Zone D Notch 1 Frequency | `sensor.zone_d.notch1_freq` |
| H89 | Notch 1 Width | Zone D Notch 1 Width | `number.zone_d.notch1_width` |
| H8A | Notch 2 Gain | Zone D Notch 2 Gain | `number.zone_d.notch2_gain` |
| H8B | Notch 2 Frequency | Zone D Notch 2 Frequency | `sensor.zone_d.notch2_freq` |
| H8C | Notch 2 Width | Zone D Notch 2 Width | `number.zone_d.notch2_width` |
| H8D | Notch 3 Gain | Zone D Notch 3 Gain | `number.zone_d.notch3_gain` |
| H8E | Notch 3 Frequency | Zone D Notch 3 Frequency | `sensor.zone_d.notch3_freq` |
| H8F | Notch 3 Width | Zone D Notch 3 Width | `number.zone_d.notch3_width` |

### Zone E Notch Filter Settings (H90-H9F)
| ID | Name | Description | HA Entity |
|----|------|-------------|-----------|
| H90 | Notch 1 Gain | Zone E Notch 1 Gain | `number.zone_e.notch1_gain` |
| H91 | Notch 1 Frequency | Zone E Notch 1 Frequency | `sensor.zone_e.notch1_freq` |
| H92 | Notch 1 Width | Zone E Notch 1 Width | `number.zone_e.notch1_width` |
| H93 | Notch 2 Gain | Zone E Notch 2 Gain | `number.zone_e.notch2_gain` |
| H94 | Notch 2 Frequency | Zone E Notch 2 Frequency | `sensor.zone_e.notch2_freq` |
| H95 | Notch 2 Width | Zone E Notch 2 Width | `number.zone_e.notch2_width` |
| H96 | Notch 3 Gain | Zone E Notch 3 Gain | `number.zone_e.notch3_gain` |
| H97 | Notch 3 Frequency | Zone E Notch 3 Frequency | `sensor.zone_e.notch3_freq` |
| H98 | Notch 3 Width | Zone E Notch 3 Width | `number.zone_e.notch3_width` |

### Zone F Notch Filter Settings (H99-HAB)
| ID | Name | Description | HA Entity |
|----|------|-------------|-----------|
| H99 | Notch 1 Gain | Zone F Notch 1 Gain | `number.zone_f.notch1_gain` |
| HA | Notch 1 Frequency | Zone F Notch 1 Frequency | `sensor.zone_f.notch1_freq` |
| HB | Notch 1 Width | Zone F Notch 1 Width | `number.zone_f.notch1_width` |
| HC | Notch 2 Gain | Zone F Notch 2 Gain | `number.zone_f.notch2_gain` |
| HD | Notch 2 Frequency | Zone F Notch 2 Frequency | `sensor.zone_f.notch2_freq` |
| HE | Notch 2 Width | Zone F Notch 2 Width | `number.zone_f.notch2_width` |
| HF | Notch 3 Gain | Zone F Notch 3 Gain | `number.zone_f.notch3_gain` |
| H100 | Notch 3 Frequency | Zone F Notch 3 Frequency | `sensor.zone_f.notch3_freq` |
| H101 | Notch 3 Width | Zone F Notch 3 Width | `number.zone_f.notch3_width` |

## Implementation Steps

### Step 1: Create System Settings Module
- [x] Create `lib/system_settings.js` methods for all parameters
- [x] Add getter/setter methods for each parameter type
- [x] Add validation for parameter values

### Step 2: Update Home Assistant Integration
- [x] Add new MQTT topics for system settings
- [x] Create sensor/number/select entities for each parameter
- [x] Add commands for setting parameters

### Step 3: Add Discovery Support
- [x] Update HA discovery to include room EQ settings
- [x] Add discovery for notch filter settings
- [x] Add discovery for all zone adjustment parameters

### Step 4: Testing
- [ ] Test each parameter individually
- [ ] Test bulk updates
- [ ] Test edge cases and invalid values

## Technical Notes

### Parameter Value Ranges
- **Room EQ Gain**: 0x00-0x18 (-12dB to +12dB, Note 1)
- **Room EQ Frequency**: 0x00-0x38 (20Hz to 20kHz, Note 2, 3)
- **Notch Gain**: 0x00-0x19 (-12dB to +12dB, Note 4)
- **Notch Frequency**: 0x00-0x8C (20Hz to 20kHz, Note 5)
- **Notch Width**: 0x00-0x06 (Q factor, Note 6)

### Command Format
- Read: `(R,H,{param};checksum)`
- Set: `(S,H,{param}={value};checksum)`

### Data Types
- Hex values: 2-char hex strings (00-FF)
- Strings: Quoted values ("Title")
- Booleans: 0/1
- Enums: Specific hex values

## References
- CT_600X_20005.pdf Appendix B: System Parameters
- CT_600X_20005.pdf Appendix A: Preset Parameters
- CT_600X_20005.pdf Appendix C: Tuner Station Parameters
- CT_600X_20005.pdf Appendix R: Zone Adjustment Parameters