//Page 58 of CT_600X_20005.pdf
ZoneAdjParameters = function() {
	this.data = {};
	this.process = function (parts) {
		var data = this.data
		parts.forEach(function (part) {
			pair = part.split('=');
			if (pair.length == 2) {
				data[pair[0]] = pair[1];
			}
		});
	};
	this.getZones = function() {
		//logical zones
		var zoneNumbers = this.data[UnitParameters.ACTIVE_LOGICAL_ZONE_NUMBERS].slice(1, -1).split(' ');
		var zones = [];
		for (var i = 0; i < zoneNumbers.length; i++) {
			zones[i] = {id: zoneNumbers[i]};
		}
		return zones;
	};
}

ZoneAdjParameters.ZONE_A_EQ_BASS_GAIN = '00';
