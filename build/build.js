// Main entry for p18 build script
var fs = require("fs");

var cssBuilder = require("./css");
var jsBuilder = require("./js");
var templatesBuilder = require("./templates");

global.buildData = {};

templatesBuilder.build("../templates", function(templateData) {
	templatesBuilder.build("../mobile/templates", function(templateDataMobile) {
		jsBuilder.build(templateData, templateDataMobile, function() {
			cssBuilder.build(function() {

				// build complete, write the buildData
				fs.writeFileSync("out/build.js", "module.exports=" + JSON.stringify(global.buildData));

			});
		});
	});
});

