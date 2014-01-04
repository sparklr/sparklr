var fs = require("fs");

var templateFormatter = require("../static/templates.js");

exports.build = function(dir, callback) {
	console.log("Building templates...");

	var templateData = "var TEMPLATES = [];";

	fs.readdir(dir, function(err, files) {
		for (var i = 0; i < files.length; i++) {
			var data = fs.readFileSync(dir + "/" + files[i]);
			var id = files[i].split(".");
			id = id[0];

			data = templateFormatter.t(data.toString());
			// escape 
			data = data.replace(/\\/g, "\\\\");
			data = data.replace(/\"/g, "\\\"");

			templateData += "TEMPLATES['"+id+"'] = \"" + data + "\";\n";
		}

		callback(templateData);
	});

}

