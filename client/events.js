
function setTheme(themeName) {
	var themePath = "bootstrap/css/" + themeName;
	var navbarTextColor = $(".navbar .nav > li > a").css("color");
	$('#currentTheme').remove();
	$('head').append('<link id="currentTheme" rel="stylesheet" href="' + themeName + 
			'" type="text/css" />');
		//Meteor.setTimeout(fixLoginCss, 2000);
		//fixLoginCss();
}


/*
 * Navbar is bootstrap. Login button is from Meteor. Fix the color of the login button to match
 * the Bootstrap theme.
 */
function fixLoginCss() {
	var navbarTextColor = $(".brand").css("color");
	$("#login-name-link").css('color', navbarTextColor);
	$("#login-sign-in-link").css('color', navbarTextColor);
}

var themeLoaded = false;

function loadThemes() {
	if (!hasLoaded) { //only do it once
		var themes =new Array("default", //We could just read them from disk
			"cyborg",
			"journal",
			"cerulean",
			"simplex",
			"spruce",
			"readable");
		for (ii = 0; ii < themes.length; ii++) {
			themeName = themes[ii];
			var newTheme = $("<li><a id='" + themeName + "Theme' href=\"#\">" +themeName +"</a></li>");
			$('#themeList').append(newTheme);
			$("#" + themeName + "Theme").click(createCallback(themeName));
		}
		themeLoaded = true;
	}
}


/*
 * Load the app
 */

function loadApp() {
	var noApp = Devwik.getParameterByName('noApp');
	if (noApp) { //For debugging purpose, don't load app
		console.log('noApp is set in URL. not loading the app window ');
		return;
	}

	var user = DevwikUsers.findOne({meteorId:Meteor.userId()});
		var appStatus = user.appStatus;
	if(user.appStatus == 'stopped') {//Some reason the app is not running
		console.log('App is not running, restarting');
		Meteor.call('restartApp');//Restarts the app
		Devwik.reloading = $('<h2>Loading App</h2>').dialog();//show "loading notice to the user
	} else {
		loadAppFrame(); //Display the app window
	}
}

function loadAppFrame() {
	var url = getAppUrl();
	//On dev
	//var url = 'http://' + currentHost + ':' + user.port;
	var user = DevwikUsers.findOne({meteorId:Meteor.userId()});
	var winWidth = $(window).width();
	var winHeight = $(window).height();
	var width = winWidth/12*4;//Make it the size of a bootstrap span4
	var height = winHeight*80/100;//80% of total
	var position = [winWidth/12*7, 65]; //Should be done in CSS
	var appIframe = $("<iframe id='appIframe' iframe frameborder='0' width='" + width + 
			"' height='" + height + "' +	/>").attr("src", url);
		width += 70;
		height += 70;
		Devwik.Globals.appDialog = $("#appOutput").html(appIframe).dialog({
				width:width, 
				height:height, 
				position:position, 
				title: "Your App:" + user.currentApp
		});
		}

function createCallback( name ){
	return function(){
		setTheme('' + name + '.css');
	};
}


	//Event handler when Signup button on home page is clicked
	/* Why the hell doesn't this work?
	$("#signUpButton").on("click", function(event){
		alert("sign up");
		//$('login-dropdown-list').dialog();
	});
	*/
	function devwikSignupMessage() {
		alert("Click on the Sign-in button on the top right, click 'Create Account' and enter your info.");
	}

	/*
	 * Figure out the URL for the current app
	 */
	function getAppUrl() {
		var user = DevwikUsers.findOne({meteorId:Meteor.userId()});
		var currentHost = document.location.hostname;
		var currentPort = document.location.port;
		var username = Meteor.user().username;
		var url;
		if(Devwik.envType == 'prod') { //Production
			url = 'http://' + username + '.' + 'devwik.com'; //TODO: don't hard code it
			if(currentPort && currentPort != 80) {
				url += ':' + currentPort;
			}
		} else { //development
		url = 'http://' + currentHost + ':' + user.port;
		}
		return (url);
	}
