"use strict";

/*
 * User Object:
 */

var STARTPORT = 3100; //minimal port

/*
 * Create a new user
 * userId is the Meteor user id. 
 * initialApp is the app that they run initially
 *
 */

Devwik.User = function(id, initialApp) {

	var self = this;
	var userId = self.id = id;
	var meteorUser = self.meteorUser = Meteor.users.findOne(userId);
	var username = self.name = meteorUser.username;
	//Devwik.consoleLog('User:' + username, userId);
	//Devwik.consoleLog("user userId:" + userId, userId);
	var user = self.devwikUser = DevwikUsers.findOne({meteorId:userId});
	if(user) {
		self.currentApp = self.devwikUser.currentApp;
		self.rootDir = Devwik.userRootDir(self.name);
		self.appDir = Devwik.Files.createUserPath(self.name, self.devwikUser.currentApp);
		console.log("User:" + self.id + " :" + self.name + " :" + self.currentApp + " :" + 
				self.rootDir);
	} else { //new user 
		var port = null;// No currentPort yet.
		//Get a port for the user
		var userMaxPort = DevwikUsers.findOne({}, {sort: {port: -1}});//max port number currently used
		if(userMaxPort) {
			port = userMaxPort.port + 3; //1 for meteor, one for mongo, and 1 for the little boy that lives down the lane
		} else { //no ports currently used. Start with first
			port = STARTPORT;
		}
		console.log("Current max port:" + port);
		Fiber(function() {
			Devwik.consoleLog('creating account for user:' + username + " port:" + port + " curentApp:" + initialApp, " userId:" + userId, userId);
			//We've got ourselves a port, let's create the user and start meteor
			//record for the user. Only updated from here on
			DevwikUsers.insert({meteorId:userId, port:port, currentApp:initialApp, editorType:'default', 
				appConfigured:true, appStatus:'launching'} , function(error, id) { //Mark the user as set up. App is launching
					if (error) {
						//TODO: To make this transactional, if theinsert fails,we should remove the record
						console.log("insert error:" + error);
						console.log("###Someone got out port. Try again");
						//TODO: Race condition. If two users get the same port, the insert will fail and
						//we should try again. Small likelyhood but that's the kind of !@#$ we need to put up
						//with Mongo.
					} else {
						if(Devwik.envType == 'prod') {//on the server
							Devwik.notifyProxy(function(response) {//Let the proxy know we have a new user
								//if (response === 'OK') {TODO
									console.log('Proxy new user::' + response);
									Fiber(function() {
										DevwikUsers.update({meteorId:userId},{$set: {appConfigured:true, currentApp: initialApp, appStatus:'launching'}});//Mark the user as set up. App is launching
										Meteor.users.update({_id:userId},{$set: {devwik:{}}});//Create a devwik object for the user
							console.log('createUser.sh');
							Devwik.app.launch(userId, 'createUser.sh');
									}).run();
									/*
								} else {
									console.log('###Proxy new user error:' + response);                                        
								}
								*/
							});
						}
						//Meteor.users.update({_id:userId},{$set: {devwik:{}}});//Create a devwik object for the user
						if(Devwik.envType != 'prod') {//on the server
							Devwik.app.launch(userId, 'createLocalUser.sh');
						}
					}
			});
		}).run();
	}
};
