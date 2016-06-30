require('prototypes');

//Page 24 of CT_600X_20005.pdf
function UnitParameters() {
	this.data = {}
	this.process = function (parts) {
		//console.log('Unit paramters', parts);
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
		var zoneNumbers = this.data['12'].split(' ');
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
UNIT_PARAMETERS = new UnitParameters();

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
  console.log(message.toString() + ' on ' + topic);
});

//Discover zones & create topics
//B&K abstracts physical zones and logical zones into groups, for our purposes zones we advertise are actually groups.
//Commands must have trailing ';' before closing ) even when not sending checksum
//Get all settings (00,G,S;)
//mqtt.subscribe('home/devices/audio-zone-1/input');
//mqtt.subscribe('home/devices/audio-zone-1/volume');
var receiveId = '00';
var SerialPort = require("serialport").SerialPort
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
//	command = '(' + receiveId + ',G,S;)'; //get system settings
	command = '(' + receiveId + ',G,F4;)'; //get unit parameters
	serialPort.write(command, function(err, bytesWritten) {
		console.log('Wrote ' + bytesWritten + ' bytes');
		if (err) {
			return console.log('ERROR: ', err.message);
		}
	});
}

function initTopics() {
	var zones = UNIT_PARAMETERS.getZones();
	zones.forEach(function(zone) {
		console.log('publish zone topic', zone);
		mqtt.publish('home/devices/audio-zone/' + zone.id + '/input', '');
		mqtt.publish('home/devices/audio-zone/' + zone.id + '/volume', '');		
	});
	
	mqtt.subscribe('home/devices/audio-zone/#');
}

serialPort.on('data', function(data) {
	data = data.toString();
	//ensure message is for us
	if (!data.startsWith('(' + receiveId + ',')) {
		return;
	}
	//validate checksum
	parts = data.split(',');
	parts.shift();
	command = parts.shift();
	command_spec = parts.shift();	
	console.log('command=', command)
	console.log('command_spec=', command_spec)

	//todo: strip the checksum
	parts.forEach(function(part) {
		console.log('->', part);
	});
	if (command == 'R' && command_spec == 'F4') {
		UNIT_PARAMETERS.process(parts);
		initTopics();
	}
});



//sources
// home/media
//   { media: [ {id: 'mpd', name: 'MPD on HTPC', behaviors: ['playback'] } ] }
