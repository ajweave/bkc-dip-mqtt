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
 * Based on Appendix A, page 7, Note 3: the SOURCE_INPUT hex value maps to a
 * fixed set of sources. This map is the single source of truth for both HA
 * discovery options and the title->id lookup in the MQTT handler.
 *
 *   0h=FM, 1h=AM, 2h=Dedicated, 3h=In1, 4h=In2, 5h=In3, 6h=In4, 7h=In5,
 *   8h=In6, 9h=In7, Ah=In8, Bh=In9
 *
 * The ID returned IS the hex value used in preset SOURCE_INPUT settings.
/**
 * Map a SOURCE_INPUT id (Appendix A Note 3) to the Appendix B offset that
 * holds its editable Input Title. Appendix B p.9-13: Input 1 Title = 00h,
 * Input 2 Title = 01h, ... Input 9 Title = 08h. FM(00)/AM(01)/Dedicated(02)
 * have no editable title field, so they are absent from this map.
 */
SystemSettings.INPUT_TITLE_OFFSET = {
	'03': '00', // In1  -> Input 1 Title
	'04': '01', // In2  -> Input 2 Title
	'05': '02', // In3  -> Input 3 Title
	'06': '03', // In4  -> Input 4 Title
	'07': '04', // In5  -> Input 5 Title
	'08': '05', // In6  -> Input 6 Title
	'09': '06', // In7  -> Input 7 Title
	'0A': '07', // In8  -> Input 8 Title
	'0B': '08'  // In9  -> Input 9 Title
};

SystemSettings.prototype.getInputs = function() {
	var data = this.data;
	return SystemSettings.SOURCE_INPUTS.map(function(src) {
		// Allow the unit's Appendix B Input Title to override the default
		// label. FM/AM/Dedicated have no editable title -> keep defaults.
		var titleOffset = SystemSettings.INPUT_TITLE_OFFSET[src.id];
		if (titleOffset) {
			var title = data[titleOffset];
			if (title && typeof title === "string" && title.indexOf('"') !== -1) {
				title = title.trim().replace(/^["']|["']$/g, "").trim();
				if (title) return { id: src.id, title: title };
			}
		}
		return { id: src.id, title: src.title };
	});
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

// ==========================================
// TUNER LEVEL SETTINGS (Appendix B)
// ==========================================

/**
 * Get Tuner Level for a specific zone
 * @param {string} zone - Zone letter (A-F)
 * @returns {number} Level value (0-255)
 */
SystemSettings.prototype.getTunerLevel = function(zone) {
	var zoneNum = 'ABCDEF'.indexOf(zone.toUpperCase());
	var hexId = format2((0x50 + zoneNum).toString(16));
	var value = this.data[hexId];
	if (value && value.length === 2) {
		return parseInt(value, 16);
	}
	return 0;
};

/**
 * Set Tuner Level for a specific zone
 * @param {string} zone - Zone letter (A-F)
 * @param {number} level - Level value (0-255)
 * @returns {string} Command to send
 */
SystemSettings.prototype.setTunerLevel = function(zone, level) {
	var zoneNum = 'ABCDEF'.indexOf(zone.toUpperCase());
	var hexId = format2((0x50 + zoneNum).toString(16));
	var value = Math.max(0, Math.min(0xFF, level));
	return 'S,S,' + hexId + '=' + format2(value.toString(16));
};

/**
 * Get Tuner Max Level for a specific zone
 * @param {string} zone - Zone letter (A-F)
 * @returns {number} Max level value (0-255)
 */
SystemSettings.prototype.getTunerMaxLevel = function(zone) {
	var zoneNum = 'ABCDEF'.indexOf(zone.toUpperCase());
	var hexId = format2((0x56 + zoneNum).toString(16));
	var value = this.data[hexId];
	if (value && value.length === 2) {
		return parseInt(value, 16);
	}
	return 255;
};

/**
 * Set Tuner Max Level for a specific zone
 * @param {string} zone - Zone letter (A-F)
 * @param {number} maxLevel - Max level value (0-255)
 * @returns {string} Command to send
 */
SystemSettings.prototype.setTunerMaxLevel = function(zone, maxLevel) {
	var zoneNum = 'ABCDEF'.indexOf(zone.toUpperCase());
	var hexId = format2((0x56 + zoneNum).toString(16));
	var value = Math.max(0, Math.min(0xFF, maxLevel));
	return 'S,S,' + hexId + '=' + format2(value.toString(16));
};

// ==========================================
// TUNER ASSIGNMENT (Appendix B)
// ==========================================

/**
 * Get Tuner Assignment for a specific zone
 * @param {string} zone - Zone letter (A-F)
 * @returns {string} 'fm', 'am', or 'dedicated'
 */
SystemSettings.prototype.getTunerAssignment = function(zone) {
	var zoneNum = 'ABCDEF'.indexOf(zone.toUpperCase());
	var hexId = format2((0x60 + zoneNum).toString(16));
	var value = this.data[hexId];
	if (value && value.length === 2) {
		var num = parseInt(value, 16);
		if (num === 0) return 'fm';
		if (num === 1) return 'am';
		return 'dedicated';
	}
	return 'dedicated';
};

/**
 * Set Tuner Assignment for a specific zone
 * @param {string} zone - Zone letter (A-F)
 * @param {string} assignment - 'fm', 'am', or 'dedicated'
 * @returns {string} Command to send
 */
SystemSettings.prototype.setTunerAssignment = function(zone, assignment) {
	var zoneNum = 'ABCDEF'.indexOf(zone.toUpperCase());
	var hexId = format2((0x60 + zoneNum).toString(16));
	var value;
	if (assignment === 'fm') value = 0;
	else if (assignment === 'am') value = 1;
	else value = 2; // dedicated
	return 'S,S,' + hexId + '=' + format2(value.toString(16));
};

// ==========================================
// MODE SETTINGS (Appendix B)
// ==========================================

/**
 * Get Mode for a specific zone
 * @param {string} zone - Zone letter (A-F)
 * @returns {string} Mode type
 */
SystemSettings.prototype.getMode = function(zone) {
	var zoneNum = 'ABCDEF'.indexOf(zone.toUpperCase());
	var hexId = format2((0x66 + zoneNum).toString(16));
	var value = this.data[hexId];
	// Return raw hex value for now - could be expanded based on mode types
	return value || '00';
};

/**
 * Set Mode for a specific zone
 * @param {string} zone - Zone letter (A-F)
 * @param {string} mode - Mode hex value
 * @returns {string} Command to send
 */
SystemSettings.prototype.setMode = function(zone, mode) {
	var zoneNum = 'ABCDEF'.indexOf(zone.toUpperCase());
	var hexId = format2((0x66 + zoneNum).toString(16));
	return 'S,S,' + hexId + '=' + format2(mode.toString(16));
};

// ==========================================
// PAGE/EVENT SELECTION (Appendix B)
// ==========================================

/**
 * Get Page/Event for a specific zone
 * @param {string} zone - Zone letter (A-F)
 * @returns {string} Page/Event hex value
 */
SystemSettings.prototype.getPageEvent = function(zone) {
	var zoneNum = 'ABCDEF'.indexOf(zone.toUpperCase());
	var hexId = format2((0x6C + zoneNum).toString(16));
	var value = this.data[hexId];
	return value || '00';
};

/**
 * Set Page/Event for a specific zone
 * @param {string} zone - Zone letter (A-F)
 * @param {string} pageEvent - Page/Event hex value
 * @returns {string} Command to send
 */
SystemSettings.prototype.setPageEvent = function(zone, pageEvent) {
	var zoneNum = 'ABCDEF'.indexOf(zone.toUpperCase());
	var hexId = format2((0x6C + zoneNum).toString(16));
	return 'S,S,' + hexId + '=' + format2(pageEvent.toString(16));
};

// ==========================================
// LEVEL CONTROLS (Appendix B)
// ==========================================

/**
 * Get Left Level for a specific zone
 * @param {string} zone - Zone letter (A-F)
 * @returns {number} Left level value (0-255)
 */
SystemSettings.prototype.getLeftLevel = function(zone) {
	var zoneNum = 'ABCDEF'.indexOf(zone.toUpperCase());
	var hexId = format2((0x72 + zoneNum).toString(16));
	var value = this.data[hexId];
	if (value && value.length === 2) {
		return parseInt(value, 16);
	}
	return 0;
};

/**
 * Set Left Level for a specific zone
 * @param {string} zone - Zone letter (A-F)
 * @param {number} level - Left level value (0-255)
 * @returns {string} Command to send
 */
SystemSettings.prototype.setLeftLevel = function(zone, level) {
	var zoneNum = 'ABCDEF'.indexOf(zone.toUpperCase());
	var hexId = format2((0x72 + zoneNum).toString(16));
	var value = Math.max(0, Math.min(0xFF, level));
	return 'S,S,' + hexId + '=' + format2(value.toString(16));
};

/**
 * Get Right Level for a specific zone
 * @param {string} zone - Zone letter (A-F)
 * @returns {number} Right level value (0-255)
 */
SystemSettings.prototype.getRightLevel = function(zone) {
	var zoneNum = 'ABCDEF'.indexOf(zone.toUpperCase());
	var hexId = format2((0x78 + zoneNum).toString(16));
	var value = this.data[hexId];
	if (value && value.length === 2) {
		return parseInt(value, 16);
	}
	return 0;
};

/**
 * Set Right Level for a specific zone
 * @param {string} zone - Zone letter (A-F)
 * @param {number} level - Right level value (0-255)
 * @returns {string} Command to send
 */
SystemSettings.prototype.setRightLevel = function(zone, level) {
	var zoneNum = 'ABCDEF'.indexOf(zone.toUpperCase());
	var hexId = format2((0x78 + zoneNum).toString(16));
	var value = Math.max(0, Math.min(0xFF, level));
	return 'S,S,' + hexId + '=' + format2(value.toString(16));
};

// ==========================================
// MAX LEVEL CONTROLS (Appendix B)
// ==========================================

/**
 * Get Left Max Level for a specific zone
 * @param {string} zone - Zone letter (A-F)
 * @returns {number} Left max level value (0-255)
 */
SystemSettings.prototype.getLeftMaxLevel = function(zone) {
	var zoneNum = 'ABCDEF'.indexOf(zone.toUpperCase());
	var hexId = format2((0x84 + zoneNum).toString(16));
	var value = this.data[hexId];
	if (value && value.length === 2) {
		return parseInt(value, 16);
	}
	return 255;
};

/**
 * Set Left Max Level for a specific zone
 * @param {string} zone - Zone letter (A-F)
 * @param {number} maxLevel - Left max level value (0-255)
 * @returns {string} Command to send
 */
SystemSettings.prototype.setLeftMaxLevel = function(zone, maxLevel) {
	var zoneNum = 'ABCDEF'.indexOf(zone.toUpperCase());
	var hexId = format2((0x84 + zoneNum).toString(16));
	var value = Math.max(0, Math.min(0xFF, maxLevel));
	return 'S,S,' + hexId + '=' + format2(value.toString(16));
};

/**
 * Get Right Max Level for a specific zone
 * @param {string} zone - Zone letter (A-F)
 * @returns {number} Right max level value (0-255)
 */
SystemSettings.prototype.getRightMaxLevel = function(zone) {
	var zoneNum = 'ABCDEF'.indexOf(zone.toUpperCase());
	var hexId = format2((0x8A + zoneNum).toString(16));
	var value = this.data[hexId];
	if (value && value.length === 2) {
		return parseInt(value, 16);
	}
	return 255;
};

/**
 * Set Right Max Level for a specific zone
 * @param {string} zone - Zone letter (A-F)
 * @param {number} maxLevel - Right max level value (0-255)
 * @returns {string} Command to send
 */
SystemSettings.prototype.setRightMaxLevel = function(zone, maxLevel) {
	var zoneNum = 'ABCDEF'.indexOf(zone.toUpperCase());
	var hexId = format2((0x8A + zoneNum).toString(16));
	var value = Math.max(0, Math.min(0xFF, maxLevel));
	return 'S,S,' + hexId + '=' + format2(value.toString(16));
};

// ==========================================
// CONTROL OUTPUTS (Appendix B)
// ==========================================

/**
 * Get Control Out for a specific zone
 * @param {string} zone - Zone letter (A-F)
 * @returns {number} Control out value (0-255)
 */
SystemSettings.prototype.getControlOut = function(zone) {
	var zoneNum = 'ABCDEF'.indexOf(zone.toUpperCase());
	var hexId = format2((0x96 + zoneNum).toString(16));
	var value = this.data[hexId];
	if (value && value.length === 2) {
		return parseInt(value, 16);
	}
	return 0;
};

/**
 * Set Control Out for a specific zone
 * @param {string} zone - Zone letter (A-F)
 * @param {number} value - Control out value (0-255)
 * @returns {string} Command to send
 */
SystemSettings.prototype.setControlOut = function(zone, value) {
	var zoneNum = 'ABCDEF'.indexOf(zone.toUpperCase());
	var hexId = format2((0x96 + zoneNum).toString(16));
	value = Math.max(0, Math.min(0xFF, value));
	return 'S,S,' + hexId + '=' + format2(value.toString(16));
};

/**
 * Get Control Out Selected for a specific zone
 * @param {string} zone - Zone letter (A-F)
 * @returns {number} Control out selected value (0-255)
 */
SystemSettings.prototype.getControlOutSelected = function(zone) {
	var zoneNum = 'ABCDEF'.indexOf(zone.toUpperCase());
	var hexId = format2((0x9C + zoneNum).toString(16));
	var value = this.data[hexId];
	if (value && value.length === 2) {
		return parseInt(value, 16);
	}
	return 0;
};

/**
 * Set Control Out Selected for a specific zone
 * @param {string} zone - Zone letter (A-F)
 * @param {number} value - Control out selected value (0-255)
 * @returns {string} Command to send
 */
SystemSettings.prototype.setControlOutSelected = function(zone, value) {
	var zoneNum = 'ABCDEF'.indexOf(zone.toUpperCase());
	var hexId = format2((0x9C + zoneNum).toString(16));
	value = Math.max(0, Math.min(0xFF, value));
	return 'S,S,' + hexId + '=' + format2(value.toString(16));
};

/**
 * Get Common Control Out 1
 * @returns {number} Common control 1 value (0-255)
 */
SystemSettings.prototype.getCommonControl1 = function() {
	var value = this.data['A2'];
	if (value && value.length === 2) {
		return parseInt(value, 16);
	}
	return 0;
};

/**
 * Set Common Control Out 1
 * @param {number} value - Common control 1 value (0-255)
 * @returns {string} Command to send
 */
SystemSettings.prototype.setCommonControl1 = function(value) {
	value = Math.max(0, Math.min(0xFF, value));
	return 'S,S,A2=' + format2(value.toString(16));
};

/**
 * Get Common Control Out 2
 * @returns {number} Common control 2 value (0-255)
 */
SystemSettings.prototype.getCommonControl2 = function() {
	var value = this.data['A8'];
	if (value && value.length === 2) {
		return parseInt(value, 16);
	}
	return 0;
};

/**
 * Set Common Control Out 2
 * @param {number} value - Common control 2 value (0-255)
 * @returns {string} Command to send
 */
SystemSettings.prototype.setCommonControl2 = function(value) {
	value = Math.max(0, Math.min(0xFF, value));
	return 'S,S,A8=' + format2(value.toString(16));
};

// ==========================================
// CODE SET IDs (Appendix B)
// ==========================================

/**
 * Get Group Code Set ID for a specific group
 * @param {string} group - Group letter (a-z)
 * @returns {string} Code set ID hex value
 */
SystemSettings.prototype.getCodeSetId = function(group) {
	var groupNum = 'abcdefghijklmnopqrstuvwxyz'.indexOf(group.toLowerCase());
	if (groupNum < 0 || groupNum > 25) return '00';
	var hexId = format2((0xAE + groupNum).toString(16));
	var value = this.data[hexId];
	return value || '00';
};

/**
 * Set Group Code Set ID for a specific group
 * @param {string} group - Group letter (a-z)
 * @param {string} codeSetId - Code set ID hex value
 * @returns {string} Command to send
 */
SystemSettings.prototype.setCodeSetId = function(group, codeSetId) {
	var groupNum = 'abcdefghijklmnopqrstuvwxyz'.indexOf(group.toLowerCase());
	if (groupNum < 0 || groupNum > 25) return '';
	var hexId = format2((0xAE + groupNum).toString(16));
	return 'S,S,' + hexId + '=' + codeSetId.toUpperCase();
};

// ==========================================
// REAR REMOTE INPUTS (Appendix B)
// ==========================================

/**
 * Get Rear Remote In Setting for a specific zone
 * @param {string} zone - Zone letter (A-F)
 * @returns {number} Rear remote value (0-255)
 */
SystemSettings.prototype.getRearRemote = function(zone) {
	var zoneNum = 'ABCDEF'.indexOf(zone.toUpperCase());
	var hexId = format2((0xC0 + zoneNum).toString(16));
	var value = this.data[hexId];
	if (value && value.length === 2) {
		return parseInt(value, 16);
	}
	return 0;
};

/**
 * Set Rear Remote In Setting for a specific zone
 * @param {string} zone - Zone letter (A-F)
 * @param {number} value - Rear remote value (0-255)
 * @returns {string} Command to send
 */
SystemSettings.prototype.setRearRemote = function(zone, value) {
	var zoneNum = 'ABCDEF'.indexOf(zone.toUpperCase());
	var hexId = format2((0xC0 + zoneNum).toString(16));
	value = Math.max(0, Math.min(0xFF, value));
	return 'S,S,' + hexId + '=' + format2(value.toString(16));
};

// ==========================================
// OTHER SYSTEM SETTINGS (Appendix B)
// ==========================================

/**
 * Get Flasher Out setting
 * @returns {number} Flasher out value (0-255)
 */
SystemSettings.prototype.getFlasherOut = function() {
	var value = this.data['CA'];
	if (value && value.length === 2) {
		return parseInt(value, 16);
	}
	return 0;
};

/**
 * Set Flasher Out setting
 * @param {number} value - Flasher out value (0-255)
 * @returns {string} Command to send
 */
SystemSettings.prototype.setFlasherOut = function(value) {
	value = Math.max(0, Math.min(0xFF, value));
	return 'S,S,CA=' + format2(value.toString(16));
};

/**
 * Get RS-232 Control Out setting
 * @returns {number} RS-232 control value (0-255)
 */
SystemSettings.prototype.getRs232Control = function() {
	var value = this.data['CB'];
	if (value && value.length === 2) {
		return parseInt(value, 16);
	}
	return 0;
};

/**
 * Set RS-232 Control Out setting
 * @param {number} value - RS-232 control value (0-255)
 * @returns {string} Command to send
 */
SystemSettings.prototype.setRs232Control = function(value) {
	value = Math.max(0, Math.min(0xFF, value));
	return 'S,S,CB=' + format2(value.toString(16));
};

/**
 * Get System Name
 * @returns {string} System name
 */
SystemSettings.prototype.getSystemName = function() {
	var value = this.data['00'];
	if (value && value.length > 0) {
		return value.replace(/^["']|["']$/g, "").trim();
	}
	return '';
};

/**
 * Set System Name
 * @param {string} name - System name
 * @returns {string} Command to send
 */
SystemSettings.prototype.setSystemName = function(name) {
	return 'S,S,00="' + name + '"';
};

/**
 * Format a number as 2-character uppercase hex string
 * @param {string|number} n - The number to format
 * @returns {string} 2-char uppercase hex (e.g., "00", "0A", "FF")
 */
function format2(n) {
	return ("00" + n.toString(16)).substr(-2).toUpperCase();
}