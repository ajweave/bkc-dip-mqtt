"use strict";
/**
 * Network driver for enthernet-enabled B&K components.
 */
var DIP = require('./bkc-dip.js');
var net = require('net');
var recvbuff = Buffer.alloc(4096, 0, 'ascii');
var recvsize = 0;
var DELIM = ')'.charCodeAt(0);
// Set DEBUG_NET=1 to enable verbose per-byte frame logging in the net driver.
var DEBUG_NET = process.env.DEBUG_NET === '1' || process.env.DEBUG_NET === 'true';

var socket;
var reconnectTimer = null;

module.exports.open = function(address, port, onConnect, onReceive) {
    //TODO: wait for BKC-DIP ACTIVE message to ensure unit is ready
    socket = net.connect(port, address, function() {
        console.log("Socket open, buffer length ", recvbuff.length);
        onConnect();
    });
    socket.on('data', function(data) {
        //var message = data.toString();
        //console.log('<', message);
        //onReceive(message);
	//console.log(recvsize + ' recv ' + data.length + ' bytes: ', data.toString());

	//buffer the data
	var oldsize = recvsize;
	// Bounds check: never write past the end of the fixed 4096-byte buffer.
	// If the incoming chunk would overflow, copy what fits and drop the rest
	// (the next delimiter scan + shift will recover; a full resync is safer
	// than a silent out-of-bounds truncate that loses frame alignment).
	var space = recvbuff.length - recvsize;
	if (data.length > space) {
		console.error('Net recv buffer overflow: dropping ' + (data.length - space) + ' bytes (recvsize=' + recvsize + ')');
		data = data.slice(0, space);
	}
	recvsize += data.copy(recvbuff, recvsize);
	//check for delimiter )
	var start = 0;
	for (var i = 0; i < recvsize; i++) {
	if (recvbuff[i] == DELIM) {
		if (DEBUG_NET) console.log('delim @', i);
		var message = recvbuff.toString('ascii', start, i + 1);
		if (DEBUG_NET) console.log('<', message);
		onReceive(recvbuff.toString('ascii', start, i + 1));
		start = i + 1;
	}
	}
	//shift contents to beginning of buffer if necessary.  ring buffer would be helpful here
	if (start > 0) {
	if (DEBUG_NET) console.log('shifting buffer at ', start);
	recvsize = recvbuff.copy(recvbuff, 0, start, recvsize - start);
	}

    });
    socket.on('error', function(err) {
        console.error('Net socket error:', err.message);
    });
    socket.on('close', function() {
        console.log('Net socket closed');
        if (reconnectTimer) {
            clearTimeout(reconnectTimer);
            reconnectTimer = null;
        }
    });
};

module.exports.checkConnection = function() {
    if (socket && !socket.destroyed && !socket.connecting) {
        return true;
    }
    return false;
};

/**
 * Sends a command to the device.
 */
module.exports.send = function(receiveId, command) {
    var message = '(' + receiveId + ','
                      + command + ';'
                      + DIP.calculateChecksum(receiveId + ',' + command) + ')'
    //TODO: Handle closed socket by reconnecting.
    console.log('>', message);
    if (socket && !socket.destroyed) {
        socket.write(message);
    } else {
        console.warn('Cannot send: socket is closed');
    }
};

module.exports.close = function() {
    if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
    }
    if (socket) {
        socket.removeAllListeners();
        socket.destroy();
        socket = null;
    }
};
