//Create the object
var devwikMenuLoaded = false;
Devwik.Menu = function() {
	if (devwikMenuLoaded) {
		return;
	} 
	console.log('loading menu');
	devwikMenuLoaded = true;
	//Event handler when Create File menu is clicked
	$("#newFile").on("click", function(event){
		Devwik.File.create(false);
	});

	//Event handler when Create File menu is clicked
	$("#newDirectory").on("click", function(event){
		Devwik.File.create(true);
	});
	//
	
	//Event handler to launch the wizard
	$("#wizardMenu").on("click", function(event){
		Session.set('displayWizard', true);
		return(false);
	});

	//Event handler to download the app
	$("#downloadApp").on("click", function(event){
			console.log('download app:');
		Devwik.App.download();
		return(false);
	});

	/*
	//Event handler when for testing
	$("#testMenu").on("click", function(event){
		console.log('test click');
		var downloadMessage = 
			'<div class ="devwikCentered"><h4> Your app is ready.</h4></br>\
		<a class= "btn btn-primary" href="downloads/XXXX"> Download it.</a></br></br>\
		Unpack it, and run Meteor in the new directory.\
		</div>';
		dialog = $(downloadMessage).dialog({
			width: 300,
			height: 200
		});//show the dialog
		return(false);
	});
	*/

	//Event handler when for testing
	$("#testMenu").on("click", function(event){
		console.log('test click');
		Devwik.Tools.dialog('testing 1234', true);
		return(false);
	});


	//Event handler when Setting button is clicked
	$("#setting").on("click", function(event){
		console.log('settings');
		var user = DevwikUsers.findOne({meteorId:Meteor.userId()});
		if(user)
			console.log('Devwik User:' + user);
		$( "#settingsDialog" ).dialog({
				title: 'Setting',
				width: 600,
				height: 400,
				modal: true,
				buttons: {
					"Save": function() {
						var editorType = $('.ui-dialog-content input:radio[name=editorType]:checked').val(); 
						console.log('editorType:' + editorType);
						Meteor.call('saveSettings', editorType);
						$( this ).dialog( "close" );
					}
				},
				close: function() {
					//allFields.val( "" ).removeClass( "ui-state-error" );
				}
		});
	});

	//Event handler when Help button is clicked
	$("#help").on("click", function(event){
		displayDoc('/doc/help.md');
	});

	//Event handler when Help button is clicked
	$("#tour").on("click", function(event){
		displayDoc('/doc/tour.md');
	});

	function displayDoc(doc) {
		//Event handler when Setting button is clicked
		var noCache =  new Date().getTime();//append to avoid caching
		$.get(doc + '?foo=' + noCache, function (data) {
			$help = $('<div id="devwikDoc"></div>');//create the div
			$help.html(marked(data));

			$help.dialog({
					title: 'Help',
					width: 900,
					height: 700,
					modal: false,
					buttons: {
						Cancel: function() {
							$( this ).dialog( "close" );
						}
					}
			});
		});
	}

	//Event handler when Restart App button is clicked
	$("#restartApp").on("click", function(event){
		Devwik.Menu.startApp(false);
	});

	//Event handler when New Browser Window button is clicked
	$("#appNewWindow").on("click", function(event){
		var url = getAppUrl();
		var user = DevwikUsers.findOne({meteorId:Meteor.userId()});
		window.open(url, user.currentApp);
		return false;
	});

	//Event handler when App Console button is clicked
	$("#appConsole").on("click", function(event){
		$('#consoleLines').dialog({
				title: 'Console',
				width: 700,
				height: 500,
				modal: false,
				buttons: {
					Cancel: function() {
						$( this ).dialog( "close" );
					},
					Clear: function() {
						var userId = Meteor.userId();
						ConsoleLines.remove({});
					}
				}
		});
	});


	//Event handler Clear output of side console
	$("#clearConsole").on("click", function(event){
		ConsoleLines.remove({});
	});

	//Event handler for switching apps
	$(".liAppList").on("click", function(event){
		console.log('switch app');
		alert('switch app');
	});

	Devwik.set('devwikMenuLoaded');
	};

	Devwik.Menu.switchApp = function(name) {
		Devwik.Menu.startApp(name);
	};


	/*
	 * Switches or restarts an app. 
	 * When name is null, just restart the current app.
	 * When we have a name, switch to that app 
	 */
	Devwik.Menu.startApp = function(name) {
		console.log('restart app:' + name);
		if (Devwik.Globals.appDialog) {
			Devwik.Globals.appDialog.dialog('close'); //Remove the app from the UI Meteor.call('restartApp');//Restarts the app
		}

		var message;
		if(name) {
			message = '<h2>Starting ' + name + '...</h2> Takes 5-10 seconds.';
		} else {
			message = '<h2>Restarting...</h2> Takes 5-10 seconds.';
		}

		Devwik.reloading = Devwik.Tools.dialog(message, true);//show "loading notice.
		if (Devwik.Globals.appDialog) {
			Devwik.Globals.appDialog.dialog('close');//Close the current app dialog
		}
		Meteor.call('restartApp', name, function() { //Restarts or switches the app on the server
			Meteor.setTimeout(function() {
				Devwik.set('reloading', true);
			}, 2000);
			//State machine will notice when the app is loaded and do the reset
		});
	};


	//Show the apps in the sub-menu
	Template.headerPage.appsList = function () {
		return AppList.find({},{sort: {name: 1}});
	};

