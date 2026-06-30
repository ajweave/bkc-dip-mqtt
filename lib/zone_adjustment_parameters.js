"use strict";
// Page 58 of CT_600X_20005.pdf

var ZoneAdjParameters = module.exports = function() {
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

ZoneAdjParameters.prototype.getZones = function() {
	// logical zones
	var zoneNumbers = this.data[UnitParameters.ACTIVE_LOGICAL_ZONE_NUMBERS].slice(1, -1).split(' ');
	var zones = [];
	for (var i = 0; i < zoneNumbers.length; i++) {
		zones[i] = {id: zoneNumbers[i]};
	}
	return zones;
};

ZoneAdjParameters.ZONE_A_EQ_BASS_GAIN = '00';
