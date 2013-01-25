/*
 * Devwik App related functionality
 */
Devwik.App = function() {};

/*
 * Tar and download the current app
 */
Devwik.App.download = function() {
	console.log('download app:');
	Meteor.call('zipApp', Devwik.App.zipAppCallback);
};

/**
 * Devwik download callback: Gets called after the zip file is ready
 * 
 * @param {Object} error: the error message from the server
 * @param {String} result: the message from the server on success
 */
Devwik.App.zipAppCallback = function (error, result) {
	if (error) {
		console.log('callback error:' + error);
		alert(_.values(error));
		console.log(_.values(error));
	} else {
		console.log('callback :' + result);
		var downloadMessage = 
			'<div class ="devwikCentered"><h4> Your app is ready.</h4></br>\
		<a class= "btn btn-primary" href="/downloads/' + result + '"> Download it.</a></br></br>\
		Unpack it, and run Meteor in the new directory.\
		</div>';
		dialog = $(downloadMessage).dialog({
				width: 300,
				height: 200
		});//show the dialog
	}
};
