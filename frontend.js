var fs = require("fs");
var templates = require("../p18/static/templates");

exports.run = function(user, request, response) {
	response.writeHead(200, { "Content-type": "text/html" });

	fs.readFile("./frontend.html", function(err,data) {
		data = data.toString();
		var s = data.split("<require ");
		s = s[1].split(">");
		s = s[0].split(",");
		var scripts = "";
		for (var i = 0; i < s.length; i++)
			scripts += "<script src='"+global.commonHost+s[i]+"'></script>";

		eval(templates.t(data.toString()));
		html = html.replace("</head>", scripts + "</head>");
		response.write(html + " DBG: " + user.id);
		response.end();
	
	});
}
