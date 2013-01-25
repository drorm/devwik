/*
 * User Object:
 */

if (typeof Devwik == 'undefined') {
	/**
	 *   @ignore Namespace definition.
	 *                   */
	 Devwik = function() {};
}

var DEVWIK_LOCAL = '/home/dror/devwik/dev/devwik/';
//var DEVWIK_LOCAL = '/d/home/dror/devwik0.2/devwik';

var DOWNLOAD_DIR = DEVWIK_LOCAL + 'public/downloads/';//on the server
var DEVWIK_USERS = '/d/users/';

Devwik.consoleLog = function(message, userId) {
	Fiber(function() {
		console.log( message);
		ConsoleLines.insert({message: message, userId:userId, inserted: new Date()});
	}).run();
	};


//Root for the user's app directory
Devwik.userRootDir = function(username) {
	if(Devwik.envType == 'prod') {
		 //return ('/d/lxc/u-' + '/rootfs/home/meteor/apps/'); 
		 return (DEVWIK_USERS + username + '/apps/');
	} else {
		 return (DEVWIK_LOCAL + '../users/' + username + '/apps/');
	}
};
