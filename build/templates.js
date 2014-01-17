var fs = require("fs");

var templateFormatter = require("../static/templates.js");

exports.build = function(callback) {
	console.log("Building templates...");

	var templateData = "var TEMPLATES = [];var CONTROLLERS = [];";

	fs.readdir("../templates", function(err, files) {
		for (var i = 0; i < files.length; i++) {
			var data = fs.readFileSync("../templates/" + files[i]);
			var id = files[i].split(".");
			id = id[0];

			data = templateFormatter.t(data.toString());
			// escape 
			data = data.replace(/\\/g, "\\\\");
			data = data.replace(/\"/g, "\\\"");

			templateData += "TEMPLATES['"+id+"'] = \"" + data + "\";\n";
		}
		fs.readdir("../controllers", function(err, files) {
			for (var i = 0; i < files.length; i++) {
				var data = fs.readFileSync("../controllers/" + files[i]).toString();
				var id = files[i].split(".");
				id = id[0];

				// escape 
				data = data.replace(/\\/g, "\\\\");
				data = data.replace(/\"/g, "\\\"");

				templateData += "CONTROLLERS['"+id+"'] = \"" + data + "\";\n";
			}
			callback(templateData);
		});
	});

}

