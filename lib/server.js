/**
* Monitor messages:
* $ mosquitto_sub -v -t devices/audio-zone/# -T "*set"
*
* TODO:
* REFACTOR!
* Control tuners
* Control EQ
* Improve logging
* Make configurable
**/
"use strict";
var SystemSettings = require('./system_settings.js');
var UnitParameters = require('./unit_parameters.js');
var PresetParameters = require('./preset_parameters.js');
var ZoneAdjParameters = require('./zone_adjustment_parameters.js');
var HomeAssistant = require('./home_assistant.js');
var DIP = require('./bkc-dip.js');

var Driver;
var MQTT = require('mqtt');
var mqtt;

var unitParametersReceived = false;
var zoneCount = 0;
var command, parts, inputs, pair;
// Per-zone Appendix R (Zone Adjustment) parameter store
var ZONE_ADJ_PARAMETERS = {};
// Set DEBUG=1 to enable verbose per-frame / per-message logging.
var DEBUG = process.env.DEBUG === '1' || process.env.DEBUG === 'true';

module.exports.start = function(driver, broker, hostOrDevice) {
	console.log("Audiophile version!!!!");
	if (driver == 'net') {
		Driver = require('./net.js');
		Driver.open(hostOrDevice, 23, discover, onReceive);
	}
	else {
		Driver = require('./serial.js');
		Driver.open(hostOrDevice, discover, onReceive);
	}
	mqtt = MQTT.connect(broker, {
		protocolId: 'MQIsdp',
		protocolVersion: 3,
	        //username: config.mqttUser,
                //password: new Buffer(config.mqttPw)	
		});

	mqtt.on('connect', function () {
		console.log('MQTT CONNECT');
	});

	mqtt.on('close', function () {
		console.log('MQTT close');
	});

	mqtt.on('reconnect', function () {
		console.log('MQTT reconnect');
	});

	mqtt.on('error', function (error) {
		console.log('MQTT ERROR: ', error);
	});

	mqtt.on('message', function (topic, message) {
		// message is Buffer
		console.log('<MQTT', message.toString() + ' on ' + topic);
		var m = /^.*\/audio-zone\/([^/]+)\/(.+)\/set/.exec(topic)
		//console.log(m);
		if (m != null) {
			var zoneId = m[1];
			var sub = m[2]; // e.g. 'input', 'volume', 'room-eq/bass-gain', 'notch/1/gain', 'system/flasher-out'
			console.log('setting zone', zoneId, sub, 'to', message.toString());

			// System-wide pseudo-zone: not a PresetParameters zone.
			if (zoneId === 'system') {
				handleSystemCommand(sub, message.toString());
				return;
			}

			var zone = PRESET_PARAMETERS[zoneId];
			if (!zone) {
				console.log("Zone " + zoneId + " not found");
				return;
			}

			var segs = sub.split('/');

			if (segs[0] == 'input') {
                                        var inputTitle = message.toString().trim();
				var inputs = SYSTEM_SETTINGS.getInputs();
				var inputId;

				// First check if it's a valid input ID (hex format 00-0F)
				var validId = /^[0-9A-Fa-f]{2}$/.test(inputTitle);
				if (validId) {
					// Check if this ID exists in inputs
					var foundById = inputs.find(function(i) { return i.id === inputTitle.toUpperCase(); });
					if (foundById) {
						inputId = foundById.id;
					}
				}

				// If not a valid ID, try matching by title
				if (!inputId) {
					var foundByTitle = inputs.find(function(input) {
					    return input.title.trim().toLowerCase() === inputTitle.trim().toLowerCase();
					});
					if (foundByTitle) {
						inputId = foundByTitle.id;
					}
					// Fallback: handle "IN N" format by parsing the number.
					// Appendix A Note 3: In1=03h .. In9=0Bh, so InN -> (N+2).
					if (!inputId) {
						var inMatch = inputTitle.match(/^IN\s*(\d+)$/i);
						if (inMatch) {
							var inputNum = parseInt(inMatch[1], 10);
							if (inputNum >= 1 && inputNum <= 9) {
								inputId = format2((inputNum + 2).toString(16));
							}
						}
					}
				}

				if (!inputId) {
					console.log("Invalid input: " + inputTitle);
					console.log("Available inputs:", inputs.map(i => i.id + '=(' + i.title + ')').join(', '));
					return;
				}

				console.log("Setting zone", zoneId, "input to", inputId, "(" + inputTitle + ")");
				zone.setInput(inputId);
				readCurrentPresets(zone.getLogicalZoneId());
			}
			else if (segs[0] == 'volume') {
				// HA sends 0-100 %; internal model is dB. Convert at boundary.
				var db = zone.percentToDb(message.toString());
				zone.setVolumeDb(db);
				readCurrentPresets(zone.getLogicalZoneId());
			}
			else if (segs[0] == 'power-state') {
				zone.setPowerState(message.toString());
			}
			else if (segs[0] == 'bass') {
				zone.setBassGain(message.toString());
			}
			else if (segs[0] == 'treble') {
				zone.setTrebleGain(message.toString());
			}
			else if (segs[0] == 'loudness') {
				zone.setLoudness(message.toString());
			}
			else if (segs[0] == 'room-eq') {
				var zp = getZoneAdj(zoneId);
				var kind = segs[1]; // 'bass-gain', 'bass-frequency', 'treble-gain', 'treble-frequency'
				if (kind === 'bass-gain') zp.setRoomEqBassGain(zoneId, parseFloat(message.toString()));
				else if (kind === 'bass-frequency') zp.setRoomEqBassFrequency(zoneId, parseFloat(message.toString()));
				else if (kind === 'treble-gain') zp.setRoomEqTrebleGain(zoneId, parseFloat(message.toString()));
				else if (kind === 'treble-frequency') zp.setRoomEqTrebleFrequency(zoneId, parseFloat(message.toString()));
				else { console.log('Unknown room-eq param', kind); return; }
				Driver.send(receiveId, 'G,H' + zoneId + '=FF');
			}
			else if (segs[0] == 'notch') {
				var zp2 = getZoneAdj(zoneId);
				var notchNum = parseInt(segs[1], 10);
				var nkind = segs[2]; // 'gain', 'frequency', 'width'
				if (nkind === 'gain') zp2.setNotchGain(notchNum, zoneId, parseFloat(message.toString()));
				else if (nkind === 'frequency') zp2.setNotchFrequency(notchNum, zoneId, parseFloat(message.toString()));
				else if (nkind === 'width') zp2.setNotchWidth(notchNum, zoneId, parseFloat(message.toString()));
				else { console.log('Unknown notch param', nkind); return; }
				Driver.send(receiveId, 'G,H' + zoneId + '=FF');
			}
			else if (segs[0] == 'tuner') {
				var tkind = segs[1]; // 'fm-mode', 'level', 'max-level', 'am-frequency', 'fm-frequency'
				if (tkind === 'fm-mode') SYSTEM_SETTINGS.setFmMode(message.toString());
				else if (tkind === 'level') SYSTEM_SETTINGS.setTunerLevel(zoneId, parseInt(message.toString(), 10));
				else if (tkind === 'max-level') SYSTEM_SETTINGS.setTunerMaxLevel(zoneId, parseInt(message.toString(), 10));
				else { console.log('Unknown tuner param', tkind); return; }
				Driver.send(receiveId, 'G,S');
			}
			else if (segs[0] == 'left-level') { SYSTEM_SETTINGS.setLeftLevel(zoneId, parseInt(message.toString(), 10)); Driver.send(receiveId, 'G,S'); }
			else if (segs[0] == 'right-level') { SYSTEM_SETTINGS.setRightLevel(zoneId, parseInt(message.toString(), 10)); Driver.send(receiveId, 'G,S'); }
			else if (segs[0] == 'left-max-level') { SYSTEM_SETTINGS.setLeftMaxLevel(zoneId, parseInt(message.toString(), 10)); Driver.send(receiveId, 'G,S'); }
			else if (segs[0] == 'right-max-level') { SYSTEM_SETTINGS.setRightMaxLevel(zoneId, parseInt(message.toString(), 10)); Driver.send(receiveId, 'G,S'); }
			else {
				console.log('Unknown parameter ', sub);
			}
		}
	});

	// Lazily create/return the per-zone Appendix R parameter object.
	function getZoneAdj(zoneId) {
		if (!ZONE_ADJ_PARAMETERS[zoneId]) {
			ZONE_ADJ_PARAMETERS[zoneId] = new ZoneAdjParameters(receiveId, Driver);
		}
		return ZONE_ADJ_PARAMETERS[zoneId];
	}

	// Handle commands addressed to the system-wide pseudo-zone.
	function handleSystemCommand(sub, value) {
		if (sub === 'flasher-out') { SYSTEM_SETTINGS.setFlasherOut(parseInt(value, 10)); }
		else if (sub === 'rs232-control') { SYSTEM_SETTINGS.setRs232Control(parseInt(value, 10)); }
		else if (sub === 'name') { SYSTEM_SETTINGS.setSystemName(value); }
		else { console.log('Unknown system param', sub); return; }
		Driver.send(receiveId, 'G,S');
	}
}

//Discover zones & create topics
//B&K abstracts physical zones and logical zones into groups, for our purposes zones we advertise are actually groups in B&K terms.
//Commands must have trailing ';' before closing ) even when not sending checksum
var receiveId = '00';

this.format2 = function(n) {
	return ("00" + n.toString(16)).substr(-2).toUpperCase();
}

var SYSTEM_SETTINGS = new SystemSettings();
var UNIT_PARAMETERS = new UnitParameters();

//Map of presets for each zone
var PRESET_PARAMETERS = {};

/**
 * Split a BKC-DIP message string on a delimiter, respecting double-quoted
 * substrings. Backslash-escaped quotes (\") inside a quoted region are
 * treated as literal quote characters and do not end the region.
 *
 * Delimiters inside quoted sections are kept verbatim in the current token.
 */
function splitRespectingQuotes(str, delimiter) {
	var parts = [];
	var current = '';
	var inQuotes = false;
	var escaped = false;
	for (var i = 0; i < str.length; i++) {
		var ch = str[i];
		if (escaped) {
			current += ch;
			escaped = false;
			continue;
		}
		if (ch == '\\' && inQuotes) {
			escaped = true;
			continue;
		}
		if (ch == '"') {
			inQuotes = !inQuotes;
			current += ch;
			continue;
		}
		if (ch == delimiter && !inQuotes) {
			parts.push(current);
			current = '';
			continue;
		}
		current += ch;
	}
	parts.push(current);
	return parts;
}

//Page 9
function SystemParameters() {}
function discover() {
	var commands = [
	 'G,F4', //get unit parameters
	 'G,S',   //get system settings
	 'G,H'    //get zone adjustment (Appendix R) parameters
	];
	
	commands.forEach(function(command) {
		Driver.send('FF', command)
	});	
}

// Read Appendix R (Zone Adjustment) parameters for every zone
function readZoneAdjustment() {
	var zones = UNIT_PARAMETERS.getZones();
	zones.forEach(function(zone) {
		if (!ZONE_ADJ_PARAMETERS[zone.id]) {
			ZONE_ADJ_PARAMETERS[zone.id] = new ZoneAdjParameters(receiveId, Driver);
		}
		// (0,G,H00FF; — current values for zone
		Driver.send(receiveId, 'G,H' + zone.id + '=FF');
	});
}

function readCurrentPresets(zone) {
	var zones = zone ? [{id: zone}] : UNIT_PARAMETERS.getZones();
	zones.forEach(function(zone) {
		//(0,G,P<zoneid>=FF
		//         |     ^-- FF=current values
		//         --------- zoneid = logical zone id
		//console.log('zone=', zone);
		command = 'G,P' + zone.id + '=FF';
		Driver.send(receiveId, command);
	});
}

function readZoneParameters() {
	var zones = UNIT_PARAMETERS.getZones();
	zones.forEach(function(zone) {
		command = 'G,Z' + zone.id;
		Driver.send(receiveId, command);
	});
}

//Publish zone Room EQ / Notch (Appendix R) values
function publishZoneAdj(zoneId) {
	var zp = ZONE_ADJ_PARAMETERS[zoneId];
	if (!zp) return;
	var base = 'devices/audio-zone/' + zoneId + '/';
	mqtt.publish(base + 'room-eq/bass-gain/get', String(zp.getRoomEqBassGain(zoneId)), {retain: true});
	mqtt.publish(base + 'room-eq/bass-frequency/get', String(zp.getRoomEqBassFrequency(zoneId)), {retain: true});
	mqtt.publish(base + 'room-eq/treble-gain/get', String(zp.getRoomEqTrebleGain(zoneId)), {retain: true});
	mqtt.publish(base + 'room-eq/treble-frequency/get', String(zp.getRoomEqTrebleFrequency(zoneId)), {retain: true});
	for (var n = 1; n <= 3; n++) {
		mqtt.publish(base + 'notch/' + n + '/gain/get', String(zp.getNotchGain(n, zoneId)), {retain: true});
		mqtt.publish(base + 'notch/' + n + '/frequency/get', String(zp.getNotchFrequency(n, zoneId)), {retain: true});
		mqtt.publish(base + 'notch/' + n + '/width/get', String(zp.getNotchWidth(n, zoneId)), {retain: true});
	}
}

//Publish tuner / level / system sensor values read from system settings
function publishSystemAndTuner() {
	var zones = UNIT_PARAMETERS.getZones();
	zones.forEach(function(zone) {
		var base = 'devices/audio-zone/' + zone.id + '/';
		mqtt.publish(base + 'tuner/am-frequency/get', String(SYSTEM_SETTINGS.getAmFrequency()), {retain: true});
		mqtt.publish(base + 'tuner/fm-frequency/get', String(SYSTEM_SETTINGS.getFmFrequency()), {retain: true});
		mqtt.publish(base + 'tuner/fm-mode/get', SYSTEM_SETTINGS.getFmMode() === '01' ? 'stereo' : 'mono', {retain: true});
		mqtt.publish(base + 'tuner/level/get', String(SYSTEM_SETTINGS.getTunerLevel(zone.id)), {retain: true});
		mqtt.publish(base + 'tuner/max-level/get', String(SYSTEM_SETTINGS.getTunerMaxLevel(zone.id)), {retain: true});
		mqtt.publish(base + 'left-level/get', String(SYSTEM_SETTINGS.getLeftLevel(zone.id)), {retain: true});
		mqtt.publish(base + 'right-level/get', String(SYSTEM_SETTINGS.getRightLevel(zone.id)), {retain: true});
		mqtt.publish(base + 'left-max-level/get', String(SYSTEM_SETTINGS.getLeftMaxLevel(zone.id)), {retain: true});
		mqtt.publish(base + 'right-max-level/get', String(SYSTEM_SETTINGS.getRightMaxLevel(zone.id)), {retain: true});
	});
	mqtt.publish('devices/audio-zone/system/flasher-out/get', String(SYSTEM_SETTINGS.getFlasherOut()), {retain: true});
	mqtt.publish('devices/audio-zone/system/rs232-control/get', String(SYSTEM_SETTINGS.getRs232Control()), {retain: true});
	mqtt.publish('devices/audio-zone/system/name/get', SYSTEM_SETTINGS.getSystemName(), {retain: true});
}

//Publish zone current preset
function publishZonePreset(preset) {
	mqtt.publish('devices/audio-zone/' + preset.zoneId + '/input/get', preset.getInput(), {retain: true});
	mqtt.publish('devices/audio-zone/' + preset.zoneId + '/volume/get', preset.dbToPercent(preset.getVolumeDb()).toString(10), {retain: true});
	mqtt.publish('devices/audio-zone/' + preset.zoneId + '/bass/get', preset.getBassGain().toString(10), {retain: true});
	mqtt.publish('devices/audio-zone/' + preset.zoneId + '/treble/get', preset.getTrebleGain().toString(10), {retain: true});
	mqtt.publish('devices/audio-zone/' + preset.zoneId + '/loudness/get', preset.getLoudness(), {retain: true});
	// Publish current input state
	var inputs = SYSTEM_SETTINGS.getInputs();
	var currentInput = inputs.find(function(i) { return i.title === preset.getInput(); });
	if (currentInput) {
		console.log("Zone", preset.zoneId, "input:", currentInput.title);
	}
}

function publishInputs() {
	inputs = SYSTEM_SETTINGS.getInputs();
	UNIT_PARAMETERS.getZones().forEach(function(zone) {
		mqtt.publish('devices/audio-zone/' + zone.id + '/inputs', JSON.stringify(inputs), {retain: true});
	});
}

function onReceive(data) {
	data = data.toString().trim();
    if (DEBUG) console.log('<', data);
    // Validate checksum when present. BKC-DIP frame format is (data;CHECKSUM)
    // — the checksum (4 hex) is the last field, preceded by ';'. The unit
    // computes it over "(data;" (i.e. from '(' through and including ';').
    // DIP.calculateChecksum(input) returns sum(input + ';') mod 65536, so we
    // pass the substring from the optional '(' up to and INCLUDING the ';'.
    // Frames without a trailing 4-hex checksum are logged but still processed
    // (defensive — some unit modes omit it).
    var checksumMatch = data.match(/;([0-9A-Fa-f]{4})\(?\)?$/);
    if (checksumMatch) {
        var receivedChecksum = checksumMatch[1].toUpperCase();
        // --- NON-FATAL checksum check (diagnostic only) ---
        // The frame is "...;CHECKSUM". We log candidates so we can determine
        // exactly what byte range the unit actually sums. Never drop the frame.
        var lastSemi = data.lastIndexOf(';');
        var firstSemi = data.indexOf(';');
        var paren = data.indexOf('(');
        var closeParen = data.indexOf(')');
        var hasInternalSemi = (firstSemi !== lastSemi);
        // Candidate regions (all exclusive of the trailing ';'):
        var regionFromStart = data.substring(0, lastSemi);                 // 0 .. last ';'
        var regionFromParen = (paren >= 0) ? data.substring(paren, lastSemi) : null; // '(' .. last ';'
        var regionFromParenPlus1 = (paren >= 0) ? data.substring(paren + 1, lastSemi) : null;
        var cands = { '0..lastSemi': DIP.calculateChecksum(regionFromStart) };
        if (regionFromParen !== null) cands['paren..lastSemi'] = DIP.calculateChecksum(regionFromParen);
        if (regionFromParenPlus1 !== null) cands['paren+1..lastSemi'] = DIP.calculateChecksum(regionFromParenPlus1);
        console.log('[checksum] frame len=' + data.length +
            ' received=' + receivedChecksum +
            ' paren=' + paren + ' closeParen=' + closeParen +
            ' firstSemi=' + firstSemi + ' lastSemi=' + lastSemi +
            ' internalSemi=' + hasInternalSemi +
            ' candidates=' + JSON.stringify(cands));
    } else {
        if (DEBUG) console.log("No trailing checksum in message: " + JSON.stringify(data));
    }
    parts = splitRespectingQuotes(data, ',');
    if (parts.length == 0) {
        console.log("Unrecognized message");
        return;
    }
    parts.shift();
    var command = parts.shift();
    var command_spec = parts.shift();
    if (DEBUG) console.log('command = %s spec = %s', command, command_spec);
    if (parts[parts.length - 1].indexOf(';') > -1) {
        parts[parts.length - 1] = parts[parts.length - 1].split(';')[0];
    }
    //   parts.forEach(function(part) {
     //  console.log('->', part);
     // });
    if (command == 'R' && command_spec == 'F4') {  //Unit parameters reply
		//This reply is being triggered often, not sure why.  Only look at the first one.
		if (unitParametersReceived) return;
		UNIT_PARAMETERS.process(parts);
		mqtt.subscribe('devices/audio-zone/+/+/set');
		readZoneParameters();
		// Read presets after zone parameters so getZones() returns correct names
		// unitParametersReceived = true;
		
		// Don't publish auto-discovery yet - wait for zone data
		// new HomeAssistant(mqtt).publishAutoDiscoveryTopics(UNIT_PARAMETERS, SYSTEM_SETTINGS);
	}
	//Preset parameters
	else if (command == 'R' && command_spec.startsWith('P')) {
		var zone = command_spec.slice(1, -3);
		if (!PRESET_PARAMETERS[zone]) {
			PRESET_PARAMETERS[zone] = new PresetParameters(receiveId, zone, Driver, SYSTEM_SETTINGS);
		}
		PRESET_PARAMETERS[zone].process(parts);
		publishZonePreset(PRESET_PARAMETERS[zone]);
	}
	// Zone Adjustment parameters (Appendix R)
	else if ((command == 'R' || command == 'U') && command_spec.startsWith('H')) {
		// Reply for `G,H00FF` arrives as `R,H00FF,...` -> zone = '00'..'05'.
		// A plain unit-wide `R,H,...` (no zone) is not zone-specific; skip.
		var adjZone = command_spec.length > 1 ? command_spec.slice(1, -2) : '';
		if (adjZone === '') {
			console.log('Skipping unit-wide H reply');
			return;
		}
		if (!ZONE_ADJ_PARAMETERS[adjZone]) {
			ZONE_ADJ_PARAMETERS[adjZone] = new ZoneAdjParameters(receiveId, Driver);
		}
		ZONE_ADJ_PARAMETERS[adjZone].process(parts);
		publishZoneAdj(adjZone);
	}
	else if ((command == 'R' || command == 'U') && command_spec == 'S') {
		SYSTEM_SETTINGS.process(parts);
		// Refresh the tuner/level/system sensor topics so HA reflects the
		// new values after a SET (these are Appendix-B values, not re-sent
		// by the unit on reply).
		publishSystemAndTuner();
	}
	//Zone parameters
	else if (command == 'R' && command_spec.startsWith('Z')) {
		var zone = command_spec.slice(1);
		UNIT_PARAMETERS.processZone(zone, parts);
		var power = parts.find(function(p) { return p.startsWith('24='); });
		var powerValue = power ? power.split('=')[1] : '0';
		console.log("Zone", zone, "power =", powerValue);
		mqtt.publish('devices/audio-zone/' + zone + '/power-state/get', powerValue === '01' ? 'on' : 'off', {retain: true});
		// Re-publish HA discovery topics when all zones have been queried
		var zones = UNIT_PARAMETERS.getZones();
		var allZonesQueried = zones.every(function(z) {
			return UNIT_PARAMETERS.zoneData[z.id] !== undefined;
		});
		if (allZonesQueried && !unitParametersReceived) {
			console.log("All zone parameters received, publishing HA discovery");
			unitParametersReceived = true;
			new HomeAssistant(mqtt).publishAutoDiscoveryTopics(UNIT_PARAMETERS, SYSTEM_SETTINGS);
			// Now read preset + zone-adjustment parameters AFTER HA discovery is set up
			readCurrentPresets();
			readZoneAdjustment();
			publishSystemAndTuner();
		}
	}
	else if (command == 'U' && command_spec == 'S' && parts[0] == '0="BKC-DIP ACTIVE"') {
		console.log("discover after receiving U,S; must be using net driver");
		discover();
	}
	else if (command == 'E') {
		//echo
	}
	else {
		console.log('Unknown command', command, 'spec', command_spec);
	}
};

module.exports.splitRespectingQuotes = splitRespectingQuotes;
