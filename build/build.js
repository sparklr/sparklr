// Main entry for p18 build script
var fs = require("fs");

var cssBuilder = require("./css");
var jsBuilder = require("./js");
var templatesBuilder = require("./templates");

global.buildData = {};

templatesBuilder.build(function(templateData) {
	jsBuilder.build(templateData, function() {
		cssBuilder.build(function() {
			// build complete, write the buildData
			fs.writeFileSync("out/build.js", "module.exports=" + JSON.stringify(global.buildData));
		});
	});
});

