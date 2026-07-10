"use strict";
// Page 24 of CT_600X_20005.pdf - Appendix E: Unit Parameters

var UnitParameters = module.exports = function() {
	this.data = {};
	this.zoneData = {};  // Store per-zone data including titles
};

UnitParameters.prototype.process = function(parts) {
	var data = this.data;
	parts.forEach(function(part) {
		var pair = part.split('=');
		if (pair.length == 2) {
			data[pair[0]] = pair[1];
		}
	});
};

/**
 * Process zone-specific parameters received from the unit.
 * Zone parameters are received as R,Z{zone} commands.
 * The data contains parameter=value pairs for that zone.
 * 
 * @param {string} zoneId - The zone identifier (e.g., '1', '2', etc.)
 * @param {Array<string>} parts - The parameter=value pairs for this zone
 */
UnitParameters.prototype.processZone = function(zoneId, parts) {
	if (!this.zoneData[zoneId]) {
		this.zoneData[zoneId] = {};
	}
	var zoneData = this.zoneData[zoneId];
	parts.forEach(function(part) {
		var pair = part.split('=');
		if (pair.length == 2) {
			zoneData[pair[0]] = pair[1];
		}
	});
};

/**
 * Get the list of active zones.
 * @returns {Array<{id: string, name: string}>} Array of zone objects with id and name
 */
UnitParameters.prototype.getZones = function() {
	// logical zones from system settings
	var zoneNumbers = this.data[UnitParameters.ACTIVE_LOGICAL_ZONE_NUMBERS];
	if (!zoneNumbers) {
		return [];
	}
	
	var zones = [];
	zoneNumbers.slice(1, -1).split(' ').forEach(function(zoneNum, index) {
		var zoneInfo = this.zoneData[zoneNum] || {};
		var zoneName = zoneInfo["00"] ? zoneInfo["00"].trim().replace(/"/g, "") : ("Zone " + zoneNum);
		zones.push({
			id: zoneNum,
			name: zoneName
		});
	}, this);
	
	return zones;
};

/**
 * Get the title/name of a specific zone.
 * @param {string} zoneId - The zone identifier
 * @returns {string} The zone title or default name
 */
UnitParameters.prototype.getZoneTitle = function(zoneId) {
	var zoneInfo = this.zoneData[zoneId] || {};
	return zoneInfo['00'] ? zoneInfo['00'].trim().replace(/"/g, '') : ('Zone ' + zoneId);
};

// Parameter identifiers from Appendix E (Unit Parameters)
UnitParameters.UNIT_NAME = '00';
UnitParameters.ACTIVE_LOGICAL_ZONE_NUMBERS = '12';
UnitParameters.NUMBER_OF_INPUTS = '13';
UnitParameters.NUMBER_OF_ZONES = '14';
UnitParameters.NUMBER_OF_DEDICATED_INPUTS = '15';
UnitParameters.NUMBER_OF_TUNERS = '16';
UnitParameters.NUMBER_OF_EXTERNAL_INPUTS = '1C';
UnitParameters.RECEIVE_ID = '1E';
UnitParameters.TRANSMIT_ID = '1F';
UnitParameters.GROUP_CODE_SET_LIST = '29';