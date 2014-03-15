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

			console.log(files[i]);

			data = templateFormatter.t(data.toString());

			templateData += "TEMPLATES['"+id+"'] = function(it){" + data + "};\n";

			eval(templateData);

		}
		callback(templateData);
	});
}

