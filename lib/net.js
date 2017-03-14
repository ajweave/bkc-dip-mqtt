/**
 * Network driver for enthernet-enabled B&K components.
 */
var DIP = require('./bkc-dip.js');
var net = require('net')

var socket;
this.open = function(address, port, onConnect, onReceive) {
    //TODO: wait for BKC-DIP ACTIVE message to ensure unit is ready
    socket = net.connect(port, address, function() {
        console.log("Socket open");
        onConnect();
    });
    socket.on('data', function(data) {
        var message = data.toString();
        console.log('<', message);
        onReceive(message);
    });
}

/**
 * Sends a command to the device.
 */
this.send = function(receiveId, command) {
    var message = '(' + receiveId + ',' 
                      + command + ';' 
                      + DIP.calculateChecksum(command) + ')'
    //TODO: Handle closed socket by reconnecting.
    console.log('>', message);
    socket.write(message);
}

this.close = function() {
    socket.close();
}
