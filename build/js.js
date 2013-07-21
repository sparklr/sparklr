var fs = require("fs");
var os = require("os");
var toolbox = require("./toolbox");

exports.build = function(templateData, callback) {
	console.log("Building JS...");

	buildJSFromHeaderFile("../static/templates/headers.html", templateData, function(jsHash) {
		global.buildData.jsHash_frontend = jsHash;
		buildJSFromHeaderFile("../static/templates/external.html", "", function(jsHash) {
			global.buildData.jsHash_external = jsHash;
		});

		callback();
	});
}

var buildJSFromHeaderFile = function(headerFile, prepend, callback) {
	// Load the headers file for file list
	var header = fs.readFileSync(headerFile).toString();

	// Store the concatenated JS
	var jsData = prepend;
	
	var scriptRegex = new RegExp("\\<script src=('|\")\{global.commonHost\}/(.*)('|\")", "g");

	while (match = scriptRegex.exec(header)) {
		var jsFile = match[2];
		jsData += fs.readFileSync("../static/" + jsFile).toString();
	}

	// Uglify it (compress it)
	var uglify = require("uglify-js");
	var result = uglify.minify(jsData, { fromString: true });

	var jsHash = toolbox.sha1(result.code);

	fs.writeFileSync("out/" + jsHash + ".js", result.code);
	console.log("JS written: " + jsHash);
	
	callback(jsHash);
}
