// Main entry for p18 build script
var fs = require("fs");

var cssBuilder = require("./css");
var jsBuilder = require("./js");
var templatesBuilder = require("./templates");

templatesBuilder.build(function(templateData) {
	jsBuilder.build(templateData, function(jsHash) {
		fs.writeFileSync("out/p18_jshash_" + process.argv[2] || "", jsHash);

		cssBuilder.build(function(cssHash) {
			fs.writeFileSync("out/p18_csshash_" + process.argv[2] || "", cssHash);
		});
	});
});

