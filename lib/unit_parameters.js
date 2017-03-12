

//Page 24 of CT_600X_20005.pdf
UnitParameters = function() {
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