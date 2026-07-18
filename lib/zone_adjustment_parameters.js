"use strict";
// Page 57-59 of CT_600X_20005.pdf - Appendix R: Zone Adjustment Parameters
//
// Appendix R parameter layout (contiguous, base 0x00), one entry per zone A-F.
// Zone stride is 0x06 within each Room EQ family; notch stride is 0x01.
//
//   Room EQ Bass Gain    00 01 02 03 04 05   (A..F)
//   Room EQ Bass Freq    06 07 08 09 0A 0B
//   Room EQ Treble Gain  0C 0D 0E 0F 10 11
//   Room EQ Treble Freq  12 13 14 15 16 17
//   Notch 1 Gain         18 19 1A 1B 1C 1D
//   Notch 1 Freq         1E 1F 20 21 22 23
//   Notch 1 Width        24 25 26 27 28 29
//   Notch 2 Gain         2A 2B 2C 2D 2E 2F
//   Notch 2 Freq         30 31 32 33 34 35
//   Notch 2 Width        36 37 38 39 3A 3B
//   Notch 3 Gain         3C 3D 3E 3F 40 41
//   Notch 3 Freq         42 43 44 45 46 47
//   Notch 3 Width        48 49 4A 4B 4C 4D
//
// Value encodings (Appendix R Notes, p.59):
//   Note 1 Room EQ Gain:  0h=-12dB .. 18h=0dB .. 30h=+12dB, step 0.5 dB
//   Note 2 Bass Freq:     0h=20Hz, step 5 Hz, 38h=300Hz
//   Note 3 Treble Freq:   0h=2.0kHz, step 0.1kHz, 8Ch=16.0kHz
//   Note 4 Notch Gain:    0h=-Inf, 1h=-18dB .. 25h=0dB (1 dB step)
//   Note 5 Notch Freq:    0h=20Hz, step 2 Hz, 8Ch=300Hz
//   Note 6 Notch Width:   0h..6h opaque Q-index (21.0 .. 3.0)

var ROOM_EQ_BASE = {
	bassGain:   0x00,
	bassFreq:   0x06,
	trebleGain: 0x0C,
	trebleFreq: 0x12
};

// Notch N gain base = 0x18 + (N-1)*0x12 ; freq = gain+6 ; width = gain+12.
function notchBase(notchNum) {
	return 0x18 + (notchNum - 1) * 0x12;
}

function zoneNumber(zone) {
	return 'ABCDEF'.indexOf(zone.toUpperCase());
}

// Helper function for formatting hex
function format2(n) {
	return ("00" + n.toString(16)).substr(-2).toUpperCase();
}

function clamp(v, lo, hi) {
	return Math.max(lo, Math.min(hi, v));
}

var ZoneAdjParameters = module.exports = function(receiveId, driver) {
	this.receiveId = receiveId;
	this.driver = driver;
	this.data = {};
};

ZoneAdjParameters.prototype.process = function(parts) {
	var data = this.data;
	parts.forEach(function(part) {
		var pair = part.split('=');
		if (pair.length == 2) {
			data[pair[0]] = pair[1];
		}
	});
};

// ---- id calculators -------------------------------------------------------

ZoneAdjParameters.prototype.roomEqId = function(kind, zone) {
	return format2((ROOM_EQ_BASE[kind] + zoneNumber(zone)).toString(16));
};

// component: 'gain' (+0), 'freq' (+6), 'width' (+12)
ZoneAdjParameters.prototype.notchId = function(notchNum, component, zone) {
	var off = component === 'gain' ? 0 : component === 'freq' ? 0x06 : 0x0C;
	return format2((notchBase(notchNum) + off + zoneNumber(zone)).toString(16));
};

// ---- Room EQ Bass Gain (Note 1: -12..+12 dB, 0.5 dB step) -----------------
ZoneAdjParameters.prototype.getRoomEqBassGain = function(zone) {
	var value = this.data[this.roomEqId('bassGain', zone)];
	if (value) {
		return ((parseInt(value, 16) - 0x18) / 2).toString(10);
	}
	return null;
};

ZoneAdjParameters.prototype.setRoomEqBassGain = function(zone, gainDb) {
	var hexId = this.roomEqId('bassGain', zone);
	var value = clamp(Math.round(gainDb * 2) + 0x18, 0, 0x30);
	console.log("Setting zone", zone, "Room EQ Bass Gain to", gainDb, "dB (hex:", format2(value) + ")");
	this.driver.send(this.receiveId, 'S,H,' + hexId + '=' + format2(value));
};

// ---- Room EQ Bass Frequency (Note 2: 20Hz, step 5Hz, up to 300Hz) ---------
ZoneAdjParameters.prototype.getRoomEqBassFrequency = function(zone) {
	var value = this.data[this.roomEqId('bassFreq', zone)];
	if (value) {
		return 20 + parseInt(value, 16) * 5;
	}
	return null;
};

ZoneAdjParameters.prototype.setRoomEqBassFrequency = function(zone, frequencyHz) {
	var hexId = this.roomEqId('bassFreq', zone);
	var value = clamp(Math.round((frequencyHz - 20) / 5), 0, 0x38);
	console.log("Setting zone", zone, "Room EQ Bass Frequency to", frequencyHz, "Hz (hex:", format2(value) + ")");
	this.driver.send(this.receiveId, 'S,H,' + hexId + '=' + format2(value));
};

// ---- Room EQ Treble Gain (Note 1: -12..+12 dB, 0.5 dB step) ---------------
ZoneAdjParameters.prototype.getRoomEqTrebleGain = function(zone) {
	var value = this.data[this.roomEqId('trebleGain', zone)];
	if (value) {
		return ((parseInt(value, 16) - 0x18) / 2).toString(10);
	}
	return null;
};

ZoneAdjParameters.prototype.setRoomEqTrebleGain = function(zone, gainDb) {
	var hexId = this.roomEqId('trebleGain', zone);
	var value = clamp(Math.round(gainDb * 2) + 0x18, 0, 0x30);
	console.log("Setting zone", zone, "Room EQ Treble Gain to", gainDb, "dB (hex:", format2(value) + ")");
	this.driver.send(this.receiveId, 'S,H,' + hexId + '=' + format2(value));
};

// ---- Room EQ Treble Frequency (Note 3: 2.0kHz, step 0.1kHz, up to 16kHz) --
ZoneAdjParameters.prototype.getRoomEqTrebleFrequency = function(zone) {
	var value = this.data[this.roomEqId('trebleFreq', zone)];
	if (value) {
		return 2000 + parseInt(value, 16) * 100; // Hz
	}
	return null;
};

ZoneAdjParameters.prototype.setRoomEqTrebleFrequency = function(zone, frequencyHz) {
	var hexId = this.roomEqId('trebleFreq', zone);
	var value = clamp(Math.round((frequencyHz - 2000) / 100), 0, 0x8C);
	console.log("Setting zone", zone, "Room EQ Treble Frequency to", frequencyHz, "Hz (hex:", format2(value) + ")");
	this.driver.send(this.receiveId, 'S,H,' + hexId + '=' + format2(value));
};

// ---- Notch Gain (Note 4: 0h=bypass/-Inf, 1h=-18dB .. 25h=0dB) ------------
// Raw 0x00 means the notch is bypassed (no gain cut). We surface that as
// null (no value) so it doesn't publish a bogus -37 dB to Home Assistant.
ZoneAdjParameters.NOTCH_GAIN_BYPASS = 0x00;

ZoneAdjParameters.prototype.getNotchGain = function(notchNum, zone) {
	var value = this.data[this.notchId(notchNum, 'gain', zone)];
	if (value) {
		var raw = parseInt(value, 16);
		if (raw === ZoneAdjParameters.NOTCH_GAIN_BYPASS) {
			return null; // bypassed / -Inf
		}
		return (raw - 0x25).toString(10);
	}
	return null;
};

ZoneAdjParameters.prototype.setNotchGain = function(notchNum, zone, gainDb) {
	var hexId = this.notchId(notchNum, 'gain', zone);
	var value;
	if (gainDb === null || gainDb === undefined) {
		// Disable / bypass the notch (0x00).
		value = ZoneAdjParameters.NOTCH_GAIN_BYPASS;
	} else {
		value = clamp(Math.round(gainDb + 0x25), 0, 0x25);
	}
	console.log("Setting zone", zone, "Notch", notchNum, "Gain to", (value === ZoneAdjParameters.NOTCH_GAIN_BYPASS ? "bypass" : gainDb + " dB"), "(hex:", format2(value) + ")");
	this.driver.send(this.receiveId, 'S,H,' + hexId + '=' + format2(value));
};

// ---- Notch Frequency (Note 5: 20Hz, step 2Hz, up to 300Hz) ---------------
ZoneAdjParameters.prototype.getNotchFrequency = function(notchNum, zone) {
	var value = this.data[this.notchId(notchNum, 'freq', zone)];
	if (value) {
		return 20 + parseInt(value, 16) * 2;
	}
	return null;
};

ZoneAdjParameters.prototype.setNotchFrequency = function(notchNum, zone, frequencyHz) {
	var hexId = this.notchId(notchNum, 'freq', zone);
	var value = clamp(Math.round((frequencyHz - 20) / 2), 0, 0x8C);
	console.log("Setting zone", zone, "Notch", notchNum, "Frequency to", frequencyHz, "Hz (hex:", format2(value) + ")");
	this.driver.send(this.receiveId, 'S,H,' + hexId + '=' + format2(value));
};

// ---- Notch Width (Note 6: opaque 0..6 Q-index) ---------------------------
ZoneAdjParameters.prototype.getNotchWidth = function(notchNum, zone) {
	var value = this.data[this.notchId(notchNum, 'width', zone)];
	if (value) {
		return parseInt(value, 16);
	}
	return null;
};

ZoneAdjParameters.prototype.setNotchWidth = function(notchNum, zone, width) {
	var hexId = this.notchId(notchNum, 'width', zone);
	var value = clamp(Math.round(width), 0, 6);
	console.log("Setting zone", zone, "Notch", notchNum, "Width to", width, "Q (hex:", format2(value) + ")");
	this.driver.send(this.receiveId, 'S,H,' + hexId + '=' + format2(value));
};

// ---- Backwards-compatible per-notch wrappers ------------------------------
[1, 2, 3].forEach(function(n) {
	ZoneAdjParameters.prototype['getNotch' + n + 'Gain'] = function(zone) { return this.getNotchGain(n, zone); };
	ZoneAdjParameters.prototype['setNotch' + n + 'Gain'] = function(zone, gainDb) { return this.setNotchGain(n, zone, gainDb); };
	ZoneAdjParameters.prototype['getNotch' + n + 'Frequency'] = function(zone) { return this.getNotchFrequency(n, zone); };
	ZoneAdjParameters.prototype['setNotch' + n + 'Frequency'] = function(zone, hz) { return this.setNotchFrequency(n, zone, hz); };
	ZoneAdjParameters.prototype['getNotch' + n + 'Width'] = function(zone) { return this.getNotchWidth(n, zone); };
	ZoneAdjParameters.prototype['setNotch' + n + 'Width'] = function(zone, w) { return this.setNotchWidth(n, zone, w); };
});

// Parameter IDs (from Appendix R)
ZoneAdjParameters.ACTIVE_LOGICAL_ZONE_NUMBERS = '10';
