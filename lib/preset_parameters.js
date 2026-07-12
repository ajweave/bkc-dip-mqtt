"use strict";
// Page 7 of CT_600X_20005.pdf

var PresetParameters = module.exports = function(receiveId, zoneId, driver, systemSettings) {
	this.receiveId = receiveId;
	this.driver = driver;
	this.zoneId = zoneId;
	this.systemSettings = systemSettings;
	this.data = {};
};

PresetParameters.prototype.process = function(parts) {
	var data = this.data;
	var pair;
	parts.forEach(function(part) {
		pair = part.split('=');
		if (pair.length == 2) {
			data[pair[0]] = pair[1];
		}
	});
};

// 0h = power off, 1h = power on
PresetParameters.prototype.setPowerState = function(state) {
	var v = state == 'on' ? '1' : '0';
	console.log("Turning zone", this.zoneId, v == '1' ? 'on' : 'off');
	this.driver.send(this.receiveId, 'S,Z' + this.zoneId + ',24=' + v);
	this.driver.send(this.receiveId, 'G,Z' + this.zoneId + ',24=' + v);
};

PresetParameters.prototype.setPresetParameter = function(parameter, value) {
	console.log("Sending parameter", parameter);
	this.driver.send(this.receiveId, 'S,P' + this.zoneId + ',FF,' + parameter + '=' + value);
};

PresetParameters.prototype.getVolumeDb = function() {
	return this.bkVolumeToDb(this.data[PresetParameters.VOLUME]);
};

PresetParameters.prototype.setVolumeDb = function(db) {
	var v = this.dbVolumeToBk(db);
	console.log('db =', db, 'v =', v);
	this.driver.send(this.receiveId, 'S,P' + this.zoneId + ',FF,' + PresetParameters.VOLUME + '=' + v);
};

PresetParameters.prototype.getInput = function() {
	var inputId = this.data[PresetParameters.SOURCE_INPUT];
	if (this.systemSettings && inputId) {
		var inputs = this.systemSettings.getInputs();
		var input = inputs.find(function(i) { return i.id && i.id.toUpperCase() === inputId.toUpperCase(); });
		if (input) return input.title;
		console.log("Input ID " + inputId + " not found in inputs list");
	}
	return inputId || '';
};

PresetParameters.prototype.setInput = function(inputId) {
	this.driver.send(this.receiveId, 'S,P' + this.zoneId + ',FF,' + PresetParameters.SOURCE_INPUT + '=' + inputId);
};

PresetParameters.prototype.getLogicalZoneId = function() {
	return this.zoneId;
};

// Volume is -80db to 0db, 0x0 to 0x28 (0-40) in 2db steps.
PresetParameters.prototype.bkVolumeToDb = function(hex) {
	var x = parseInt(hex, 16);
	return this.scale(x, 0, 40, -80, 0);
};

PresetParameters.prototype.bkBassTrebleGainToDb = function(hex) {
	var x = parseInt(hex, 16);
	return this.scale(x, 0, 12, -12, 12);
};

PresetParameters.prototype.dbVolumeToBk = function(db) {
	if (typeof db == 'string') db = parseInt(db);
	db = db + (db % 2);
	return Math.abs(this.scale(db, -80, 0, 0, 40)).toString(16).toUpperCase();
};

PresetParameters.prototype.scale = function(value, frommin, frommax, tomin, tomax) {
	return ((tomax - tomin) * (value - frommin) / (frommax - frommin)) + tomin;
};

// Gain is -12db to +12db, 0x0 to 0xC (0-12) in 2db steps.
PresetParameters.prototype.eqDbtoBk = function(db) {
	if (typeof db == 'string') db = parseInt(db);
	db = db + (db % 2);
	return Math.abs(this.scale(db, -12, 12, 0, 12)).toString(16).toUpperCase();
};

PresetParameters.prototype.getBassGain = function() {
	return this.bkBassTrebleGainToDb(this.data[PresetParameters.BASS_LEVEL]);
};

PresetParameters.prototype.setBassGain = function(db) {
	this.setPresetParameter(PresetParameters.BASS_LEVEL, this.eqDbtoBk(db));
};

PresetParameters.prototype.getTrebleGain = function() {
	return this.bkBassTrebleGainToDb(this.data[PresetParameters.TREBLE_LEVEL]);
};

PresetParameters.prototype.setTrebleGain = function(db) {
	this.setPresetParameter(PresetParameters.TREBLE_LEVEL, this.eqDbtoBk(db));
};

// 0x00 = Off, 0x01 = On, 0x02 = Auto
PresetParameters.prototype.getLoudness = function() {
	var val = this.data[PresetParameters.EQUALIZATION];
	if (val == "01") return "on";
	if (val == "02") return "auto";
	return "off";
};

PresetParameters.prototype.setLoudness = function(state) {
	var v = state == "on" ? "1" : (state == "auto" ? "2" : "0");
	this.setPresetParameter(PresetParameters.EQUALIZATION, v);
};

PresetParameters.TITLE = '00';
PresetParameters.VOLUME = '01';
PresetParameters.SOURCE_INPUT = '05';
PresetParameters.AUDIO_INPUT = '06';
PresetParameters.VIDEO_INPUT = '07';
PresetParameters.BASS_LEVEL = '08';
PresetParameters.TREBLE_LEVEL = '09';
PresetParameters.EQUALIZATION = '0A';
PresetParameters.AM_FREQUENCY = '08';
PresetParameters.FM_FREQUENCY = '09';
PresetParameters.FM_MODE = '0A';
