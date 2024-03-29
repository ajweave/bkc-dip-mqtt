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
require('prototypes');
require('./system_settings.js');
require('./unit_parameters.js');
require('./preset_parameters.js');
require('./zone_adjustment_parameters.js');
require('./home_assistant.js');

var Driver;
var MQTT = require('mqtt');
var mqtt;

var unitParametersReceived = false;
var zoneCount = 0;


this.start = function(driver, broker, hostOrDevice) {
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
		protocolVersion: 3
	//      username: config.mqttUser,
	//      password: new Buffer(config.mqttPw)
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
		var m = /^.*\/audio-zone\/([^/]+)\/([^/]+)\/set/.exec(topic)
		//console.log(m);
		if (m != null) {
			var zone = PRESET_PARAMETERS[m[1]];
			if (zone) {
				console.log('setting zone', m[1], m[2], 'to', message.toString());
				//var command = '(' + receiveId + ',S,F4;)';
				if (m[2] == 'input') {
					zone.setInput(message.toString());
					readCurrentPresets(zone.getLogicalZoneId());
				}
				else if (m[2] == 'volume') {
					zone.setVolumeDb(message.toString());
					readCurrentPresets(zone.getLogicalZoneId());
				}
				else if (m[2] == 'power-state') {
					zone.setPowerState(message.toString());
				}
				else if (m[2] == 'bass') {
					zone.setBassGain(message.toString());
				}
				else if (m[2] == 'treble') {
					zone.setTrebleGain(message.toString());
				}
				else if (m[2] == 'loudness') {
					zone.setLoudness(message.toString());
				}
				else {
					console.log('Unknown parameer ', m[2]);
				}
			}
			else {
				console.log("Zone " + m[1] + " not found");
			}
		}
	});
}

//Discover zones & create topics
//B&K abstracts physical zones and logical zones into groups, for our purposes zones we advertise are actually groups in B&K terms.
//Commands must have trailing ';' before closing ) even when not sending checksum
var receiveId = '00';

this.format2 = function(n) {
	return ("00" + n.toString(16)).substr(-2).toUpperCase();
}

SYSTEM_SETTINGS = new SystemSettings();
UNIT_PARAMETERS = new UnitParameters();

//Map of presets for each zone
PRESET_PARAMETERS = {};

//Page 9
function SystemParameters() {}
SystemParameters.INPUT_1_TITLE = '00';

function discover() {
	var commands = [
	 'G,F4', //get unit parameters
//	 'G,S'   //get all settings
	];
	
	commands.forEach(function(command) { //get system settings
		Driver.send('FF', command)
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

//Publish zone current preset
function publishZonePreset(preset) {
	mqtt.publish('devices/audio-zone/' + preset.zoneId + '/input/get', preset.getInput(), {retain: true});
	mqtt.publish('devices/audio-zone/' + preset.zoneId + '/volume/get', preset.getVolumeDb().toString(10), {retain: true});
	mqtt.publish('devices/audio-zone/' + preset.zoneId + '/bass/get', preset.getBassGain().toString(10), {retain: true});
	mqtt.publish('devices/audio-zone/' + preset.zoneId + '/treble/get', preset.getTrebleGain().toString(10), {retain: true});
	mqtt.publish('devices/audio-zone/' + preset.zoneId + '/loudness/get', preset.getLoudness(), {retain: true});
}

function publishInputs() {
	inputs = SYSTEM_SETTINGS.getInputs();
	UNIT_PARAMETERS.getZones().forEach(function(zone) {
		mqtt.publish('devices/audio-zone/' + zone.id + '/inputs', JSON.stringify(inputs), {retain: true});
	});
}

function onReceive(data) {
	data = data.toString();
    console.log('<', data);
	//validate checksum
	parts = data.split(',');
	if (parts.length == 0) {
		console.log("Unrecognized message");
		return;
	}
	parts.shift();
	command = parts.shift();
	command_spec = parts.shift();	
	console.log('command = %s spec = %s', command, command_spec);
	//console.log('command_spec =', command_spec);
	//console.log('parts = ', parts);

	if (parts[parts.length - 1].indexOf(';') > -1) {
		parts[parts.length - 1] = parts[parts.length - 1].split(';')[0];
	}
	//   parts.forEach(function(part) {
 	//  	console.log('->', part);
 	//  });
	if (command == 'R' && command_spec == 'F4') {  //Unit parameters reply
		//This reply is being triggered often, not sure why.  Only look at the first one.
		if (this.unitParametersReceived) return;
		UNIT_PARAMETERS.process(parts);
		mqtt.subscribe('devices/audio-zone/+/+/set');
		readCurrentPresets();
		readZoneParameters();
		this.unitParametersReceived = true;
  		//Should have all we need to publish auto-discovery stuff
		new HomeAssistant(mqtt).publishAutoDiscoveryTopics(UNIT_PARAMETERS);
	}
	//Preset parameters
	else if (command == 'R' && command_spec.startsWith('P')) {
		var zone = command_spec.slice(1, -3);
		if (!PRESET_PARAMETERS[zone]) {
			PRESET_PARAMETERS[zone] = new PresetParameters(receiveId, zone, Driver);
		}
		PRESET_PARAMETERS[zone].process(parts);
		publishZonePreset(PRESET_PARAMETERS[zone]);
	}
	else if (command == 'R' && command_spec == 'S') {
		SYSTEM_SETTINGS.process(parts);
		publishInputs();
	}
	//Zone parameters
	else if (command == 'R' && command_spec.startsWith('Z')) {
		var data = {}
		parts.forEach(function (part) {
			pair = part.split('=');
			if (pair.length == 2) {
				data[pair[0]] = pair[1];
			}
		});
		var zone = command_spec.slice(1);
		//console.log("Zone", zone, "parameters =", parts);
		var power = data['24'] == '01' ? 'on' : 'off';
		console.log("Power =", power);
		if (data['00']) {
			mqtt.publish('devices/audio-zone/' + zone + '/title', data['00'].trim(), {retain: true});
		}
		mqtt.publish('devices/audio-zone/' + zone + '/power-state/get', power, {retain: true});
		//if zone count matches the unit's zone count, publish the HA discovery topics
		//HomeAssistant(mqtt).publishAutoDiscoveryTopics(UNIT_PARAMETERS);
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
