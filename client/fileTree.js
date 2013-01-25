/*
 * File tree displayed on the left side.
 */

var devwikFileTree;

Template.devwikFileTree.rendered = function() {
	if(Devwik.get('fileTree')) {//already created it
		if (devwikFileTree) {
			$('#fileTree').html(devwikFileTree.ul); //just bind it
		}
	} else {
		devwikFileTree = new Devwik.FileTree(); //create it
	}
	};

	(function(){
			/* Devwik.FileTree: A tree to show the files from the OS
			 * 
			 * @constructor
			 * @param {object} file: Meteor document
			 */

			Devwik.FileTree = function() {

				self = this;
				if(!$('#fileTree').html()) { //not initialized
					return;
				}

				console.log('Setting file tree');

				//Create the root of the tree
				self.ul = $('\
					<ul id="devwikTreeRoot">\
					</ul>');
				$('#fileTree').html(self.ul);
				Devwik.set('fileTree', true);

				//Create the root of the folder tree. It's used in create file and others
				//to specify where the files goes
				self.folderTree = $('\
					<ul>\
					<li id="devwikFRoot">\
					<i class="icon-folder-open"></i>\
					<a id="rootHref" href="#">Root</a>\
					<ul id="devwikFolderRoot">\
					</ul>\
					</li>\
					</ul>');
				$('#fileDirTree').html(self.folderTree);
				Devwik.FileTree.folderClicked('rootHref');//Handle click events on the root


				//Collect the leaves who's parent hasn't loaded yet
				DeferredList = new Meteor.Collection(null);

					/*
					 * Setup observing the file list so we're notified when files are loaded/removed from 
					 * the server
					 */
				var query = FileList.find({},{sort:{order:1}});
						var handle = query.observe({
								added: function (file, index) {
									//var total = FileList.find().count();
									//console.log('adding:' + file.order);
									Devwik.FileTree.add(file);
								},
								removed: function (file, index) {
									//var total = FileList.find().count();
									//console.log('removing:' + file.order);
									Devwik.FileTree.remove(file);
									if (file.isDir) {//If it's a directory
										Devwik.FileTree.removeFolderTree(file);
									}
								},
								changed: function (file, index) {
									if (file.isDir) {//If it's a directory
										var newHref = '<i class="icon-folder-close"></i>' + file.name;
										$('#' + file._id + ' a').html(newHref);
									} else {
										$('#' + file._id + ' a').text(file.name);
									}
								}
						});

					};

					/* 
					 * Add a file to the tree
					 * 
					 * @param {object} file: Meteor document
					 */


					Devwik.FileTree.add = function(file) {
						var parentId = '#devwikTreeRoot';
						if (file.parent) {
							parentId = '#ul-' + file.parent;
							if($(parentId).length === 0) {//parent is not loaded yet
								DeferredList.insert({parent:file.parent, file:file});
								return;
							}
						}
						//console.log(parentId);

						this.addContexMenu(file);
						var hrefId = 'href-' + file._id;
						if (file.isDir) {//If it's a directory
							Devwik.FileTree.addFolderTree(file);//Add to the folder tree
							//<a id="' + hrefId + '" href="#" rel="tooltip" title="Right click for options"> ' +
							$(parentId).append('<li id="' + file._id + '">\
								<a rel="tooltip" title="Right click for options" id="' + hrefId + '" href="#"> ' +
							//load the directories closed
									'<i class="icon-folder-close"></i>' +
									file.name +  '</a><ul style="display:none" id="ul-' + file._id + '"></ul></li>');

								//Hide and show the directory contents on click
								$('#' + hrefId).on("click", function(event){ //Clicked on it
									folderClicked(event.target.id);
								});
								/* TODO: Make click on icon work
								$('#' + hrefId + ' > i').on("click", function(event){ //Clicked on it
									folderClicked(event.target.id);
								});
								*/
								function folderClicked(id) {
									var iconId =  $('#' + id + ' i');
									var ulId = $('#' + id + ' ~ ul');//Find the corresponding UL
									//var ulId = $(event.target).find('ul');
									if (iconId.hasClass('icon-folder-open')) { //It's open let's close it
										ulId.slideUp();
										iconId.removeClass('icon-folder-open');
										iconId.addClass('icon-folder-close');
									} else { //It's closed let's open it
									ulId.slideDown();
									iconId.removeClass('icon-folder-close');
									iconId.addClass('icon-folder-open');
									}
								}
								//Now let's see if there are any deferred files need inserting
								var query = FileList.find({},{sort:{order:1}});
								var deferredList = DeferredList.find({parent:file._id});//
								deferredList.forEach(function (deferred) {
									//console.log("inserting deferred" + deferred.file.name + " into:" +  file.name);
									Devwik.FileTree.add(deferred.file);
								});
						} else { //It's a regular file
						$(parentId).append('<li id="' + file._id + 
								'"> <a href="#" rel="tooltip" title="Right click for options"> ' +
								file.name +  '</a></li>');
							$('#' + file._id).on("click", function(event){
								Devwik.Editor.tabSelected(file);
							});
						}
					};

					/* 
					 * Remove a file from the tree
					 * 
					 * @param {object} file: Meteor document
					 */
					Devwik.FileTree.remove = function(file) {
						$('#' + file._id).remove();
					};


					Devwik.FileTree.addFolderTree = function(file) {
						var parentId = '#devwikFolderRoot';
						if (file.parent) {
							parentId = '#ul-folder-' + file.parent;
						}

						//need to add the prefix to avoid conflict with the regular tree 
						var hrefId = 'href-folder-' + file._id;
						$(parentId).append('<li id="' + file._id + '">\
							<a id="' + hrefId + '" href="#"> ' +
								'<i class="icon-folder-open"></i>' +
								file.name +  '</a><ul id="ul-folder-' + file._id + '"></ul></li>');
							//Hide and show the directory contents on click
							Devwik.FileTree.folderClicked(hrefId);
					};

					/* 
					 * Remove a file from the tree
					 * 
					 * @param {object} file: Meteor document
					 */
					Devwik.FileTree.removeFolderTree = function(file) {
						$('#' + file._id).remove();
					};

					Devwik.FileTree.addContexMenu = function(file) {
						$.contextMenu({
								selector: '#' + file._id,
								callback: function(key, options) {
									var m = "clicked: " + key;
									window.console && console.log(m) || alert(m); 
								},
								items: {
									"id": {name: file.name, callback: function(key, opt){}},
									"sep1": "-----------",
									"rename": {name: "Rename", callback: function(key, opt){ Devwik.File.rename(file);}},
									"delete": {name: "Delete", callback: function(key, opt){ Devwik.File.archive(file);}}
								}
						});

						$('.context-menu-one').on('click', function(e){
							console.log('clicked', this);
						});
					};


					Devwik.FileTree.folderClicked = function(hrefId) {
						$('#' + hrefId).on("click", function(event){ //Clicked on it
							var id =  event.target.id;
							var iconId =  $('#' + id + ' i');
							var ulId = $('#' + id + ' ~ ul');//Find the corresponding UL
							var previousChosen = Session.get('devwikFolderChosen');
							if (previousChosen) {
								$('#' + previousChosen).removeClass('label-warning');
							}
							$('#' + id).addClass('label-warning');//show it as chosen
							Session.set('devwikFolderChosen', id);
							id = id.replace(/^href-folder-/, "");//get the pure id
							//var ulId = $(event.target).find('ul');
							if (iconId.hasClass('icon-folder-open')) { //It's open let's close it
								ulId.slideUp();
								iconId.removeClass('icon-folder-open');
								iconId.addClass('icon-folder-close');
							} else { //It's closed let's open it
							ulId.slideDown();
							iconId.removeClass('icon-folder-close');
							iconId.addClass('icon-folder-open');
							}
						});
					};

	}) ();

