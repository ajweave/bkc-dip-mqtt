"use strict";
/**
 * Serial driver for B&K components.
 */

var DIP = require('./bkc-dip.js');
var SerialPort = require("serialport");
var Readline = require('@serialport/parser-readline');

var serialPort;
var errorCount = 0;

module.exports.open = function(device, onConnect, onReceive) {
    errorCount = 0;
    var parser = new Readline({delimiter: ')', encoding: 'ascii'});
    serialPort = new SerialPort(device, {
        baudRate: 9600,
        dataBits: 8,
        stopBits: 1,
        xoff: true,
        parity: 'none'
    }, function(err) {
        if (err) {
            console.log("Failed to open serial port:", err.message);
            return;
        }
        console.log("Serial port open");
        onConnect();
    });
    serialPort.pipe(parser);
    parser.on('data', onReceive);
    serialPort.on('error', function(err) {
        console.error('Serial port error:', err.message);
        errorCount++;
    });
    serialPort.on('close', function() {
        console.log('Serial port closed');
    });
};

/**
 * Sends a command to the device.
 */
module.exports.send = function(receiveId, command) {
    var message = '(' + receiveId + ','
                      + command + ';'
                      + DIP.calculateChecksum(receiveId + ',' + command) + ')';
    console.log('>', message);
    serialPort.write(message, function(err) {
        if (err) {
            errorCount++;
            console.log('Serial write error:', err.message);
        }
    });
};

module.exports.close = function() {
    if (serialPort) {
        serialPort.removeAllListeners();
        serialPort.close();
        serialPort = null;
    }
};

module.exports.checkConnection = function() {
    return errorCount === 0 && serialPort && !serialPort.destroyed;
};
