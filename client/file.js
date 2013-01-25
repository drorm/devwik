/*
 * File Object:
 * Handle files and directories
 */

Devwik.File  = function() {};

Devwik.File.create = function (isDir) {
	//Event handler when Create File menu is clicked
	$( "#newFileDialog" ).dialog({
			title: 'Create File',
			width: 600,
			height: 400,
			modal: true,
			buttons: {
				Save: function() {
					var folderId = Session.get('devwikFolderChosen');
					var fileName = $('#devwikFileName').val();
					console.log('Folder:' + folderId);
					console.log('Name:' + fileName);
					if(!fileName || !folderId) {
						$('#devwikFileNameError').hide().html('<p class="text-error">Please choose a folder and enter a name</p>').fadeIn();

					} else {
						var fullpath = '';
						if (folderId == 'rootHref') {//special treatment for the root folder
							folderId = null; //Root
							fullPath = ''; //let the server handle figuring out the full path
						} else {
							folderId = folderId.replace(/^href-folder-/, "");//get the pure id    
							folder = FileList.findOne(folderId);
							fullPath = folder.fullPath + '/' + fileName; //won't work on Windows?
						} 
						console.log('Insert:' + fileName + " path:" + fullPath + " parent:" + 
								folderId + ' isDir:' + isDir);
							//TODO: error handling
							var fileId = FileList.insert({userId:Meteor.userId(), name: fileName, isDir: false, text: '', fullPath: fullPath, parent:folderId});
							$('#devwikFileNameError').empty();
							//$( this ).dialog( "close" );
							if(isDir) {//create a directory
								Meteor.call('createDir', fileId, Devwik.File.callBack);
							} else {//creating a file. Open the editor
							var file = FileList.findOne(fileId);
							Template.editor.createEditor(file);
							}
							$( this ).dialog( "close" );
					}
				},
				Cancel: function() {
					$( this ).dialog( "close" );
				}

			},
			close: function() {
				//allFields.val( "" ).removeClass( "ui-state-error" );
			}
	});
};

/**
 * Devwik file callback: Gets called after a file operation on the server
 * 
 * @param {Object} error: the error message from the server
 * @param {String} result: the message from the server on success
 */
Devwik.File.callBack = function (error, result) {
	if (error) {
		console.log('callback error:' + error);
		alert(_.values(error));
		console.log(_.values(error));
	} else {
		console.log('callback :' + result);
		Devwik.Tools.message(result, 7000);
	}
};

//

Devwik.File.rename = function (file) {
	//
	var id = file._id;
	var el = $('#' + file._id + ' a');
	console.log(el);
	console.log('rename:' + file.name);
	var inputId = 'input-' + id;
	console.log(id);

	console.log('original text:' + file.name);
	var form = $('\
		<form class="well">\
		<input id="' + inputId + '"type="text" class="input-medium" class="editBox" value="' + file.name + '" />\
		</form>');

	form.dialog({
			title: 'Rename',
			width: 300,
			height: 200,
			modal: true,
			autoopen:false,
			buttons: {
				"Rename": function() {
					console.log(inputId);
					console.log('rename:' + file.name + ' to:' + $('#' + inputId).val());
					var newName = $('#' + inputId).val();
					Meteor.call('renameFile', file._id, newName, Devwik.File.callBack);
					$( this ).dialog( "close" );
				},
				Cancel: function() {
					$( this ).dialog( "close" );
				}
			}
	});
	form.dialog('open');
};


Devwik.File.archive = function (file) {

	//Need a cutom callback to handle undo
	callBack = function (error, result) {
		if (error) {
			console.log('callback error:' + error);
			alert(_.values(error));
			console.log(_.values(error));
		} else {
			//Function that gets called when undo is clicked
			var undoArchive = function (id) {
				console.log('undo' + id);
				Meteor.call('undoArchive', result.id, Devwik.File.callBack);
			};

			console.log('callback :' + result.message + 'id:' + result.id);
			var undo = Devwik.Tools.link(' Undo ', undoArchive);
			Devwik.Tools.message(result.message + undo);
		}
	};

	Meteor.call('archiveFile', file._id, callBack);
};

