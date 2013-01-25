DevwikUsers = new Meteor.Collection("DevwikUsers");
UserInfo = new Meteor.Collection("UserInfo");
FileChanges = new Meteor.Collection("FileChanges");
FileList = new Meteor.Collection("FileList");
ConsoleLines = new Meteor.Collection("ConsoleLines");
AppList = new Meteor.Collection("AppList");
Meteor.autosubscribe(function () {
	Meteor.subscribe("myDevwikUser", Meteor.userId());
	Meteor.subscribe("myFiles", Meteor.userId());
	Meteor.subscribe('myFiles', function() { 
		  Session.set('filesDoneLoading', true); 
	});
	Meteor.subscribe("myLog", Meteor.userId());
	Meteor.subscribe("myChanges", Meteor.userId());
	Meteor.subscribe("userData", Meteor.userId());
	Meteor.subscribe("appList", Meteor.userId());
});
