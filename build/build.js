// Main entry for p18 build script
var fs = require("fs");

var cssBuilder = require("./css");
var templatesBuilder = require("./templates");

templatesBuilder.build(function() {
	cssBuilder.build(function(cssHash) {
		var headersFile = "../static/templates/headers_live.html";
		var livetemplate = fs.readFileSync(headersFile).toString();
		livetemplate = livetemplate.replace(/\$CSSHASH/g, cssHash);
		fs.writeFileSync(headersFile, livetemplate);
	});
});

