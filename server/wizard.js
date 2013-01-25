var fs = __meteor_bootstrap__.require('fs');


/**
 * Devwik.Wizard: Wizard to create a new app
 * 
 * @constructor
 * @param {object} args configuration
 * The Constructor recognizes the following properties 
 * \code
 *property name  | type        | description
 *-------------------------------------------------------------------------------------------------
 *      userId   | String      | Id of the user
 *      appName  | String      | Name of the app
 *      layout   | String      | Name of the layout we're using
 *      theme    | String      | Name of the them we're using
 *      login    | boolean     | Includ signup and logic capabilities
 *      pages    | string array| List of pages we're creating
 *      		
 *
 * \endcode
 */

Devwik.Wizard = function (args) {
	var self = this;
	var id = args.userId;
	var user = DevwikUsers.findOne({meteorId:id}); 
	var meteorUser = Meteor.users.findOne({_id:id}); 
	var rootDir = Devwik.userRootDir(meteorUser.username, user.userNumber);

	//CONSTANTS
	var templateDir = 'public/wizard/template/'; //where we keep all the files related to the wizard
	var scaffoldDir = templateDir + 'scaffold/'; //The basic directory layout of the app
	var themeDir = templateDir + 'themes/';  //The bootstrap themes
	var layoutDir = templateDir + 'layouts/'; //The bootstrap page layouts
	console.log('----------------------');

	//List of conversion to apply to each page 
	//This is our primitive templating engine
	var conversions = {
		'###siteName###': args.appName
	};

	if(args.login) { //Yes login
		conversions['###siteLogin###'] = '{{> devwikLogin}}';
	} else { //No login
	conversions['###siteLogin###'] = '';
	}

	createMenuAndRoutes();
	_.each(conversions, function(value,key) {
		console.log(key + ':' + value);
	});

	//Copy the directory tree
	//First make the root
	var destinationDir = rootDir + args.dirName +'/';
	fs.mkdirSync(destinationDir);
	//copy the tree
	copyDir(scaffoldDir, destinationDir);

	console.log('-- Theme --------------------');
	//copy the theme
	var themeFile = args.theme +'.css';
	copyFile(themeDir + '/' +  themeFile , destinationDir + '/client/css/' + themeFile );

	console.log('-- layout --------------------');
	//copy the layout
	console.log(layoutDir + args.layout + " to:" +  destinationDir + '/client/html');
	copyDir(layoutDir + args.layout + '/', destinationDir + '/client/html/layout/');

	//generate the pages
	console.log('-- pages --------------------');
	generatePages();
	//Done. Insert the app into the db
	Devwik.app.addApp(rootDir, this.userId, args.dirName);

	/*
	 * Create the pages
	 */
	function generatePages() {
		//For each page
		_.each(args.pages, function(page) {
			console.log(page);
			var lower = page.toLowerCase();
			if(lower !== 'home') {
				//add a new page
				var pageConversions = conversions;//custom version for this page
				conversions['###pageName###'] = page;
				conversions['###lowerPageName###'] = lower;
				//create the file from the template
				filterFile(layoutDir + args.layout + '/template.html', destinationDir + 
						'/client/html/pages/' + lower + '.html');
			}
		});
	}

	/*
	 * Create the bootstram menu and routes
	 */
	function createMenuAndRoutes() {
		var menu = '';
		var route = '';
		//For each page
		_.each(args.pages, function(page) {
			//Add something like <li><a href="/about">About</a></li> for each page
			console.log(page);
			var lower = page.toLowerCase();
			if(lower !== 'home') {
				//add a menu item
				menu += '<li><a href="/' + lower + '">' + page + '</a></li>\n';
				//add a route
				route += "'/" + lower + "': 'devwik"+ page + "',\n";
			}
		});
		//Add to the list of filter conversions
		conversions['###siteMenu###'] = menu;
		conversions['###siteRoute###'] = route;
	}

	//Recursively copy the directory tree
	function copyDir(baseDir, destinationDir, parent) {
		var files = fs.readdirSync(baseDir);
		for (var ii = 0; ii < files.length; ii++) {
			var fileName = files[ii];
			var fromFile = baseDir + fileName;
			var toFile = destinationDir + fileName;
			var stats = fs.statSync(fromFile);
			if (stats.isDirectory()) {
				console.log('directory:' + toFile);
				fs.mkdirSync(toFile);
				copyDir(fromFile + '/', destinationDir +  fileName + '/');//Recursively traverse
			} else if (stats.isFile()) {
				var extension = fileName.split('.').pop();
				var content = fs.readFileSync(fromFile, 'utf8');
				switch (extension) {
				case 'js':
					filterFile(fromFile, toFile);
					break;//OK Jslint, happy?
				case 'html':
					filterFile(fromFile, toFile);
					break;
				case 'css':
					filterFile(fromFile, toFile);
					break;
				default:
					console.log('file:' + fromFile + " copy");
					copyFile(fromFile, toFile);
					break;//just copy these
					//var id = FileList.insert({userId:userId, name: fileName, isDir:false, text: content, fullPath: fromFile, parent:parent});
				}
			} //ignore when it's not a file or a directory
		}	
	}

	function copyFile(fromFile, toFile) {
		console.log("copy from: " + fromFile + " to:" + toFile);
		var toStream = fs.createWriteStream(toFile);
		var fromStream = fs.createReadStream(fromFile);
		fromStream.pipe(toStream);
	}

	function filterFile (fromFile, toFile) {
		console.log("filter from: " + fromFile + " to:" + toFile);
		var content = fs.readFileSync(fromFile, 'utf8');
		var newContent;
		_.each(conversions, function(value,key) {
			var regex = new RegExp(key, 'g');
			newContent = content.replace(regex, value);
			content = newContent;
		});
		fs.writeFileSync(toFile, newContent);

	}

	};

	/*
	 * Calls from the client
	 */

	Meteor.methods({
			/*
			 * Generate the app based on the input from the user
			 */
			generateApp: function (appInfo) {
				var appName = '';
				try {
				appInfo.userId = this.userId;//Add the user id info
				appInfo.dirName = appInfo.appName.replace(/[^\w.]/g, "");//Also the app's name in app list
				appName = new Devwik.Wizard(appInfo);
				console.log('------------------');
				console.log(this);
				console.log(appInfo);
				} catch(except) {
					console.log(except.message);
					if (except.stack) {
						console.log(except.stack);
					}
					throw new Meteor.Error(except.message);
				}
				return(appInfo.dirName);
			}
	});

	Meteor.startup(function () {
		//For testing
		/*
		var appInfo = new Object();
		appInfo.appName = 'Cool Devwik App';
		appInfo.layout = 'fluid';
		appInfo.theme = 'spacelab';
		appInfo.login = true;
		appInfo.pages = ['Home','Product','About','Contact'];
		new Devwik.Wizard(appInfo);
		*/
	});
