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
			title: (title || "").trim().replace(/^["\']|["\']$/g, "").trim()
		});
	}
	
	return inputs;
};

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

/**
 * Format a number as 2-character uppercase hex string
 * @param {string|number} n - The number to format
 * @returns {string} 2-char uppercase hex (e.g., "00", "0A", "FF")
 */
function format2(n) {
	return ("00" + n.toString(16)).substr(-2).toUpperCase();
}