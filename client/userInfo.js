Devwik.newUserCallBack = function() {
	//Find out when the document has been inserted into the db
	var query = DevwikUsers.find({meteorId:Meteor.userId()}); 
	Devwik.reloading = $('<h2>Loading App</h2>').dialog();//show "loading notice to the user
	Devwik.set('reloading', true);
	Devwik.User.waitForRunning();
};


 //Create the object
 Devwik.User = function(args) {
	 var user = Meteor.user();
	 console.log('User:' + user + " id:" + Meteor.userId() + " creatingAccount:" + Devwik.Globals.creatingAccount + " user.devwik:" + user.devwik);
	 if((user && user.devwik) || Devwik.Globals.creatingAccount) { //Should not display the config dialog
		 Devwik.Globals.userConfigured = true;
		 Devwik.set('userConfigured', true);
		 if ( Devwik.Globals.initialDialog) {
			 Devwik.Globals.initialDialog.dialog( "close" );//hack. Shouldn't be displayed 
		 }
		 console.info('user configured');
			Devwik.Editor.stateMachine();
	 } else {
		 Devwik.set('userConfigured', false);
		 console.info('creating new user 2');
		Devwik.Globals.initialDialog = $( "#initialDialog" ).dialog({
				 title: 'Set up your app',
				 width: 600,
				 height: 400,
				 modal: true,
				 autoopen:false,
				 buttons: {
					 "Create Your App": function() {
						 var app = $('.ui-dialog-content input:radio[name=devwikApp]:checked').val(); 
						 console.log('chosenApp:' + app);
						 Devwik.Globals.creatingAccount = true;
						 Meteor.call('newUser', app,  Devwik.newUserCallBack);
						 $( this ).dialog( "close" );
					 }
				 },
				 close: function() {
					 //allFields.val( "" ).removeClass( "ui-state-error" );
				 }
		 });
		 Devwik.Globals.initialDialog.dialog('open');
		 Devwik.set('initialDialog', true);
}
 };

 Devwik.User.waitForRunning = function(){
	 var devwikUser = DevwikUsers.findOne({meteorId:Meteor.userId()});
	 if (devwikUser && devwikUser.appStatus == 'running') {//ready to rock and roll
		 Devwik.set('userConfigured', true);
		 return;
	 } else {
		 Meteor.setTimeout(Devwik.User.waitForRunning, 500);//Keep checking. 
	 }
};

	// Run when the page is ready to run
	Meteor.startup( function ( ) {
		Meteor.setTimeout(fixLoginCss,500);//Match the meteor logiin CSS to the current theme
		//Should be able to do it without setInterval but doesn't seem to work
		 Devwik.set('userConfigured', false);//initially user is not configured
		Meteor.autorun(function() {
			/* Cases:
			 * User is not logged in 
			 ** User logs in
			 *** logs in first time -- not configured
			 *** logs in configured
			 ** user comes to the page and is logged in
			 *** first time -- not configured
			 *** configured 
			 */
			//console.log("Autorun" +
					//" logged in:" + Meteor.userLoaded() + 
					//" user Configured:" + Session.get('userConfigured'));
					if ( Meteor.user() && !Meteor.loggingIn()) {
						console.log('user:' + Meteor.user().username + " devwik:" + Meteor.user().devwik);
				Devwik.setupGlobals();//reset all vars when user is first loaded
				Meteor.setTimeout(fixLoginCss,500);//Match the meteor logiin CSS to the current theme
				Devwik.Globals.userLoggedIn = true;
				if(!Devwik.Globals.currentUser) {
					Devwik.Globals.currentUser = new Devwik.User();
				}
			} else {
				if (Devwik.Globals.userLoggedIn) {//was logged in
				$(".ui-dialog-content").dialog("close");//close all open dialogs on log out
				Devwik.Globals.userLoggedIn = false;
				location.reload();
				}
			}
		});
	});


