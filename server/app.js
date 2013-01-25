"use strict";

var spawn = __meteor_bootstrap__.require('child_process').spawn;

Devwik.app = function() {};

//Globals
var USERDIR = "../users/";
var BINDIR = "./server/bin/";


Meteor.methods({
	//Called only once, the first time a new user signs up
	newUser: function(initialApp) {
		try {
			var user = new Devwik.User(this.userId, initialApp);
		} catch (error) {
			console.log("Caught error:" + error);
			throw new Meteor.Error(error.message);
		}
		return ('created');
	},


	//Reload the app for a specific user
	restartApp: function (name) {
		var userId = this.userId;
		console.log('Restarting app for:' + userId);
		Session.set("meteorUserId", userId);
		if (name) {
			console.log('name is:' + name);
			DevwikUsers.update({meteorId:userId},{$set: {currentApp: name}});//TODO: check that name is in our app list
		} else {
			console.log('no name:');
		}
		DevwikUsers.update({meteorId:userId},{$set: {appStatus: 'stopping'}});
		if(Devwik.envType == 'prod') {
			Devwik.app.launch(userId, 'restartApp.sh');
		} else {
			Devwik.app.launch(userId, 'startAppLocal.sh');
		}
		FileList.remove({}); //Clear the list of files from the db and load from file system
		Devwik.Files.loadFiles(this.userId); 
	},

	//Create a tar file for the current app
	zipApp: function () {
		var user = new Devwik.User(this.userId);
		console.log('tar app:' + user.name + + " :" + user.currentApp);
		var currentApp = user.currentApp;
		var command = '/bin/tar';
		var now = new Date().getTime();//Unique id, almost, for the app
		var tarfile = currentApp + '-' + now + '.tar.gz';
		//var tarFullPath = user.rootDir + '../' +  tarfile;
		var tarPath = 'static/downloads/' +  tarfile;
		var cwd = '.';
		//Start tar locally with the right target dir, and then use -C to switch to the user's rootDir
		var args = ['--exclude', '.meteor/local', '-zcf', tarPath, '-C', user.rootDir, currentApp];
		console.log(command + " :" + args + " :" + cwd);

		var error;

		try{
			error = Devwik.app.runCommand(user, command, args, cwd); 
		} catch (err) {
			console.log("Caught error:" + err);
			if (err.stack) {
				console.log(err.stack);
			}
			throw new Meteor.Error(err.message);
		}
		console.log("Tarred:" + user.currentApp + "error:" + error);
		if(error) {
			throw new Meteor.Error(error);
		}
		return(tarfile);
	},

	//Save the user's setting
	saveSettings: function (editorType) {//RIght now just one setting: editorType
		var userId = this.userId;
		console.log('Saving settings for:' + userId);
		user = DevwikUsers.findOne({meteorId:userId});
		DevwikUsers.update({meteorId:userId},{$set: {editorType: editorType}});
	}
});



/**
 * Launch a a command, usually a shell script
 * 
 * @param {String} userId: The id of the user we're running the command for
 * @param {String} command: The command we're running
 */

Devwik.app.launch = function (userId, command) {
	var user = null;
	Fiber(function() {
		user = DevwikUsers.findOne({meteorId:userId});
		console.log('userId:' + userId);
		console.log('user:' + user);
		var meteorUser = Meteor.users.findOne(userId);
		console.log(meteorUser);
		var username = meteorUser.username;
		var currentApp = user.currentApp;
		var currentPort = user.port;
		command = BINDIR + command;
		Devwik.consoleLog('running:' + command + ' Port:' + currentPort + " user:" + username + ' app:' + currentApp, userId);
		var commandHandle;
		commandHandle = spawn(command, [username, currentPort, currentApp], {cwd:'.'});

		commandHandle.stdout.on('data', function (data) {
			//Looking for something like: "Running on: http://localhost:8888/"
			var search = '^Running on: http://.*:' + currentPort;
			if (data.toString().match(search)) {
				Devwik.consoleLog('----------------------:', userId);
				Devwik.consoleLog('##RUNNING:', userId);
				Fiber(function() {
					//When we've launched a new app, need to know when it's ready to load in the iframe
					//We check the port, and let the client know
					DevwikUsers.update({meteorId:userId},{$set: {appStatus: 'running'}});
				}).run();
			} 
			Devwik.consoleLog('##stdout: ' + data, userId);
		});
		commandHandle.stderr.on('data', function (data) {
			Devwik.consoleLog('##stderr: ' + data, userId);
		});
		commandHandle.on('exit', function (code) {
			Fiber(function() {
				DevwikUsers.update({meteorId:userId},{$set: {appStatus: 'stopped'}});
			}).run();
			Devwik.consoleLog(command + ' exited with code ' + code, userId);
		});
	}).run();

};

/*
 * Run a command and return only when it's done
 */
Devwik.app.runCommand = function (user, command, args, cwd) {
	Devwik.consoleLog('running:' + command + ' Port:' + user.currentPort + " user:" + user.username + ' app:' + user.currentApp, user.userId);
	var commandHandle;
	if (!cwd) {
		cwd = '.';
	}

	commandHandle = spawn(command, args, {cwd: cwd});

	var errorOut = '';
	var result = null;


	commandHandle.stdout.on('data', function (data) {
		Devwik.consoleLog('##stdout: ' + data, user.userId);
	});
	commandHandle.stderr.on('data', function (data) {
		Devwik.consoleLog('##stderr: ' + data, user.userId);
		errorOut += data;
	});
	commandHandle.on('exit', function (code) {
		Devwik.consoleLog(command + ' exited with code ' + code, user.userId);
		if(code !== 0) {
			result = "Tar Error: exit " + code + ':' +  errorOut;
		}
	});
	return(result);

};

//Insert a new app create by the wizard or otherwise into the app list
Devwik.app.addApp = function(baseDir, userId, appName) {
	AppList.insert({userId:userId, name: appName, path: baseDir + appName});
};

//Load the list of available apps for a user
Devwik.app.loadAppList = function(baseDir, userId) {
	AppList.remove({}); //Clear the list of apps from the db and load from file system
	var files = fs.readdirSync(baseDir);
	for (var ii = 0; ii < files.length; ii++) {
		var fileName = files[ii];
		var fullPath = baseDir + fileName;
		var stats = fs.statSync(fullPath);
		if (stats.isDirectory()) {
			AppList.insert({userId:userId, name: fileName, path: fullPath});
			//console.log("app:" + fileName + " path:" +  fullPath);
		}
	}
};

