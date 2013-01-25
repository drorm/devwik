var http = __meteor_bootstrap__.require('http');

/*
 * Contact the proxy to let it know to check for a new user. 
 * 1. It will: find the user in the db
 * 2. Associate the IP address with the user name/sub domain such as joe.devwik.com
 */

Devwik.notifyProxy = function notifyProxy(callback) {
	var options = {
		hostname: 'localhost',
		port: 19999,//TODO: restore to 9999
		path: '/',
		method: 'GET'
	};

	var req = http.request(options, function(res) {
		console.log('STATUS: ' + res.statusCode);
		console.log('HEADERS: ' + JSON.stringify(res.headers));
		res.setEncoding('utf8');
		res.on('data', function (chunk) {
			console.log('BODY: ' + chunk);
			callback(chunk);
		});
	});

	req.on('error', function(e) {
		console.log('problem with request: ' + e.message);
		callback('err');
	});

	// write data to request body
	req.write('data\n');
	req.write('data\n');
	req.end();
};
