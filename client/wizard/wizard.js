/*
 * Devwik Wizard to create an app
 */

/*
 * Tell the template when to display the wizard
 */
Handlebars.registerHelper('displayWizard', function () {
	//console.log('wizard:' +  Session.get('displayWizard'));
	return Session.get('displayWizard');
});


/* 
 * When the wizard HTML is rendered on the page, we run this
 */

Template.devwikWizard.rendered = function ( ) {

	if (typeof Devwik == 'undefined') {
		/**
		 *   @ignore Namespace definition.
		 *                   */
		 Devwik = function() {};
	}


	/*
	 *  Wizard Object 
	 *  Prompt the user for various options and generate a new app on the server
	 */

	Devwik.Wizard = function() {
		self = this;
		self.auth = true; //Did they choose authentication
		self.pages = new Array(); //Which pages they want
		self.theme = 'spacelab'; //default theme
		$('#' + self.theme).addClass('badge-warning');//show it as chosen
		self.layout = 'hero'; //default layout
		$('#' + self.layout).addClass('badge-warning');//show it as chosen
		//{{> bootstrap-fluid}}

		//Before we leave a step to move onto the next check ...
		leaveStep = function(args) {
			//List of pages. Collect all the pages
			var id = args.attr('rel');
			if(id == 4) {
				self.pages = new Array();//clear it in case we've been here before
				$('#step-4  input').each(function(index) {
					var page = $(this).val();
					if (page !== '') {
						self.pages.push(page);
					}
				});
			}
			return(true);
		};

		//When we lend on a new step
		showStep = function(args) {
			var id = args.attr('rel');
			//On the last tab provide a summary
			if(id == 5) {
				var summary = '\
				<h5> Name:' + $("#appName").val() + '</h5>\
				<h5> Layout:' + self.layout + '</h5>\
				<h5> Theme:' + self.theme + '</h5>\
				<h5> Login/Signup:' + self.auth + '</h5>\
				<h5> Pages:' + self.pages+ '</h5>\
				';

				$('#step5Contenets').html(summary);
			}
		};

		//Create the wizard from the HTML
		self.wizard = $('#devwikWizard').smartWizard({
				onLeaveStep:leaveStep,
				onFinish:generateApp,
				onShowStep: showStep});

		//Handling of the first tab in the wizard
		$(".span2 .thumbnail").on("click", function(event){
			var id = this.id;
			if (self.theme) {
				$('#' + self.theme).removeClass('badge-warning');//deselect previously chosen
			}
			self.theme = id;
			$('#' + id).addClass('badge-warning');//show it as chosen
		});

		$("#authenticationButtons button").on("click", function(event){
			if(this.id == 'noAuth') {
				self.auth = false;
			} else {
				self.auth = true;
			}
		});

		//Choose the layout
		$(".layoutThumbnail").on("click", function(event){
			var id = this.id;
			if (self.layout) {
				$('#' + self.layout).removeClass('badge-warning');//deselect previously chosen
			}
			self.layout = id;
			$('#' + id).addClass('badge-warning');//show it as chosen
		});

		//When they want to see a page with the full layout
		$(".layoutButton").on("click", function(event){
			var url = Devwik.Utils.getBaseURL() + '/wizard/bootstrap/';
			var id = this.id;
			url += id.replace('Button', '.html');
			var windowName = id;

			window.open(url, windowName);

		});

		//When they want to see a page with the full theme
		$(".themeButton").on("click", function(event){
			var layout = self.layout;
			if(layout == 'marketing') {//Marketing layout has an issue with showing the theme
				layout = 'hero';
			}
			var themeName = $(event.target).prev().attr('id');
			var windowName = layout + '-' + themeName;
			var url = Devwik.Utils.getBaseURL() + '/wizard/bootstrap/' +  layout + '.html?theme=' + themeName;
			var win = window.open(url, windowName);
		});


	};

	//App has been generated show them the result: success/error
	callBack = function (error, result) {
		console.log('got result:' + result + " error:" + _.values(error));
		if(error) {
			alert(_.values(error));
			console.log(_.values(error));
		} else {
			console.log(result);
			alert('generated:' + result + ', will launch it now.\n Click App =>"App In New Browser Window"\n to view it in a separate window');
			Session.set('displayWizard', false);
			$( "#devwikWizard" ).dialog("close");//Close the wizard
			Devwik.Menu.startApp(result);
		}
	};


	//Called from onFinish
	generateApp = function() {
		console.log('generate');
		var appInfo = new Object();
		appInfo.appName = $("#appName").val();
		appInfo.layout =  self.layout;
		appInfo.theme = self.theme;
		appInfo.login = self.auth;
		appInfo.pages = self.pages;
		Meteor.call('generateApp', appInfo, callBack);
	};


	new Devwik.Wizard();

	$( "#devwikWizard" ).dialog({
			title: 'Wizard',
			width: 1050,
			height: 650,
			modal: true,
			close: function() {
				Session.set('displayWizard', false);
			}

	});
		return(false);
};

