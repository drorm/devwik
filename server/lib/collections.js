if (typeof Devwik == 'undefined') {
	/**
	 *   @ignore Namespace definition.
	 *                   */
	 Devwik = function() {};
}


//Create a new collection. By default user can see items that they own
Devwik.Collection = function(name) {
	var self = this;
	this.collection = new Meteor.Collection(name);

	Meteor.startup(function () {
		Meteor.publish(self.collection, function (userId) {
			return self.collection.find({userId:userId});
		});

	});

	return (this.collection);

};

/*List of apps for the current user
 * Structure:
 * path: full path of the app
 * name: app name. Currently the name of the directory
 */
AppList = new Meteor.Collection("AppList");

Meteor.startup(function () {
	Meteor.publish("appList", function (userId) {
		return AppList.find({userId:userId});
	});
});

ArchivedList = new Devwik.Collection("ArchivedList");

