//Page 7 of CT_600X_20005.pdf
PresetParameters = function(receiveId, zoneId, driver) {
	this.receiveId = receiveId;
	this.driver = driver;
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
	
	//0h = power off, 1h = power on
	this.setPowerState = function(state) {
		var v = state == 'on' ? '1' : '0';
		console.log("Turning zone", this.zoneId, v == '1' ? 'on' : 'off');
		//Set it
		driver.send(receiveId, 'S,Z' + this.zoneId + ',24=' + v );
		//Read it back
		driver.send(receiveId, 'G,Z' + this.zoneId + ',24=' + v );
	}
	
	this.getVolumeDb = function() {
		return this.bkVolumeToDb(this.data[PresetParameters.VOLUME]);
	}
	
	this.setVolumeDb = function(db) {
		v = this.dbVolumeToBk(db);
		console.log('db =', db, 'v =', v);
		driver.send(receiveId, 'S,P' + zoneId + '=FF,' + PresetParameters.VOLUME + '=' + v);
	}
	
	this.getInput = function() {
		return this.data[PresetParameters.SOURCE_INPUT]
	}
	
	this.setInput = function(input) {
		//Serial comm doesn't belong here.  Need to use Observable pattern to sense changes.
		//FF = current preset
		driver.send(receiveId, 'S,P' + zoneId + '=FF,' + PresetParameters.SOURCE_INPUT + '=' + input)
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
