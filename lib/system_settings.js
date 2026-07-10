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
 *   00 = Input 1 Title, 01 = Input 2 Title, ... 09 = Input 9 Title
 *   0A = Zone A IN Dedicated Title, 0B = Zone B IN Dedicated Title, etc.
 *   0C = Zone C IN Dedicated Title, 0D = Zone D IN Dedicated Title
 *   0E = Zone E IN Dedicated Title, 0F = Zone F IN Dedicated Title
 * 
 * The ID returned IS the hex value used in preset SOURCE_INPUT settings.
 * 
 * @returns {Array<{id: string, title: string}>} Array of input objects with hex ID and title
 */
SystemSettings.prototype.getInputs = function() {
	var data = this.data;
	var inputs = [];
	
	// Read input titles from system settings (hex offsets 00-0F = 16 inputs)
	// Default to "Input N" if no title is set
	for (var i = 0; i < 16; i++) {
		var hexId = format2(i.toString(16));
		var title = data[hexId];
		if (!title) {
			// Generate default title based on position
			if (i < 9) {
				title = "Input " + (i + 1);
			} else {
				var zones = ['A', 'B', 'C', 'D', 'E', 'F'];
				title = "Zone " + zones[i - 9] + " IN Dedicated";
			}
		}
		inputs.push({
			id: hexId,
			title: title
		});
	}
	
	return inputs;
};

/**
 * Format a number as 2-character uppercase hex string
 * @param {string|number} n - The number to format
 * @returns {string} 2-char uppercase hex (e.g., "00", "0A", "FF")
 */
function format2(n) {
	return ("00" + n.toString(16)).substr(-2).toUpperCase();
}