/**
 * Serial driver for B&K components.
 */

var DIP = require('./bkc-dip.js');
const SerialPort = require("serialport");
const Readline = require('@serialport/parser-readline')
const Delimiter = require('@serialport/parser-delimiter')

var serialPort;

this.open = function(device, onConnect, onReceive) {
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
				return console.log('ERROR: ', err.message);
			}
		});
}

this.close = function() {
    serialPort.close();
}
