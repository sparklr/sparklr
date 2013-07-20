var fs = require("fs");
var os = require("os");
var toolbox = require("./toolbox");

exports.build = function(templateData, callback) {
	console.log("Building JS...");

	// Load the headers_test file for file list
	var header = fs.readFileSync("../static/templates/headers_test.html").toString();

	// Store the concatenated JS
	var jsData = "";
	
	var scriptRegex = new RegExp("\\<script(.*)src=('|\")\{global.commonHost\}/(.*)('|\")", "g");

	while (match = scriptRegex.exec(header)) {
		var jsFile = match[3];
		jsData += fs.readFileSync("../static/" + jsFile).toString();
	}

	jsData += templateData;

	// Uglify it (compress it)
	var uglify = require("uglify-js");
	var result = uglify.minify(jsData, { fromString: true });

	var jsHash = toolbox.sha1(result.code);

	fs.writeFileSync("out/" + jsHash + ".js", result.code);
	console.log("JS written: " + jsHash);
	
	callback(jsHash);
}

