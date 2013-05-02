var fs = require("fs");

// Compile the templates

var templateData = "";
var templateFormatter = require("../static/templates.js");

fs.readdir("../static/templates", function(err, files) {
	for (var i = 0; i < files.length; i++) {
		console.log("Compiling " + files[i]);
		var data = fs.readFileSync("../static/templates/" + files[i]);
		var id = files[i].split(".");
			id = id[0];

		console.log("TemplateID: " + id);
		data = templateFormatter.t(data.toString());
		
		// escape 
		data = data.replace(/\\/g, "\\\\");
		data = data.replace(/\"/g, "\\\"");

		templateData += "TEMPLATES['"+id+"'] = \"" + data + "\";\n";
	}

	console.log("Writing ../static/out/templates.js");
	fs.writeFile("../static/out/templates.js", templateData);
});

