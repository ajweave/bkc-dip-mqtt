/**
 * Serial driver for B&K components.
 */
var DIP = require('./bkc-dip.js');
var SerialPort = require("serialport").SerialPort;

var serialPort;

this.open = function(device, onConnect, onReceive) {
    serialPort = new SerialPort(device, {
        baudrate: 9600,  //changed from 9600 to 115200 in BKC software
        dataBits: 8,
        stopBits: 1,
        xoff: true,
        parity: 'none', 
        parser: require("serialport").parsers.readline(')', 'ascii')
        }, function() {
            console.log("Serial port open");
            serialPort.on('data', onReceive);
            onConnect();
        }
    );
}

/**
 * Sends a command to the device.
 */
this.send = function(receiveId, command) {
    var message = '(' + receiveId + ',' 
                      + command + ',' 
                      + DIP.calculateChecksum(command) + ';)';
    serialPort.write(message, function(err, bytesWritten) {
			if (err) {
				return console.log('ERROR: ', err.message);
			}
		});
}

this.close = function() {
    serialPort.close();
}
