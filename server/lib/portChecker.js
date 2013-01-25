/** 
 * LICENSE MIT
 * (C) Daniel Zelisko
 * http://github.com/danielzzz/node-portchecker
 *
 * a simple tcp port checker
 * Use it for checking if a service is up or to find available ports on a machine
 */
var net = __meteor_bootstrap__.require('net');
var host = 'localhost',
startPort = 3100, //1024 and under are privileged
endPort = 40000; //1,024 to 49,151 are generally available



var timeout = 200; //miliseconds


PortChecker = new Object();

// start port, last port, host, callback
PortChecker.getFirstAvailable = function (startPort, callback) {
	if (startPort>endPort) {
		throw new Error('portchecker: startPort must be lower than endPort');
	}
	//console.log('looking for an available port in ' + startPort + '-' + endPort + ' on ' + host);
	var notFree = false;
	var currentPort = startPort;

	var onCheckPort = function(isOpen){
		isOpen && check();
		!isOpen && callback((currentPort-1), host);
	};

	var check = function() {
		//---- return -1 if we checked all ports from the range already
		if (currentPort>endPort) {callback(-1, host); return; }

		//console.log('checking :' + currentPort);
		PortChecker.isOpen(currentPort, host, onCheckPort);
		currentPort++;
	};

	//----- start checking ----------
	check();
};

PortChecker.isOpen = function (port, host, callback) {
	var isOpen = false;
	var conn = net.createConnection(port, host);

	var timeoutId = setTimeout(function() {onClose();}, timeout);
	var onClose = function() {
		clearTimeout(timeoutId);
		delete conn;
		callback(isOpen, port, host);    
	};

	var onOpen = function() {
		isOpen = true;
		//console.log(host+":"+p+" is taken");
		conn.end();
	};

	conn.on('close', onClose);
	conn.on('error', function() {conn.end();});
	conn.on('connect', onOpen);
};

PortChecker.setTimeout = function(t) {
	timeout = t;
};

/*
PortChecker.getFirstAvailable(startPort, endPort, host, function(p, host) {
	if (p === -1) {
		console.log('no free ports found on ' + host + ' between ' + startPort + ' and ' + endPort);
	} else {
		console.log('the first free port found on ' + host + ' between ' + startPort + ' and ' + endPort + ' is ' + p);
	}
});
*/


