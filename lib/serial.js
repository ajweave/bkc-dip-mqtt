/**
 * Serial driver for B&K components.
 */

var DIP = require('./bkc-dip.js');
const SerialPort = require("serialport");
const Readline = require('@serialport/parser-readline')
const Delimiter = require('@serialport/parser-delimiter')

var serialPort;
var errorCount = 0;

this.open = function(device, onConnect, onReceive) {
	errorCount = 0;
    var parser = new Readline({delimiter: ')', encoding: 'ascii'});
    //var parser = new Delimiter({delimiter: ')'});
    serialPort = new SerialPort(device, {
        baudRate: 9600,  //changed from 9600 to 115200 in BKC software
        dataBits: 8,
        stopBits: 1,
        xoff: true,
        parity: 'none' 
        }, function(err) {
            if (err) {
                return console.log("Failed to open serial port", err);
            }
            console.log("Serial port open");
            onConnect();
        }
    );
    serialPort.pipe(parser);
    parser.on('data', onReceive);
}

/**
 * Sends a command to the device.
 */
this.send = function(receiveId, command) {
    var message = '(' + receiveId + ',' 
                      + command + ';' 
                      + DIP.calculateChecksum(command) + ')';
    console.log('>', message);
    serialPort.write(message, function(err, bytesWritten) {
	if (err) {
		errorCount++;
		return console.log('ERROR: ', err.message);
	}
	});
}

this.close = function() {
    serialPort.close();
}

this.checkConnection = function() {
//This is not working, need to check for a response.
	//console.log("Checking serial connection");
	//send (0,G,F4,0;) -- get unit name?
	//this.send(2, 'G,F4,0');
	return errorCount == 0;
}
