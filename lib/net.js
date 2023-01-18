/**
 * Network driver for enthernet-enabled B&K components.
 */
var DIP = require('./bkc-dip.js');
var net = require('net')
var recvbuff = Buffer.alloc(4096, 0, 'ascii');
var recvsize = 0;
var DELIM = ')'.charCodeAt(0);

var socket;
this.open = function(address, port, onConnect, onReceive) {
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
	oldsize = recvsize;
	//todo bounds check
	recvsize += data.copy(recvbuff, recvsize);
	//check for delimiter )
	var start = 0;
	for (var i = 0; i < recvsize; i++) {
		if (recvbuff[i] == DELIM) {
			console.log('delim @', i);
			var message = recvbuff.toString('ascii', start, i + 1);
			console.log('<', message);
			onReceive(recvbuff.toString('ascii', start, i + 1));	
			start = i + 1;
		}
	}
	//shift contents to beginning of buffer if necessary.  ring buffer would be helpful here
	if (start > 0) {
		console.log('shifting buffer at ', start);
		recvsize = recvbuff.copy(recvbuff, 0, start, recvsize - start);
	}

    });
}

this.checkConnection = function() {
	//pass
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
