/*
 * EditTab Object:
 * Tab with an editor in it.
 */

if (typeof Devwik == 'undefined') {
	/**
	 *   @ignore Namespace definition.
	 *                   */
		Devwik = function() {};
}

//Create the object
Devwik.EditTab = function(args) {
	this.name = args.name; //File name
	this.editor = args.editor;//The codeMirror editor object;
	this.originalText =  args.text;//The original text
	this.currentText =  args.text;//Current tex
	return (true);
};

//Getters
Devwik.EditTab.prototype.getName = function() {
	return(this.name);
};

Devwik.EditTab.prototype.getEditor = function() {
	return(this.editor);
};

Devwik.EditTab.prototype.getOriginalText = function() {
	return(this.originalText);
};

Devwik.EditTab.prototype.getCurrentText = function() {
	return(this.currentText);
};


//Setters

Devwik.EditTab.prototype.setName = function(name) {
	this.name = name;
};

Devwik.EditTab.prototype.setEditor = function(editor) {
	this.editor = editor;
};

Devwik.EditTab.prototype.setOriginalText = function(originalText) {
	this.originalText = originalText;
};

Devwik.EditTab.prototype.setCurrentText = function(currentText) {
	this.currentText = currentText;
};

Devwik.EditTab.setup = function() {
	var $tab_title_input = $( "#tab_title"),
	$tab_content_input = $( "#tab_content" );
	console.log('Configuring tabs');

	// tabs init with a custom tab template and an "add" callback filling in the content
	var $tabs = $( "#tabs").tabs({
			tabTemplate: "<li><a href='#{href}'>#{label}</a> <span class='ui-icon ui-icon-close'>Remove Tab</span></li>",
			add: function( event, ui ) {
				var tab_content = $current_tab_content.html() || "Tab " + Devwik.Globals.tab_counter + " content.";
				$( ui.panel ).append( "<p>" + tab_content + "</p>" );
			},
			show: function(event, ui) {
				if (Devwik.Globals.myCodeMirror) {
					Devwik.Globals.myCodeMirror.refresh();
				}
			}
	});

		// close icon: removing the tab on click
		// note: closable tabs gonna be an option in the future - see http://dev.jqueryui.com/ticket/3924
		$( "#tabs span.ui-icon-close" ).live( "click", function() {
			var index = $( "li", $tabs ).index( $( this ).parent() );
			if (index >= 0) {
				$tabs.tabs( "remove", index );
			}
		});
		Devwik.set('tabsConfigured', true);
};


