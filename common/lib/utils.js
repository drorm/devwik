/*
 * Shared between client and server
 */

if (typeof Devwik == 'undefined') {
	/**
	 *   @ignore Namespace definition.
	 *                   */
	Devwik = function() {};
}

Devwik.PRODSERVER = 'devwik.com';
var hostname;
// Devwik.envType can be 'dev', 'test' or 'prod'
//By default we're a dev environment
Devwik.envType = 'dev';
if (Meteor.isServer) {
	var os = __meteor_bootstrap__.require('os');
	hostname = os.hostname();
	if (hostname == Devwik.PRODSERVER) {
		Devwik.envType = 'prod';
	}
	var linuxEnv = process.env.DEVWIK_ENV;
	console.log('Environment variable:' + linuxEnv);
	//Linux environment variable can override
	if (linuxEnv) {
		Devwik.envType = linuxEnv;
	}
} else { //client
	//If we have devwik.com in the url, we're in production testing
	hostname = document.location.hostname;
	if (hostname.match(Devwik.PRODSERVER)) {

		Devwik.envType = 'prod';
	}
}
console.log('Running on -' + hostname + '- in ' + Devwik.envType + ' mode');


//Get all the properties of an object
Devwik.objectProperties = function(obj, separator) {
	var sep = ';\n\n';
	if(separator) {
		sep = separator;//use the one passed in
	}
	var output = '';
	for (property in obj) {
		output += property + ': ' + obj[property] + sep;
	}
	return(output);
};

/* From http://stackoverflow.com/questions/901115/how-can-i-get-query-string-values
 * Get a URL query param by name
 * @name: the name of the parameter
 */

Devwik.getParameterByName = function(name) {
	name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
	var regexS = "[\\?&]" + name + "=([^&#]*)";
	var regex = new RegExp(regexS);
	var results = regex.exec(window.location.search);
	if(results === null)
		return "";
	else
		return decodeURIComponent(results[1].replace(/\+/g, " "));
};
