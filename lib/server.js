require('prototypes');

function format2(n) {
	return ("00" + n.toString(16)).substr(-2).toUpperCase();
}

//Page 9 of CT_600X_20005.pdf
function SystemSettings() {
	this.data = {};
	this.process = function(parts) {
		var data = this.data
		parts.forEach(function (part) {
			pair = part.split('=');
			if (pair.length == 2) {
				data[pair[0]] = pair[1];
			}
		});
	};
	
	this.getInputs = function() {
		console.log("getInputs called, data =", data);
		//This set of inputs reflects what can be used in the preset parameters.
		var inputs = [
			{id: '0', title: 'FM Radio'},
			{id: '1', title: 'AM Radio'},
			{id: '2', title: 'Zone Input'}
		];
		var id = 3;
		var data = this.data;
		for (var i = 0; i < 14; i++, id++) {
			inputs.push(
				{
					id: id.toString(16),
					title: data[format2(i)]
				}
			);
		}
		return inputs;
	}
}

//Page 24 of CT_600X_20005.pdf
function UnitParameters() {
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
		var zoneNumbers = this.data['12'].slice(1, -1).split(' ');
		var zones = [];
		for (var i = 0; i < zoneNumbers.length; i++) {
			zones[i] = {id: zoneNumbers[i]};
		}
		return zones;
	};
}
SYSTEM_SETTINGS = new SystemSettings();

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
UNIT_PARAMETERS = new UnitParameters();

//Test dbVolumetoBk TODO: Move to test case
var p = new PresetParameters('x');
for (var i = -80; i < 0; i++) {
	console.log(i.toString(), '=', p.dbVolumeToBk(i));
}

//Page 7 of CT_600X_20005.pdf
function PresetParameters(zoneId) {
	this.zoneId = zoneId;
	this.data = {};
	this.process = function (parts) {
		var data = this.data;
		//TODO Refactor - push up the stack.  Code is
		parts.forEach(function (part) {
			pair = part.split('=');
			if (pair.length == 2) {
				data[pair[0]] = pair[1];
			}
		});
		//console.log('preset for zone id ', this.zoneId, this.data);
	}
	
	this.getVolumeDb = function() {
		return this.bkVolumeToDb(this.data[PresetParameters.VOLUME]);
	}
	
	this.setVolumeDb = function(db) {
		v = this.dbVolumeToBk(db);
		console.log('db =', db, 'v =', v);
		var zoneId = this.zoneId;
		var command = '(' + receiveId + ',S,P' + zoneId + '=FF,' + PresetParameters.VOLUME + '=' + v + ';)';
		console.log('Sending command', command);
		serialPort.write(command, function(err, bytesWritten) {
			if (err) {
				return console.log('ERROR: ', err.message);
			}
			readCurrentPresets(zoneId);
		});
	}
	
	this.getInput = function() {
		return this.data[PresetParameters.SOURCE_INPUT]
	}
	
	this.setInput = function(input) {
		//Serial comm doesn't belong here.  Need to use Observable pattern to sense changes.
		//FF = current preset
		var zoneId = this.zoneId;
		var command = '(' + receiveId + ',S,P' + zoneId + '=FF,' + PresetParameters.SOURCE_INPUT + '=' + input + ';)';
		console.log('Sending command', command);
		serialPort.write(command, function(err, bytesWritten) {
			if (err) {
				return console.log('ERROR: ', err.message);
			}
			readCurrentPresets(zoneId);
		});
	}
	
	this.getLogicalZoneId = function() {
		//Return 11-12 in hex (zoneId + 11)
		//return (parseInt(this.zoneId) + 11).toString(16).toUpperCase();
		return this.zoneId;
	}
	
	//Volume is -80db to 0db, 0x0 to 0x28 (0-40) in 2db steps.
	this.bkVolumeToDb = function(hex) {
		x = parseInt(hex, 16);
		return this.scale(x, 0, 40, -80, 0);
	};
	
	this.dbVolumeToBk = function(db) {
		//2db steps are supported.
		if (typeof db == 'string') db = parseInt(db);
		db = db + (db % 2)
		return Math.abs(this.scale(db, -80, 0, 0, 40)).toString(16).toUpperCase();
	};
	
	this.scale = function(value, frommin, frommax, tomin, tomax) {
		return ((tomax - tomin) * (value - frommin) / (frommax - frommin)) + tomin;
	}
}
PresetParameters.TITLE = '00';
PresetParameters.VOLUME = '01';
PresetParameters.SOURCE_INPUT = '02';
PresetParameters.AUDIO_INPUT = '03';
PresetParameters.VIDEO_INPUT = '04';
PresetParameters.BASS_LEVEL = '05';
PresetParameters.TREBBLE_LEVEL = '06';
PresetParameters.EQUALIZATION = '07';
PresetParameters.AM_FREQUENCY = '08';
PresetParameters.FM_FREQUENCY = '09';
PresetParameters.FM_MODE = '0A';
//Map of presets for each zone
PRESET_PARAMETERS = {};

//Page 9
function SystemParameters() {}
SystemParameters.INPUT_1_TITLE = '00';

var MQTT = require('mqtt'),
    mqtt = MQTT.connect('mqtt://localhost', {
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
  console.log(m);
  if (m != null) {
  	var preset = PRESET_PARAMETERS[m[1]];
  	if (preset) {
		console.log('setting zone', m[1], m[2], 'to', message.toString());
		//var command = '(' + receiveId + ',S,F4;)';
		if (m[2] == 'input') {
			preset.setInput(message.toString());
		}
		else if (m[2] == 'volume') {
			preset.setVolumeDb(message.toString());
		}
	}
	else {
		console.log("Preset " + m[1] + " not found");
	}
//  serialPort.write(command, function(err, bytesWritten) {
// 		if (err) {
// 			return console.log('ERROR: ', err.message);
// 		}
// 	});
  }
  
});

//Discover zones & create topics
//B&K abstracts physical zones and logical zones into groups, for our purposes zones we advertise are actually groups.
//Commands must have trailing ';' before closing ) even when not sending checksum
var receiveId = '00';
var SerialPort = require("serialport").SerialPort;
//TODO verify or detect correct serial port
var serialPort = new SerialPort("/dev/ttyUSB1", {
	  baudrate: 9600,  //115200 stopped working
	  dataBits: 8,
	  stopBits: 1,
	  xoff: true,
	  parity: 'none', 
	  parser: require("serialport").parsers.readline(')', 'ascii')
	}, function() {
		console.log("Serial port open");
		discover();
	}
);

function discover() {
	var commands = [
	 '(' + receiveId + ',G,F4;)', //get unit parameters
	 '(' + receiveId + ',G,S;)'   //get all settings
	];
	
	commands.forEach(function(command) { //get system settings
		console.log('Sending BKC command', command);
		serialPort.write(command, function(err, bytesWritten) {
			//console.log('Wrote ' + bytesWritten + ' bytes');
			if (err) {
				return console.log('ERROR: ', err.message);
			}
		})
	});
}

function readCurrentPresets(zone) {
	var zones = zone ? [{id: zone}] : UNIT_PARAMETERS.getZones();
	zones.forEach(function(zone) {
		//(0,G,P<zoneid>=FF
		//         |     ^-- FF=current values
		//         --------- zoneid = logical zone id
		//console.log('zone=', zone);
		command = '(' + receiveId + ',G,P' + zone.id + '=FF;)';
		console.log('Sending command', command);
		serialPort.write(command, function(err, bytesWritten) {
			if (err) {
 				return console.log('ERROR: ', err.message);
 			}
 		});
	});
}

function initTopics() {
	var zones = UNIT_PARAMETERS.getZones();
	zones.forEach(function(zone) {
		console.log('publish zone topic', zone);
		//don't need this
		//mqtt.publish('home/devices/audio-zone/' + zone.id + '/input', '');
		//mqtt.publish('home/devices/audio-zone/' + zone.id + '/volume', '');		
	});
	
	mqtt.subscribe('home/devices/audio-zone/+/+/set');
}

//Publish zone current preset
function publishZonePreset(preset) {
	mqtt.publish('home/devices/audio-zone/' + preset.zoneId + '/input/get', preset.getInput(), {retain: true});
	mqtt.publish('home/devices/audio-zone/' + preset.zoneId + '/volume/get', preset.getVolumeDb().toString(10), {retain: true});
}

function publishInputs() {
	inputs = SYSTEM_SETTINGS.getInputs();
	UNIT_PARAMETERS.getZones().forEach(function(zone) {
		mqtt.publish('home/devices/audio-zone/' + zone.id + '/inputs', JSON.stringify(inputs), {retain: true});
	});
}

serialPort.on('data', function(data) {
	data = data.toString();
	console.log('BKC response', data.length, 'bytes');
	console.log(data);
	//ensure message is for us
	if (!data.startsWith('(' + receiveId + ',')) {
		return;
	}
	//validate checksum
	parts = data.split(',');
	parts.shift();
	command = parts.shift();
	command_spec = parts.shift();	
	console.log('command =', command)
	console.log('command_spec =', command_spec)

	//todo: strip the checksum
	// parts.forEach(function(part) {
// 		console.log('->', part);
// 	});
	if (command == 'R' && command_spec == 'F4') {
		UNIT_PARAMETERS.process(parts);
		initTopics();
		readCurrentPresets();
	}
	else if (command == 'R' && command_spec.startsWith('P')) {
		zone = command_spec.slice(1, -3);
		if (!PRESET_PARAMETERS[zone]) {
			PRESET_PARAMETERS[zone] = new PresetParameters(zone);
		}
		console.log('updating state for zone', zone);
		PRESET_PARAMETERS[zone].process(parts);
		publishZonePreset(PRESET_PARAMETERS[zone]);
	}
	else if (command == 'R' && command_spec == 'S') {
		SYSTEM_SETTINGS.process(parts);
		publishInputs();
	}
	else {
		console.log('Unknown command', command, 'spec', command_spec);
	}
});



//sources
// home/media
//   { media: [ {id: 'mpd', name: 'MPD on HTPC', behaviors: ['playback'] } ] }
