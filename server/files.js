var fs = __meteor_bootstrap__.require('fs');
var sys = __meteor_bootstrap__.require('sys');

Devwik.Files = function() {}; //Create the object/class
//Constants

/*List of files we're handling
 * Structure:
 * name: file name
 * text: content of the file
 * isDir: is it a directory
 * { "userId" : "b998-0fb-046d-4c58-8dc6-8d98772286c7", "name" : "todos.html", "isDir" : false, "text" : "<head>\n template>\n", "fullPath" : "../users/dror@matal.com/apps/todos/client/todos.html", "_id" : "97d6478b-ff30-4724-a096-f418c0cbe664" }
 */
FileList = new Meteor.Collection("FileList");


/*List of changes between sessions
 * Structure:
 * fileName: file name
 * Patches: textual representation of the patch
 * Applied: have the patches been applied
 * client: id of the client that originated the patch
 */
FileChanges = new Meteor.Collection("FileChanges");


/* App console output
 * Structure:
 * type: stdout, stderr, etc
 * message: the actual message
 * userId: the id of the user
 */
ConsoleLines = new Meteor.Collection("ConsoleLines");


/* User record. Meteor has a concept of a user and we build on that.
 * Structure:
 * name: stdout, stderr, etc
 * message: the actual message
 * userId: the id of the user
 * { "_id" : "c9586e4b-9fc5-4997-afeb-997958880bae", "appConfigured" : true, "appStatus" : "running", "currentApp" : "parties", "meteorId" : "f8195807-a4f9-4fb2-9761-5b72875ba974", "port" : 3117 }
 */
DevwikUsers = new Meteor.Collection("DevwikUsers");

/* On sartup
 * Read the list of files and save them and content in a Collection
 */
Meteor.startup(function () {

	function houseCleaning() {
	var userHasMaxPort = DevwikUsers.findOne({}, {sort: {port: -1}});//max port number currently used
	userMaxPort = userHasMaxPort.port + 3;
	console.log("Maxport:" +userMaxPort);
	var dUsers = DevwikUsers.find({}, {sort:{port:1}});
	dUsers.forEach(function (dUser) {
		var user = Meteor.users.findOne({_id:dUser.meteorId}); 
		if(!user) {
			console.log('No user:' + dUser.meteorId);
		} else {
			console.log(user.username, dUser.port, dUser.currentApp);
			if(!dUser.port) {
				console.log('##doesnot have port will assign ' + userMaxPort);
				userMaxPort += 3;
				DevwikUsers.update({_id:dUser._id},{$set: {port:userMaxPort}});//Mark the user as set up. App is launching
			}
		}
	});
	}

	//houseCleaning();

	FileChanges.remove({}); //Clear any old changes


	//Handle File savings
	Meteor.methods({
			//TODO do we need to check to see that files belong to users or just count on the IDs?
			createDir: function (id) {
				var dir = FileList.findOne(id);
				var name = dir.name;

				var fullPath = dir.fullPath;
				console.log("creating dir :" + name + " full:" + fullPath);
				try{
					fs.mkdirSync(fullPath);
				} catch (err) {
					console.log("Caught error:" + err);
					throw new Meteor.Error(err.message);
				}
				console.log("Directory created" + name);
				return("Directory created" + name);
			},

			//Rename a file or directory
			renameFile: function (id, newName) {
				var file = FileList.findOne(id);
				var name = file.name;

				var fullPath = file.fullPath;
				var re = new RegExp(name + '$');//match only the end
				var newFullPath = file.fullPath.replace(re, newName);
				console.log("renaming file :" + name + " full:" + fullPath + ' to:' + newName + 
						' new path:' + newFullPath);
					try{
						console.log("renaming file :" + name + " full:" + fullPath);
						fs.renameSync(fullPath, newFullPath);
						FileList.update({_id:id},{$set: {name: newName, fullPath:newFullPath}});
					} catch (err) {
						console.log("Caught error:" + err);
						throw new Meteor.Error(err.message);
					}
					console.log("file renamed:" + newName);
					return ('file renamed:' + newName);
			},

			//Archive a file or directory
			archiveFile: function (id) {
				var file = FileList.findOne(id);
				var name = file.name;
				var user = DevwikUsers.findOne({meteorId:this.userId});  
				var meteorUser = Meteor.users.findOne({_id:this.userId}); 
				var userId = user.meteorId;
				var username = meteorUser.username;

				var fullPath = file.fullPath;
				console.log("archiving file :" + name + " full:" + fullPath);
				try{
					var rootDir = Devwik.Files.createUserPath(username, user.currentApp);
					var archivePath = Devwik.userRootDir(username)  + 
						'../archive/';
					//Keep track of the original info about the file. Don't need the actual text
					var now = new Date().getTime();
					var myId = ArchivedList.insert({userId:userId, name: file.name, isDir: file.isDir, text: file.text, fullPath: fullPath, parent:file.parent, order:file.order, ts:now});
					var newPath = archivePath + file.name + '-' +  now;
					console.log('move ' +  fullPath + ' to:' + newPath);
					fs.renameSync(fullPath, newPath);
					FileList.remove({userId: userId, _id:id});
				} catch (err) {
					console.log("Caught error:" + err);
					if (err.stack) {
						console.log(err.stack);
					}
					throw new Meteor.Error(err.message);
				}
				var result = new Object();
				result.message = 'archived:' + name;
				result.id = myId;
				console.log(result);
				return(result);
			},

			//Undo Archive a file or directory
			undoArchive: function (id) {
				var file = ArchivedList.findOne(id);
				var name = file.name;
				var user = DevwikUsers.findOne({meteorId:this.userId});  
				var meteorUser = Meteor.users.findOne({_id:this.userId}); 
				var userId = user.meteorId;
				var username = meteorUser.username;

				var fullPath = file.fullPath;
				console.log("undo archiving file :" + name + " full:" + fullPath);
				try{
					var rootDir = Devwik.Files.createUserPath(username, user.currentApp);
					var archivePath = Devwik.userRootDir(username)  + '../archive/';
					//the name of the archived file is the name of the original + the timestamp
					var oldPath = archivePath + file.name + '-' +  file.ts;
					//will clober existing file, but that's life. TODO: warn
					console.log('Undo would move from' +  oldPath + ' to:' + file.fullPath);
					fs.renameSync(oldPath, file.fullPath);
					FileList.insert({userId:userId, name: file.name, isDir: file.isDir, text: file.text, fullPath: file.fullPath, parent:file.parent, order:file.order});
				} catch (err) {
					console.log("Caught error:" + err);
					throw new Meteor.Error(err.message);
				}
				console.log("file unarchived:" + name);
				return ('Restored:' + name);
			},
			saveFile: function (id, text) {

				var osfile = FileList.findOne(id);
				var name = osfile.name;
				var user = DevwikUsers.findOne({meteorId:this.userId});  
				var meteorUser = Meteor.users.findOne({_id:this.userId}); 
				var userId = user.meteorId;
				var username = meteorUser.username;

				var fileName = osfile.fullPath;
				if(fileName === '') { //file has been created at the root level
					var rootDir = Devwik.Files.createUserPath(username, user.currentApp);
					fileName = rootDir + osfile.name;
					FileList.update({_id:id},{$set: {fullPath:fileName}});//update it in the db
					console.log('created file:' + fileName);
				}
				console.log("file has changed:" + name + " full:" + fileName);
				var newFileName = fileName + '.new';
				var oldFileName = 'old/' + fileName + '.old';
				/*
				 * The dance: Assume the file name is "file"
				 * New version of the file is saved as file.new
				 * Old version is renamed from file to file.old
				 * file.new is renamed to file
				 */
				try {
					//1. We first write the file to disk as file.new
					console.log("saving:" + newFileName);
					//console.log("text:" + text);
					fs.writeFileSync(newFileName, text);
					console.log("file saved:" + newFileName);
					//2. We now rename the original from file to file.old
					try {
						fs.unlinkSync(oldFileName); //first remove the previous one if it exists
					} catch (err) {
						//do nothing. There wasn't an old file
					}
					try {
						fs.renameSync(fileName, oldFileName);
					} catch (err) {
						//do nothing. If it's a new file, the file won't exist
					}
					//3. And we rename the file that we created from file.new to file
					fs.renameSync(newFileName, fileName);
					// We did this whole dance since rename is an atomic operation and the whole 
					// thing will only happen after we've successfully saved the new file
					console.log("file renamed:" + name);
					//and mark the file as saved
				} catch (err) {
					console.log("Caught error:" + err);
					throw new Meteor.Error(err.message);
				}
				console.log("file saved:" + name);
				return ('saved:' + name);
			},
			loadAppFiles: function () {
				try {
					Devwik.Files.loadFiles(this.userId);
				} catch (error) {
					console.log("Caught error:" + error);
					throw new Meteor.Error(error.message);
				}
				console.log("files loaded");
				return ('loaded:');
			}
	});

	Meteor.publish("myDevwikUser", function (userId) {
		return DevwikUsers.find({meteorId:userId});
	});

	Meteor.publish("myFiles", function (userId) {
		return FileList.find({userId:userId});
	});

	Meteor.publish("myLog", function (userId) {
		return ConsoleLines.find({userId:userId});
	});

	Meteor.publish("myChanges", function (userId) {
		return FileChanges.find({userId:userId});
	});

	Meteor.publish("userData", function () {
		return Meteor.users.find({_id: this.userId},
			{fields: {'devwik': 1}});
	});

	//Permissions
	FileChanges.allow({
			insert: function () { return true; },
			update: function () { return false; },
			remove: function (userId, list) { 
				return list.userId !== userId;
			}
	});

	//Permissions
	FileList.allow({
			insert: function (userId, file) { //Users can insert their own files from the client
				var permission = (file.userId === userId);
				return permission;
			},
			update: function (userId, files) { //Users can update their own files from the client
				if(files.length > 1) {
					return (false); //only one at the time
				}
				var file = files[0];
				var permission = ( file.userId === userId);
				return permission;
			},
			remove: function () { return false; }
	});

	//Permissions
	ConsoleLines.allow({
			insert: function () { return false; },
			update: function () { return false; },
			remove: function (userId, list) { 
				return list.userId !== userId;
			}
	});

	DevwikUsers.allow({
			insert: function () { return false; },
			update: function () { return false; },
			remove: function () { return false; }
	});

	DevwikUsers._ensureIndex({ port : 1}, {unique:true});

});

Devwik.Files.createUserPath = function(username, currentApp) {
	console.log(Devwik.envType) ;
	return (Devwik.userRootDir(username)  + currentApp + "/"); 
};

Devwik.Files.loadFiles = function(id) {
		FileList.remove({}); //Clear the list of files from the db and load from file system

		var user = DevwikUsers.findOne({meteorId:id}); 
		//TODO all of these should be part of the devwik user
		var meteorUser = Meteor.users.findOne({_id:id}); 
		var userId = user.meteorId;
		var username = meteorUser.username;

		//Load the list of apps as well
		Devwik.app.loadAppList(Devwik.userRootDir(username), userId);
		var rootDir = Devwik.Files.createUserPath(username, user.currentApp);
		//console.log(rootDir);
		//var rootDir = '../users/' + username + '/apps/' + user.currentApp + "/"; //TODO move constants out
		var jj = 0;
		try {
			FileList.remove({userId:userId});
			console.log('loading files:' + rootDir);
			loadDir(rootDir, userId, null);
		} catch (error) {
			Devwik.consoleLog(error);
		}

		/*
		 * Insert the file ree into the db
		 * @param {string} baseDir The base of the directory path of this branch. Something like "/home/meteor/app/todos/client"
		 * @param {string} userId  The id of the user owning this tree
		 * @param {string} parent. The unique id (_id) of the parent. null means it's the root -- no parent.
		 */
		function loadDir(baseDir, userId, parent) {
			//Load the files from the OS
			var files = fs.readdirSync(baseDir);
			for (var ii = 0; ii < files.length; ii++) {
				jj++;
				var fileName = files[ii];
				if (fileName == '.meteor') { //Ignore meteor's files
					continue;
				}
				var path = baseDir + fileName;
				var stats = fs.statSync(path);
				if (stats.isDirectory()) {
					console.log(jj + ':directory:' + path);
					var myId = FileList.insert({userId:userId, name: fileName, isDir: true, text: '', fullPath: path, parent:parent, order:jj});
					loadDir(baseDir + fileName + '/', userId, myId);//Recursively traverse
				} else if (stats.isFile()) {
					var content = fs.readFileSync(path, 'utf8');
					//Insert into the list
					var id = FileList.insert({userId:userId, name: fileName, isDir:false, text: content, fullPath: path, parent:parent, order:jj});
					console.log(jj + ':file:' + path + " :" + id);
				} //ignore when it's not a file or a directory
			}	
		}
};
