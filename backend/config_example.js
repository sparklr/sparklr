/* Sparklr
 * Example config
 *
 * This must be renamed to config.js, and .gitignore'd
 */

// The url of the static/ working directory, or, if live, the build output dir
global.staticHost = "http://127.0.0.1/p18/static/"

// The url where images are hosted
global.imgHost = "http://127.0.0.1/p18data/";

// Used only on live for the secure login page
global.secureStaticHost = "http://127.0.0.1/p18/static/"

// Uploaded file location
global.storageDir = "/var/www/p18data/";

// Whether to load development or build JS and CSS files
global.liveSite = false;

// Database configuration
global.database = { 
	host: "localhost",
	user: "root",
	password: "",
	database: "p18"
};

// SMTP server
global.smtp = {
	user: "app@sparklr.me",
	password: "",
	host: "smtp.gmail.com",
	ssl: true
};

