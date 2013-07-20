var fs = require("fs");

var templateData = "";
var templateFormatter = require("../static/templates.js");

exports.build = function(callback) {
	console.log("Building templates...");

	fs.readdir("../static/templates", function(err, files) {
		for (var i = 0; i < files.length; i++) {
			var data = fs.readFileSync("../static/templates/" + files[i]);
			var id = files[i].split(".");
			id = id[0];

			data = templateFormatter.t(data.toString());
			// escape 
			data = data.replace(/\\/g, "\\\\");
			data = data.replace(/\"/g, "\\\"");

			templateData += "TEMPLATES['"+id+"'] = \"" + data + "\";\n";
		}

		console.log("Writing ../static/out/templates.js");
		callback(templateData);
	});

}

