/*
 * Editor Object and templating:
 */


var myId = new Date() + Math.random();//Create a unique id for this client
Template.editor.editTabs = new Array();

Template.editor.events = {
	'click .osfile' : function () {
		Devwik.set("selected_osfile", this._id);
		Devwik.Editor.tabSelected();
	}
	};

	Handlebars.registerHelper('userConfigured', function () {
		return Session.get('userConfigured');
	});

	Template.devwikApp.rendered = function() {
		Devwik.set("devwikTemplateLoaded", true);
		Devwik.Globals.templateLoaded = true;
	};

	Template.devwikTabs.rendered = function() {
		Devwik.EditTab.setup(); //set up the tabs
	};

	Template.editor.rendered = function() {
		Devwik.set('editorLoaded', true);
	};

	Devwik.Editor.tabSelected = function (osfile) {
		//var osfile = FileList.findOne(Session.get("selected_osfile"));
		//var osfile = FileList.findOne(id);
		Session.set('selected_osfile', osfile);
		var exists = false;
		//Let's find out if it's already open
		if (osfile && osfile.text) {
			var ii = 0;
			$('#tabs ul li a').each(function(){
				if ($(this).text() == osfile.name) { //already opened
					exists = true;
					$( "#tabs").tabs("select", ii);//make it the current tab
					var editTab = Template.editor.editTabs[ii+1];
					var codeMirror = editTab.getEditor();
					codeMirror.focus();
				}
				ii++;
			});
			if (!exists) { //Not open. Let's create a new one
				Template.editor.createEditor(osfile);
			} 
		}
		return osfile && osfile.text;
	};

	//Show the list of files from the file system that we're editing
	Template.editor.osfiles = function () {
		return FileList.find({}, {sort: {order: 1}});
	};

	//Show the lines from the console: the output of what's happening on the server side
	Template.editor.consoleLines = function () {
		return ConsoleLines.find({}, {sort: {inserted: -11}});
	};

	//Track changes to files that are being edited
	Template.editor.filechanges = function () {
		return FileChanges.find({}, {});
	};

	//Show the name of the app we're working on
	Template.editor.appName = function () {
		if ( Meteor.user() && !Meteor.loggingIn()) {
			var user = DevwikUsers.findOne({meteorId:Meteor.userId()});
			if (user) {
				return(user.currentApp);
			}
		}
		return('');
	};


	//Save a file. Send a call to the server to do the save
	//TODO: not really part of the template. Move it somwhere else
	Template.editor.save = function (id, tabNum) {
		var osfile = FileList.findOne({_id:id});
		Session.set('selected_osfile', osfile);
		var codeMirror = Template.editor.editTabs[tabNum-2].getEditor();
		Meteor.call('saveFile',id,  codeMirror.getValue(), Devwik.File.callBack);
	};

	//Create an editor inside a tab
	//TODO: not really part of the template. Move it somwhere else
	Template.editor.createEditor = function (osfile) {
		var currentTab = "tab-" + Devwik.Globals.tab_counter;
		$current_tab_content = $('<div></div>');
		$current_tab_content.append("<button class='btn-primary' onclick='Template.editor.save(\"" + 
				osfile._id + "\"," + Devwik.Globals.tab_counter + ")' type='button'>Save</button>" +
				"<p id='" + currentTab + "'>   </p>");
			$( "#tabs").tabs( "add", "#tabs-" + Devwik.Globals.tab_counter, osfile.name );
			var el = document.getElementById(currentTab);
			var extension = osfile.name.replace(/^.*\./, "");
			var fileType = 'text';
			if(osfile.name == extension) {
				extension = '';//no extension
			}
			switch (extension) {
			case "js":
				fileType = 'javascript';
				break;
			case "css":
				fileType = 'css';
				break;
			case "html":
				fileType = 'text/html';
				break;
			default:
				fileType = 'text';
				break;
			}

			var user = DevwikUsers.findOne({meteorId:Meteor.userId()});
			mode = user.editorType;
			if (!mode) {
				mode = 'default';
			}
			console.log("mode:" + mode);
			Devwik.Globals.myCodeMirror = CodeMirror(el, {
					value: osfile.text,
					lineNumbers: 'true',
					autofocus: 'true',
					mode:  fileType,
					keyMap: mode,
					onChange:  function (editor, params) {
						if (Devwik.Globals.isSyncing) {
							return;//Don't do anything while syncing from other people
						}
						var dmp = new diff_match_patch();
						var text1 = osfile.text;
						if (this.currentText) {
							text1 = this.currentText;
						}
						var text2 = Devwik.Globals.myCodeMirror.getValue();
						//$("#markdown").html( marked(text2));
						patches = dmp.patch_make(text1, text2);
						var textpatch = dmp.patch_toText(patches);
						FileChanges.insert({fileName: osfile.name, patches: textpatch, applied:false, userId:Meteor.userId(), changerId:myId}); //myId for when same user logged in on different browsers. Should use a group id.
						this.currentText = text2;
					}
			});

			/*
			 //Handle markdown code
			 if (extension == 'md') {
			 $("#markdown").html( marked(osfile.text));
		 }
		 */

			var editTab = new Devwik.EditTab({name: osfile.name, editor: Devwik.Globals.myCodeMirror, text: osfile.text});
			Template.editor.editTabs.push(editTab); //save it
			$( "#tabs").tabs( "select", Devwik.Globals.tab_counter - 1);
			Devwik.Globals.myCodeMirror.focus();
			Devwik.Globals.tab_counter++;
		};




		function findTab(name) {
			var ii = 0;
			var found = -1;
			$('#tabs ul li a').each(function(){
				if ($(this).text() == name) {
					found = ii;
				}
				ii++;
			});
			return(found);
		}

		//TODO: why are the following just loose in here?
		var query = FileChanges.find({applied:false}); 
		var handle = query.observe({
				added: function (change) {
					//console.log('change myid:' + myId + " change:" + change.changerId);
					if (change && (myId != change.changerId)) {
						var tabNumber = findTab(change.fileName);
						if (tabNumber > -1) { //File is opened
							tabNumber--;//ignore the first tab "intro"
							var editTab = Template.editor.editTabs[tabNumber];
							var codeMirror = editTab.getEditor();
							var currentText = editTab.getCurrentText();
							var dmp = new diff_match_patch();
							var patches = dmp.patch_fromText(change.patches);
							var result = dmp.patch_apply(patches, currentText);
							Devwik.Globals.isSyncing = true; //So we don't send these changes to other people. 
							codeMirror.readOnly = true;//avoid race condition
							codeMirror.setValue(result[0]);
							codeMirror.readOnly = false;
							Devwik.Globals.isSyncing = false;
							editTab.setCurrentText(result[0]);
							//FileChanges.update({name:fileName}, {$set: {applied:false}}); 
						}
					}
				}
		});


		/*
		 * Set a session variable, and then check if anything needs to be done
		 */
		Devwik.set = function(variable, data) {
			//console.log('setting:', variable);
			Session.set(variable, data);
			Devwik.state[variable] = data;
			Devwik.Editor.stateMachine();
		};

		Devwik.get = function(variable) {
			if(Devwik.state && Devwik.state[variable]) {
				return (Devwik.state[variable]);
			}
			return (false); //null?
		};

		Devwik.appLoaded = false;

		/*
		 * Takes an action based on state of things
		 */
		Devwik.Editor.stateMachine = function () {
			//Only checking for true states. Don't care about false or other options
			var state = Devwik.state;

			/*
			 var templateLoaded = Session.get('templateLoaded');
			 var userConfigured = Session.get('userConfigured');
			 var tabsConfigured = Session.get('tabsConfigured');
			 */


			//Additional states
			var devwikUser = DevwikUsers.findOne({meteorId:Meteor.userId()});
			var appStatus = undefined;
			if (devwikUser) {
				appStatus = devwikUser.appStatus; //App we're working on is running, loading, etc
			}
			var userLoaded = (Meteor.user() && !Meteor.loggingIn());
			/*
			console.info("User:" + userLoaded +  ' loggingin:' + Meteor.loggingIn() +  ' user:' + 
				devwikUser + " appStatus:" + appStatus + ' states:' + 
				Devwik.objectProperties(Devwik.state, ' '));
				*/
			if (userLoaded && devwikUser && state.userConfigured && state.tabsConfigured) {
				 if ( Devwik.Globals.initialDialog) {
					console.log('closing inital dialog');
					Devwik.Globals.initialDialog.dialog( "close" );
				}
					Devwik.Menu();//Initiate menu events
				if(Devwik.appLoaded) {
					if (state.reloading && (devwikUser.appStatus === 'running')) {
						//App finished reloading, or new user
						Devwik.reloading.dialog('close');//Close "loading" notice
						loadApp(); //Display the app dialog
						Devwik.set('reloading', false);
					}
				} else  { //Page just loaded
					Meteor.call('loadAppFiles'); //load the app files into the sidebar
					Devwik.appLoaded = true; //do it once
					if (appStatus == 'running') { //App is ready to go
						loadApp(); //Needs both user configured and template finished loading
					}
				}
			}
			};
