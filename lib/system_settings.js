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

/**
 * Format a number as 2-character uppercase hex string
 * @param {string|number} n - The number to format
 * @returns {string} 2-char uppercase hex (e.g., "00", "0A", "FF")
 */
function format2(n) {
	return ("00" + n.toString(16)).substr(-2).toUpperCase();
}