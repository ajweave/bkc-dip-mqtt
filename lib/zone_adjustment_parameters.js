"use strict";
// Page 58 of CT_600X_20005.pdf - Appendix R: Zone Adjustment Parameters

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

// Room EQ - Bass Gain (-12dB to +12dB)
ZoneAdjParameters.prototype.getRoomEqBassGain = function(zone) {
	var zoneNum = 'ABCDEF'.indexOf(zone.toUpperCase());
	var hexId = format2((0x70 + zoneNum).toString(16));
	var value = this.data[hexId];
	if (value) {
		return (parseInt(value, 16) - 12).toString(10);
	}
	return null;
};

ZoneAdjParameters.prototype.setRoomEqBassGain = function(zone, gainDb) {
	var zoneNum = 'ABCDEF'.indexOf(zone.toUpperCase());
	var hexId = format2((0x70 + zoneNum).toString(16));
	var value = Math.max(0, Math.min(0x18, Math.round(gainDb + 12)));
	console.log("Setting zone", zone, "Room EQ Bass Gain to", gainDb, "dB (hex:", value.toString(16).toUpperCase() + ")");
	this.driver.send(this.receiveId, 'S,H,' + hexId + '=' + value.toString(16).toUpperCase());
};

// Room EQ - Bass Frequency (20Hz to 20kHz)
ZoneAdjParameters.prototype.getRoomEqBassFrequency = function(zone) {
	var zoneNum = 'ABCDEF'.indexOf(zone.toUpperCase());
	var hexId = format2((0x71 + zoneNum).toString(16));
	var value = this.data[hexId];
	if (value) {
		return (parseInt(value, 16) * 100 + 20);
	}
	return null;
};

ZoneAdjParameters.prototype.setRoomEqBassFrequency = function(zone, frequencyHz) {
	var zoneNum = 'ABCDEF'.indexOf(zone.toUpperCase());
	var hexId = format2((0x71 + zoneNum).toString(16));
	var value = Math.max(0, Math.min(0x38, Math.round((frequencyHz - 20) / 100)));
	console.log("Setting zone", zone, "Room EQ Bass Frequency to", frequencyHz, "Hz (hex:", value.toString(16).toUpperCase() + ")");
	this.driver.send(this.receiveId, 'S,H,' + hexId + '=' + value.toString(16).toUpperCase());
};

// Room EQ - Treble Gain (-12dB to +12dB)
ZoneAdjParameters.prototype.getRoomEqTrebleGain = function(zone) {
	var zoneNum = 'ABCDEF'.indexOf(zone.toUpperCase());
	var hexId = format2((0x72 + zoneNum).toString(16));
	var value = this.data[hexId];
	if (value) {
		return (parseInt(value, 16) - 12).toString(10);
	}
	return null;
};

ZoneAdjParameters.prototype.setRoomEqTrebleGain = function(zone, gainDb) {
	var zoneNum = 'ABCDEF'.indexOf(zone.toUpperCase());
	var hexId = format2((0x72 + zoneNum).toString(16));
	var value = Math.max(0, Math.min(0x18, Math.round(gainDb + 12)));
	console.log("Setting zone", zone, "Room EQ Treble Gain to", gainDb, "dB (hex:", value.toString(16).toUpperCase() + ")");
	this.driver.send(this.receiveId, 'S,H,' + hexId + '=' + value.toString(16).toUpperCase());
};

// Room EQ - Treble Frequency (2kHz to 20kHz)
ZoneAdjParameters.prototype.getRoomEqTrebleFrequency = function(zone) {
	var zoneNum = 'ABCDEF'.indexOf(zone.toUpperCase());
	var hexId = format2((0x73 + zoneNum).toString(16));
	var value = this.data[hexId];
	if (value) {
		return (parseInt(value, 16) * 1000 + 2000);
	}
	return null;
};

ZoneAdjParameters.prototype.setRoomEqTrebleFrequency = function(zone, frequencyHz) {
	var zoneNum = 'ABCDEF'.indexOf(zone.toUpperCase());
	var hexId = format2((0x73 + zoneNum).toString(16));
	var value = Math.max(0, Math.min(0x18, Math.round((frequencyHz - 2000) / 1000)));
	console.log("Setting zone", zone, "Room EQ Treble Frequency to", frequencyHz, "Hz (hex:", value.toString(16).toUpperCase() + ")");
	this.driver.send(this.receiveId, 'S,H,' + hexId + '=' + value.toString(16).toUpperCase());
};

// Notch Filter 1 Gain (-12dB to +12dB)
ZoneAdjParameters.prototype.getNotch1Gain = function(zone) {
	var zoneNum = 'ABCDEF'.indexOf(zone.toUpperCase());
	var hexId = format2((0x6C + zoneNum * 0x13).toString(16));
	var value = this.data[hexId];
	if (value) {
		return (parseInt(value, 16) - 12).toString(10);
	}
	return null;
};

ZoneAdjParameters.prototype.setNotch1Gain = function(zone, gainDb) {
	var zoneNum = 'ABCDEF'.indexOf(zone.toUpperCase());
	var hexId = format2((0x6C + zoneNum * 0x13).toString(16));
	var value = Math.max(0, Math.min(0x19, Math.round(gainDb + 12)));
	console.log("Setting zone", zone, "Notch 1 Gain to", gainDb, "dB (hex:", value.toString(16).toUpperCase() + ")");
	this.driver.send(this.receiveId, 'S,H,' + hexId + '=' + value.toString(16).toUpperCase());
};

// Notch Filter 1 Frequency (20Hz to 20kHz)
ZoneAdjParameters.prototype.getNotch1Frequency = function(zone) {
	var zoneNum = 'ABCDEF'.indexOf(zone.toUpperCase());
	var hexId = format2((0x6C + zoneNum * 0x13 + 1).toString(16));
	var value = this.data[hexId];
	if (value) {
		return (parseInt(value, 16) * 100 + 20);
	}
	return null;
};

ZoneAdjParameters.prototype.setNotch1Frequency = function(zone, frequencyHz) {
	var zoneNum = 'ABCDEF'.indexOf(zone.toUpperCase());
	var hexId = format2((0x6C + zoneNum * 0x13 + 1).toString(16));
	var value = Math.max(0, Math.min(0x8C, Math.round((frequencyHz - 20) / 100)));
	console.log("Setting zone", zone, "Notch 1 Frequency to", frequencyHz, "Hz (hex:", value.toString(16).toUpperCase() + ")");
	this.driver.send(this.receiveId, 'S,H,' + hexId + '=' + value.toString(16).toUpperCase());
};

// Notch Filter 1 Width (Q factor)
ZoneAdjParameters.prototype.getNotch1Width = function(zone) {
	var zoneNum = 'ABCDEF'.indexOf(zone.toUpperCase());
	var hexId = format2((0x6C + zoneNum * 0x13 + 2).toString(16));
	var value = this.data[hexId];
	if (value) {
		return parseInt(value, 16);
	}
	return null;
};

ZoneAdjParameters.prototype.setNotch1Width = function(zone, width) {
	var zoneNum = 'ABCDEF'.indexOf(zone.toUpperCase());
	var hexId = format2((0x6C + zoneNum * 0x13 + 2).toString(16));
	var value = Math.max(0, Math.min(6, Math.round(width)));
	console.log("Setting zone", zone, "Notch 1 Width to", width, "Q (hex:", value.toString(16).toUpperCase() + ")");
	this.driver.send(this.receiveId, 'S,H,' + hexId + '=' + value.toString(16).toUpperCase());
};

// Notch Filter 2 Gain (-12dB to +12dB)
ZoneAdjParameters.prototype.getNotch2Gain = function(zone) {
	var zoneNum = 'ABCDEF'.indexOf(zone.toUpperCase());
	var hexId = format2((0x74 + zoneNum * 0x13).toString(16));
	var value = this.data[hexId];
	if (value) {
		return (parseInt(value, 16) - 12).toString(10);
	}
	return null;
};

ZoneAdjParameters.prototype.setNotch2Gain = function(zone, gainDb) {
	var zoneNum = 'ABCDEF'.indexOf(zone.toUpperCase());
	var hexId = format2((0x74 + zoneNum * 0x13).toString(16));
	var value = Math.max(0, Math.min(0x19, Math.round(gainDb + 12)));
	console.log("Setting zone", zone, "Notch 2 Gain to", gainDb, "dB (hex:", value.toString(16).toUpperCase() + ")");
	this.driver.send(this.receiveId, 'S,H,' + hexId + '=' + value.toString(16).toUpperCase());
};

// Notch Filter 2 Frequency (20Hz to 20kHz)
ZoneAdjParameters.prototype.getNotch2Frequency = function(zone) {
	var zoneNum = 'ABCDEF'.indexOf(zone.toUpperCase());
	var hexId = format2((0x74 + zoneNum * 0x13 + 1).toString(16));
	var value = this.data[hexId];
	if (value) {
		return (parseInt(value, 16) * 100 + 20);
	}
	return null;
};

ZoneAdjParameters.prototype.setNotch2Frequency = function(zone, frequencyHz) {
	var zoneNum = 'ABCDEF'.indexOf(zone.toUpperCase());
	var hexId = format2((0x74 + zoneNum * 0x13 + 1).toString(16));
	var value = Math.max(0, Math.min(0x8C, Math.round((frequencyHz - 20) / 100)));
	console.log("Setting zone", zone, "Notch 2 Frequency to", frequencyHz, "Hz (hex:", value.toString(16).toUpperCase() + ")");
	this.driver.send(this.receiveId, 'S,H,' + hexId + '=' + value.toString(16).toUpperCase());
};

// Notch Filter 2 Width (Q factor)
ZoneAdjParameters.prototype.getNotch2Width = function(zone) {
	var zoneNum = 'ABCDEF'.indexOf(zone.toUpperCase());
	var hexId = format2((0x74 + zoneNum * 0x13 + 2).toString(16));
	var value = this.data[hexId];
	if (value) {
		return parseInt(value, 16);
	}
	return null;
};

ZoneAdjParameters.prototype.setNotch2Width = function(zone, width) {
	var zoneNum = 'ABCDEF'.indexOf(zone.toUpperCase());
	var hexId = format2((0x74 + zoneNum * 0x13 + 2).toString(16));
	var value = Math.max(0, Math.min(6, Math.round(width)));
	console.log("Setting zone", zone, "Notch 2 Width to", width, "Q (hex:", value.toString(16).toUpperCase() + ")");
	this.driver.send(this.receiveId, 'S,H,' + hexId + '=' + value.toString(16).toUpperCase());
};

// Notch Filter 3 Gain (-12dB to +12dB)
ZoneAdjParameters.prototype.getNotch3Gain = function(zone) {
	var zoneNum = 'ABCDEF'.indexOf(zone.toUpperCase());
	var hexId = format2((0x7F + zoneNum * 0x13).toString(16));
	var value = this.data[hexId];
	if (value) {
		return (parseInt(value, 16) - 12).toString(10);
	}
	return null;
};

ZoneAdjParameters.prototype.setNotch3Gain = function(zone, gainDb) {
	var zoneNum = 'ABCDEF'.indexOf(zone.toUpperCase());
	var hexId = format2((0x7F + zoneNum * 0x13).toString(16));
	var value = Math.max(0, Math.min(0x19, Math.round(gainDb + 12)));
	console.log("Setting zone", zone, "Notch 3 Gain to", gainDb, "dB (hex:", value.toString(16).toUpperCase() + ")");
	this.driver.send(this.receiveId, 'S,H,' + hexId + '=' + value.toString(16).toUpperCase());
};

// Notch Filter 3 Frequency (20Hz to 20kHz)
ZoneAdjParameters.prototype.getNotch3Frequency = function(zone) {
	var zoneNum = 'ABCDEF'.indexOf(zone.toUpperCase());
	var hexId = format2((0x7F + zoneNum * 0x13 + 1).toString(16));
	var value = this.data[hexId];
	if (value) {
		return (parseInt(value, 16) * 100 + 20);
	}
	return null;
};

ZoneAdjParameters.prototype.setNotch3Frequency = function(zone, frequencyHz) {
	var zoneNum = 'ABCDEF'.indexOf(zone.toUpperCase());
	var hexId = format2((0x7F + zoneNum * 0x13 + 1).toString(16));
	var value = Math.max(0, Math.min(0x8C, Math.round((frequencyHz - 20) / 100)));
	console.log("Setting zone", zone, "Notch 3 Frequency to", frequencyHz, "Hz (hex:", value.toString(16).toUpperCase() + ")");
	this.driver.send(this.receiveId, 'S,H,' + hexId + '=' + value.toString(16).toUpperCase());
};

// Notch Filter 3 Width (Q factor)
ZoneAdjParameters.prototype.getNotch3Width = function(zone) {
	var zoneNum = 'ABCDEF'.indexOf(zone.toUpperCase());
	var hexId = format2((0x7F + zoneNum * 0x13 + 2).toString(16));
	var value = this.data[hexId];
	if (value) {
		return parseInt(value, 16);
	}
	return null;
};

ZoneAdjParameters.prototype.setNotch3Width = function(zone, width) {
	var zoneNum = 'ABCDEF'.indexOf(zone.toUpperCase());
	var hexId = format2((0x7F + zoneNum * 0x13 + 2).toString(16));
	var value = Math.max(0, Math.min(6, Math.round(width)));
	console.log("Setting zone", zone, "Notch 3 Width to", width, "Q (hex:", value.toString(16).toUpperCase() + ")");
	this.driver.send(this.receiveId, 'S,H,' + hexId + '=' + value.toString(16).toUpperCase());
};

// Helper function for formatting hex
function format2(n) {
	return ("00" + n.toString(16)).substr(-2).toUpperCase();
}

// Parameter IDs (from Appendix R)
ZoneAdjParameters.ACTIVE_LOGICAL_ZONE_NUMBERS = '10';