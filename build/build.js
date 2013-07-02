// Main entry for p18 build script
var fs = require("fs");

var cssBuilder = require("./css");
var templatesBuilder = require("./templates");

templatesBuilder.build(function() {
	cssBuilder.build(function(cssHash) {
		fs.writeFileSync("/var/www/p18_csshash", cssHash);
	});
});

