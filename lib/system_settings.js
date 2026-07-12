"use strict";
// Page 9 of CT_600X_20005.pdf - Appendix B: System Parameters

var SystemSettings = module.exports = function() {
	this.data = {};
};

SystemSettings.prototype.process = function(parts) {
	var data = this.data;
	parts.forEach(function(part) {
		var pair = part.split('=');
		if (pair.length == 2) {
			data[pair[0]] = pair[1];
		}
	});
};

/**
 * Get the list of available inputs for selection in Home Assistant.
 * 
 * Based on Appendix B, page 9: System Parameters table
 * Input titles are stored at hex offsets 00-0F:
 *   00 = System Name, 01 = Input 1 Title, 02 = Input 2 Title, ...
 *   0F = Input 16 Title (if set)
 * 
 * The ID returned IS the hex value used in preset SOURCE_INPUT settings.
 * 
 * @returns {Array<{id: string, title: string}>} Array of input objects with hex ID and title
 */
SystemSettings.prototype.getInputs = function() {
	var data = this.data;
	var inputs = [];
	
	// Add special AM/FM tuner inputs
	inputs.push({ id: '00', title: 'FM' });
	inputs.push({ id: '01', title: 'AM' });
	
	// Read input titles from system settings (hex offsets 01-0F = up to 16 inputs)
	// Default to "Input N" if no title is set
	for (var i = 1; i <= 16; i++) {
		var hexId = format2(i.toString(16));
		var title = data[hexId];
		// Check if title is a valid quoted string
		if (!title || typeof title !== "string" || title.indexOf('"') === -1) {
			// Generate default title based on position
			if (i < 10) {
				title = "Input " + i;
			} else {
				var zones = ['A', 'B', 'C', 'D', 'E', 'F'];
				title = "Zone " + zones[i - 10] + " IN Dedicated";
			}
		}
		inputs.push({
			id: hexId,
			title: (title || "").trim().replace(/^["']|["']$/g, "").trim()
		});
	}
	
	return inputs;
};

// ==========================================
// ROOM EQ SETTINGS (Appendix R)
// ==========================================

/**
 * Get Room EQ Bass Gain for a specific zone
 * @param {string} zone - Zone letter (A-F)
 * @returns {number} Bass gain in dB (-12 to +12)
 */
SystemSettings.prototype.getRoomEqBassGain = function(zone) {
	var zoneNum = 'ABCDEF'.indexOf(zone.toUpperCase());
	var hexId = format2((0x00 + zoneNum).toString(16));
	var value = this.data[hexId];
	if (value && value.length === 2) {
		var num = parseInt(value, 16);
		return num - 12; // 0x00 = -12dB, 0x18 = +12dB
	}
	return 0;
};

/**
 * Set Room EQ Bass Gain for a specific zone
 * @param {string} zone - Zone letter (A-F)
 * @param {number} gainDb - Gain in dB (-12 to +12)
 * @returns {string} Command to send: S,H,{hexId}={value}
 */
SystemSettings.prototype.setRoomEqBassGain = function(zone, gainDb) {
	var zoneNum = 'ABCDEF'.indexOf(zone.toUpperCase());
	var hexId = format2((0x00 + zoneNum).toString(16));
	var value = Math.max(0, Math.min(0x18, Math.round(gainDb + 12)));
	return 'S,H,' + hexId + '=' + format2(value.toString(16));
};

/**
 * Get Room EQ Bass Frequency for a specific zone
 * @param {string} zone - Zone letter (A-F)
 * @returns {number} Frequency in Hz
 */
SystemSettings.prototype.getRoomEqBassFrequency = function(zone) {
	var zoneNum = 'ABCDEF'.indexOf(zone.toUpperCase());
	var hexId = format2((0x01 + zoneNum).toString(16));
	var value = this.data[hexId];
	if (value && value.length === 2) {
		var num = parseInt(value, 16);
		return 20 + (num * 100); // 0x00 = 20Hz, 0x38 = 20kHz
	}
	return 60; // Default 60Hz
};

/**
 * Set Room EQ Bass Frequency for a specific zone
 * @param {string} zone - Zone letter (A-F)
 * @param {number} frequencyHz - Frequency in Hz
 * @returns {string} Command to send: S,H,{hexId}={value}
 */
SystemSettings.prototype.setRoomEqBassFrequency = function(zone, frequencyHz) {
	var zoneNum = 'ABCDEF'.indexOf(zone.toUpperCase());
	var hexId = format2((0x01 + zoneNum).toString(16));
	var value = Math.max(0, Math.min(0x38, Math.round((frequencyHz - 20) / 100)));
	return 'S,H,' + hexId + '=' + format2(value.toString(16));
};

/**
 * Get Room EQ Treble Gain for a specific zone
 * @param {string} zone - Zone letter (A-F)
 * @returns {number} Gain in dB (-12 to +12)
 */
SystemSettings.prototype.getRoomEqTrebleGain = function(zone) {
	var zoneNum = 'ABCDEF'.indexOf(zone.toUpperCase());
	var hexId = format2((0x02 + zoneNum).toString(16));
	var value = this.data[hexId];
	if (value && value.length === 2) {
		var num = parseInt(value, 16);
		return num - 12;
	}
	return 0;
};

/**
 * Set Room EQ Treble Gain for a specific zone
 * @param {string} zone - Zone letter (A-F)
 * @param {number} gainDb - Gain in dB (-12 to +12)
 * @returns {string} Command to send: S,H,{hexId}={value}
 */
SystemSettings.prototype.setRoomEqTrebleGain = function(zone, gainDb) {
	var zoneNum = 'ABCDEF'.indexOf(zone.toUpperCase());
	var hexId = format2((0x02 + zoneNum).toString(16));
	var value = Math.max(0, Math.min(0x18, Math.round(gainDb + 12)));
	return 'S,H,' + hexId + '=' + format2(value.toString(16));
};

/**
 * Get Room EQ Treble Frequency for a specific zone
 * @param {string} zone - Zone letter (A-F)
 * @returns {number} Frequency in Hz
 */
SystemSettings.prototype.getRoomEqTrebleFrequency = function(zone) {
	var zoneNum = 'ABCDEF'.indexOf(zone.toUpperCase());
	var hexId = format2((0x03 + zoneNum).toString(16));
	var value = this.data[hexId];
	if (value && value.length === 2) {
		var num = parseInt(value, 16);
		return 2000 + (num * 1000); // 0x00 = 2kHz, 0x38 = 20kHz
	}
	return 2000; // Default 2kHz
};

/**
 * Set Room EQ Treble Frequency for a specific zone
 * @param {string} zone - Zone letter (A-F)
 * @param {number} frequencyHz - Frequency in Hz
 * @returns {string} Command to send: S,H,{hexId}={value}
 */
SystemSettings.prototype.setRoomEqTrebleFrequency = function(zone, frequencyHz) {
	var zoneNum = 'ABCDEF'.indexOf(zone.toUpperCase());
	var hexId = format2((0x03 + zoneNum).toString(16));
	var value = Math.max(0, Math.min(0x38, Math.round((frequencyHz - 2000) / 1000)));
	return 'S,H,' + hexId + '=' + format2(value.toString(16));
};

// ==========================================
// NOTCH FILTER SETTINGS (Appendix R)
// ==========================================

/**
 * Get Notch Filter Gain for a specific zone and notch number
 * @param {string} zone - Zone letter (A-F)
 * @param {number} notchNum - Notch number (1, 2, or 3)
 * @returns {number} Gain in dB (-12 to +12)
 */
SystemSettings.prototype.getNotchGain = function(zone, notchNum) {
	var zoneNum = 'ABCDEF'.indexOf(zone.toUpperCase());
	var notchOffset = (notchNum - 1) * 0x0D; // 0x0D = 13 parameters per notch
	var hexId = format2((0x6C + zoneNum * 0x13 + notchOffset).toString(16));
	var value = this.data[hexId];
	if (value && value.length === 2) {
		var num = parseInt(value, 16);
		return num - 12; // 0x00 = -12dB, 0x19 = +12dB
	}
	return 0;
};

/**
 * Set Notch Filter Gain for a specific zone and notch number
 * @param {string} zone - Zone letter (A-F)
 * @param {number} notchNum - Notch number (1, 2, or 3)
 * @param {number} gainDb - Gain in dB (-12 to +12)
 * @returns {string} Command to send: S,H,{hexId}={value}
 */
SystemSettings.prototype.setNotchGain = function(zone, notchNum, gainDb) {
	var zoneNum = 'ABCDEF'.indexOf(zone.toUpperCase());
	var notchOffset = (notchNum - 1) * 0x0D; // 0x0D = 13 parameters per notch
	var hexId = format2((0x6C + zoneNum * 0x13 + notchOffset).toString(16));
	var value = Math.max(0, Math.min(0x19, Math.round(gainDb + 12)));
	return 'S,H,' + hexId + '=' + format2(value.toString(16));
};

/**
 * Get Notch Filter Frequency for a specific zone and notch number
 * @param {string} zone - Zone letter (A-F)
 * @param {number} notchNum - Notch number (1, 2, or 3)
 * @returns {number} Frequency in Hz
 */
SystemSettings.prototype.getNotchFrequency = function(zone, notchNum) {
	var zoneNum = 'ABCDEF'.indexOf(zone.toUpperCase());
	var notchOffset = (notchNum - 1) * 0x0D + 1; // Gain is param 0, Freq is param 1
	var hexId = format2((0x6C + zoneNum * 0x13 + notchOffset).toString(16));
	var value = this.data[hexId];
	if (value && value.length === 2) {
		var num = parseInt(value, 16);
		return 20 + (num * 100); // 0x00 = 20Hz, 0x8C = 20kHz
	}
	return 60; // Default 60Hz
};

/**
 * Set Notch Filter Frequency for a specific zone and notch number
 * @param {string} zone - Zone letter (A-F)
 * @param {number} notchNum - Notch number (1, 2, or 3)
 * @param {number} frequencyHz - Frequency in Hz
 * @returns {string} Command to send: S,H,{hexId}={value}
 */
SystemSettings.prototype.setNotchFrequency = function(zone, notchNum, frequencyHz) {
	var zoneNum = 'ABCDEF'.indexOf(zone.toUpperCase());
	var notchOffset = (notchNum - 1) * 0x0D + 1; // Gain is param 0, Freq is param 1
	var hexId = format2((0x6C + zoneNum * 0x13 + notchOffset).toString(16));
	var value = Math.max(0, Math.min(0x8C, Math.round((frequencyHz - 20) / 100)));
	return 'S,H,' + hexId + '=' + format2(value.toString(16));
};

/**
 * Get Notch Filter Width for a specific zone and notch number
 * @param {string} zone - Zone letter (A-F)
 * @param {number} notchNum - Notch number (1, 2, or 3)
 * @returns {number} Width/Q factor (0-6)
 */
SystemSettings.prototype.getNotchWidth = function(zone, notchNum) {
	var zoneNum = 'ABCDEF'.indexOf(zone.toUpperCase());
	var notchOffset = (notchNum - 1) * 0x0D + 2; // Gain=0, Freq=1, Width=2
	var hexId = format2((0x6C + zoneNum * 0x13 + notchOffset).toString(16));
	var value = this.data[hexId];
	if (value && value.length === 2) {
		return parseInt(value, 16);
	}
	return 6; // Default width
};

/**
 * Set Notch Filter Width for a specific zone and notch number
 * @param {string} zone - Zone letter (A-F)
 * @param {number} notchNum - Notch number (1, 2, or 3)
 * @param {number} width - Width/Q factor (0-6)
 * @returns {string} Command to send: S,H,{hexId}={value}
 */
SystemSettings.prototype.setNotchWidth = function(zone, notchNum, width) {
	var zoneNum = 'ABCDEF'.indexOf(zone.toUpperCase());
	var notchOffset = (notchNum - 1) * 0x0D + 2; // Gain=0, Freq=1, Width=2
	var hexId = format2((0x6C + zoneNum * 0x13 + notchOffset).toString(16));
	var value = Math.max(0, Math.min(6, Math.round(width)));
	return 'S,H,' + hexId + '=' + format2(value.toString(16));
};

// ==========================================
// TUNER SETTINGS (Appendix B)
// ==========================================

/**
 * Get AM Frequency (10kHz step, USA)
 * @returns {number} Frequency in Hz
 */
SystemSettings.prototype.getAmFrequency = function() {
	var value = this.data['40'];
	if (value && value.length === 2) {
		var num = parseInt(value, 16);
		return ((num - 1) * 10) + 520;
	}
	return 520; // Default 520 kHz
};

/**
 * Set AM Frequency (10kHz step, USA)
 * @param {number} frequencyHz - Frequency in Hz
 * @returns {string} Command to send
 */
SystemSettings.prototype.setAmFrequency = function(frequencyHz) {
	var value = Math.max(1, Math.min(0x3E, Math.round((frequencyHz - 520) / 10) + 1));
	return 'S,S,40=' + format2(value.toString(16));
};

/**
 * Get AM Frequency (9kHz step, international)
 * @returns {number} Frequency in Hz
 */
SystemSettings.prototype.getAmFrequency9khz = function() {
	var value = this.data['41'];
	if (value && value.length === 2) {
		var num = parseInt(value, 16);
		return ((num - 1) * 9) + 522;
	}
	return 522; // Default 522 kHz
};

/**
 * Set AM Frequency (9kHz step, international)
 * @param {number} frequencyHz - Frequency in Hz
 * @returns {string} Command to send
 */
SystemSettings.prototype.setAmFrequency9khz = function(frequencyHz) {
	var value = Math.max(1, Math.min(0x2E, Math.round((frequencyHz - 522) / 9) + 1));
	return 'S,S,41=' + format2(value.toString(16));
};

/**
 * Get FM Frequency (200kHz step, USA)
 * @returns {number} Frequency in MHz
 */
SystemSettings.prototype.getFmFrequency = function() {
	var value = this.data['42'];
	if (value && value.length === 2) {
		var num = parseInt(value, 16);
		return 87.5 + (num - 1) * 0.20;
	}
	return 87.5; // Default 87.5 MHz
};

/**
 * Set FM Frequency (200kHz step, USA)
 * @param {number} frequencyMHz - Frequency in MHz
 * @returns {string} Command to send
 */
SystemSettings.prototype.setFmFrequency = function(frequencyMHz) {
	var value = Math.max(1, Math.min(0x5A, Math.round((frequencyMHz - 87.5) / 0.20) + 1));
	return 'S,S,42=' + format2(value.toString(16));
};

/**
 * Get FM Frequency (100kHz step, international)
 * @returns {number} Frequency in MHz
 */
SystemSettings.prototype.getFmFrequency100khz = function() {
	var value = this.data['43'];
	if (value && value.length === 2) {
		var num = parseInt(value, 16);
		return 87.5 + (num - 1) * 0.10;
	}
	return 87.5; // Default 87.5 MHz
};

/**
 * Set FM Frequency (100kHz step, international)
 * @param {number} frequencyMHz - Frequency in MHz
 * @returns {string} Command to send
 */
SystemSettings.prototype.setFmFrequency100khz = function(frequencyMHz) {
	var value = Math.max(1, Math.min(0x5A, Math.round((frequencyMHz - 87.5) / 0.10) + 1));
	return 'S,S,43=' + format2(value.toString(16));
};

/**
 * Get FM Mode
 * @returns {string} 'mono' or 'stereo'
 */
SystemSettings.prototype.getFmMode = function() {
	var value = this.data['44'];
	if (value && value.length === 2) {
		var num = parseInt(value, 16);
		return num === 1 ? 'stereo' : 'mono';
	}
	return 'mono';
};

/**
 * Set FM Mode
 * @param {string} mode - 'mono' or 'stereo'
 * @returns {string} Command to send
 */
SystemSettings.prototype.setFmMode = function(mode) {
	var value = mode === 'stereo' ? 1 : 0;
	return 'S,S,44=' + value;
};

/**
 * Format a number as 2-character uppercase hex string
 * @param {string|number} n - The number to format
 * @returns {string} 2-char uppercase hex (e.g., "00", "0A", "FF")
 */
function format2(n) {
	return ("00" + n.toString(16)).substr(-2).toUpperCase();
}