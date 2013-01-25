/*
 * Storage place for application globals
 * WARNING: Use the object Devwik.Globals in your code NOT Devwik.VariablesGlobal!
 */

Devwik.VariablesGlobal = function() {
	this.currentUser = null;
	this.creatingAccount = false;
	this.addDialog = null;
	this.isSyncing = false;
	this.tab_counter = 2;//1 is the initial tab we're already displaying
	this.myCodeMirror = null; 
	this.reloading = null; 
	this.userLoggedIn = false; 
};

Devwik.Globals = new Devwik.VariablesGlobal();

Devwik.setupGlobals = function() {
	Devwik.Globals = new Devwik.VariablesGlobal();
};

Devwik.state = new Object();
